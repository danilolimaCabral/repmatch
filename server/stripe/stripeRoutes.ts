import Stripe from "stripe";
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { representatives, companies, jobs, managerCredits, managerUnlocks } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { STRIPE_PRODUCTS, ProductKey } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

export const stripeRouter = Router();

// ─── Create Checkout Session ─────────────────────────────────────────────────
stripeRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { productKey, userId, userEmail, userName, jobId, repId } = req.body as {
      productKey: ProductKey;
      userId: number;
      userEmail: string;
      userName: string;
      jobId?: number;
      repId?: number;
    };

    const product = STRIPE_PRODUCTS[productKey];
    if (!product) {
      return res.status(400).json({ error: "Produto inválido" });
    }
    if (productKey === "UNLOCK_CONTACT") {
      return res.status(400).json({ error: "Use o carrinho de desbloqueios e pague via PIX para solicitar a liberação manual dos contatos." });
    }

    const origin = req.headers.origin ?? "http://localhost:3000";

    // Build success URL for the product dashboard.
    let successPath = `/dashboard/${product.userType === "company" ? "company" : product.userType === "manager" ? "manager" : "rep"}?payment=success`;
    if (productKey === "FEATURED_JOB" && jobId) {
      successPath += `&job_id=${jobId}`;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer_email: userEmail,
      client_reference_id: userId.toString(),
      allow_promotion_codes: true,
      metadata: {
        user_id: userId.toString(),
        customer_email: userEmail,
        customer_name: userName,
        product_key: productKey,
        job_id: jobId?.toString() ?? "",
        rep_id: repId?.toString() ?? "",
      },
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}/?payment=cancelled`,
    };

    if (product.interval) {
      // Subscription
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      });
      const price = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.priceAmount,
        currency: product.currency,
        recurring: { interval: product.interval },
      });
      sessionParams.mode = "subscription";
      sessionParams.line_items = [{ price: price.id, quantity: 1 }];
    } else {
      // One-time payment
      sessionParams.mode = "payment";
      sessionParams.line_items = [
        {
          price_data: {
            currency: product.currency,
            unit_amount: product.priceAmount,
            product_data: { name: product.name, description: product.description },
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.json({ url: session.url });
  } catch (err) {
    console.error("[Stripe] Checkout error:", err);
    return res.status(500).json({ error: "Erro ao criar sessão de pagamento" });
  }
});

// ─── Webhook ─────────────────────────────────────────────────────────────────
stripeRouter.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  // Test event bypass
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Webhook] Event: ${event.type} | ${event.id}`);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const productKey = session.metadata?.product_key as ProductKey | undefined;
      const userId = parseInt(session.metadata?.user_id ?? "0");

      if (!productKey || !userId) return res.json({ received: true });

      const db = await getDb();
      if (!db) return res.json({ received: true });

      const product = STRIPE_PRODUCTS[productKey];
      if (!product) return res.json({ received: true });

      // ── Legacy UNLOCK_CONTACT ─────────────────────────────────────────────────
      if (productKey === "UNLOCK_CONTACT") {
        console.warn("[Webhook] Legacy direct contact unlock received; no automatic release is performed.");
        return res.json({ received: true });
      }

      // ── Handle FEATURED_JOB ─────────────────────────────────────────────────
      if (productKey === "FEATURED_JOB") {
        const jobId = parseInt(session.metadata?.job_id ?? "0");
        if (jobId) {
          await db.update(jobs).set({ isFeatured: true }).where(eq(jobs.id, jobId));
          console.log(`[Webhook] Job ${jobId} marked as featured`);
        }
        return res.json({ received: true });
      }

      // ── Handle MANAGER credit packages ─────────────────────────────────────
      if (productKey.startsWith("MANAGER_")) {
        const managerProduct = STRIPE_PRODUCTS[productKey] as { credits: number; interval: string | null };
        const creditsToAdd = managerProduct.credits;
        const isUnlimited = managerProduct.interval === "month" && creditsToAdd >= 9999;
        const unlimitedExpiresAt = isUnlimited ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

        // Upsert manager_credits row
        const existing = await db.select().from(managerCredits).where(eq(managerCredits.userId, userId)).limit(1);
        if (existing.length === 0) {
          await db.insert(managerCredits).values({
            userId,
            credits: isUnlimited ? 0 : creditsToAdd,
            totalPurchased: creditsToAdd,
            isUnlimited,
            unlimitedExpiresAt: unlimitedExpiresAt ?? undefined,
            stripeCustomerId: session.customer?.toString() ?? null,
          });
        } else {
          await db.update(managerCredits)
            .set({
              credits: isUnlimited ? existing[0].credits : existing[0].credits + creditsToAdd,
              totalPurchased: existing[0].totalPurchased + creditsToAdd,
              isUnlimited: isUnlimited || existing[0].isUnlimited,
              unlimitedExpiresAt: unlimitedExpiresAt ?? existing[0].unlimitedExpiresAt,
              stripeCustomerId: session.customer?.toString() ?? existing[0].stripeCustomerId,
            })
            .where(eq(managerCredits.userId, userId));
        }
        console.log(`[Webhook] Manager ${userId} credited with ${creditsToAdd} credits (unlimited: ${isUnlimited})`);
        return res.json({ received: true });
      }

      // ── Handle subscription upgrades ────────────────────────────────────────
      if (!product.tier) return res.json({ received: true });

      if (product.userType === "representative") {
        await db.update(representatives)
          .set({ subscriptionTier: product.tier as "free" | "bronze" | "prata" | "ouro" })
          .where(eq(representatives.userId, userId));
        console.log(`[Webhook] Rep ${userId} upgraded to ${product.tier}`);
      } else if (product.userType === "company") {
        await db.update(companies)
          .set({ subscriptionTier: product.tier as "starter" | "pro" | "enterprise" })
          .where(eq(companies.userId, userId));
        console.log(`[Webhook] Company ${userId} upgraded to ${product.tier}`);
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
