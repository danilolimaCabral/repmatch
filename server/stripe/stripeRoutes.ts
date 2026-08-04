import Stripe from "stripe";
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { representatives, companies, unlockedContacts, jobs, managerCredits, managerUnlocks } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
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

    const origin = req.headers.origin ?? "http://localhost:3000";

    // Build success URL — include rep_id for UNLOCK_CONTACT so frontend can show the contact
    let successPath = `/dashboard/${product.userType === "company" ? "company" : product.userType === "manager" ? "manager" : "rep"}?payment=success`;
    if (productKey === "UNLOCK_CONTACT" && repId) {
      successPath += `&rep_id=${repId}`;
    }
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

      // ── Handle UNLOCK_CONTACT ────────────────────────────────────────────────
      if (productKey === "UNLOCK_CONTACT") {
        const repId = parseInt(session.metadata?.rep_id ?? "0");
        if (!repId) {
          console.warn("[Webhook] UNLOCK_CONTACT missing rep_id in metadata");
          return res.json({ received: true });
        }

        // Find the company for this user
        const [company] = await db
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.userId, userId))
          .limit(1);

        if (!company) {
          console.warn(`[Webhook] No company found for userId ${userId}`);
          return res.json({ received: true });
        }

        // Check if already unlocked to avoid duplicates
        const [existing] = await db
          .select({ id: unlockedContacts.id })
          .from(unlockedContacts)
          .where(and(
            eq(unlockedContacts.companyId, company.id),
            eq(unlockedContacts.representativeId, repId)
          ))
          .limit(1);

        if (!existing) {
          await db.insert(unlockedContacts).values({
            companyId: company.id,
            representativeId: repId,
            pricePaid: "29.00",
            stripePaymentId: session.payment_intent?.toString() ?? session.id,
          });
          console.log(`[Webhook] Contact unlocked: company ${company.id} → rep ${repId}`);

          // Send confirmation email to company
          try {
            const { users, representatives } = await import("../../drizzle/schema");
            const [companyUser] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
            const [repData] = await db.select({ fullName: representatives.fullName, phone: representatives.phone, region: representatives.region, segment: representatives.segment }).from(representatives).where(eq(representatives.id, repId)).limit(1);
            const [repUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, repData ? (await db.select({ userId: representatives.userId }).from(representatives).where(eq(representatives.id, repId)).limit(1))[0]?.userId : 0)).limit(1);
            if (companyUser?.email && repData) {
              const { sendContactUnlockedEmail } = await import("../email");
              sendContactUnlockedEmail({
                to: companyUser.email,
                companyName: companyUser.name ?? "Empresa",
                repName: repData.fullName,
                repPhone: repData.phone ?? undefined,
                repEmail: repUser?.email ?? undefined,
                repRegion: repData.region ?? "",
                repSegment: repData.segment ?? "",
                amountPaid: "29,00",
              }).catch((e) => console.warn("[Email] contact unlocked email failed:", e));
            }
          } catch (e) { console.warn("[Webhook] email for UNLOCK_CONTACT failed:", e); }
        } else {
          console.log(`[Webhook] Contact already unlocked: company ${company.id} → rep ${repId}`);
        }

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
        // Send subscription confirmation email
        try {
          const { users: usersTable } = await import("../../drizzle/schema");
          const [u] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
          if (u?.email) {
            const { sendSubscriptionConfirmedEmail } = await import("../email");
            const tierPrices: Record<string, string> = { bronze: "9,99", prata: "19,90", ouro: "29,90" };
            sendSubscriptionConfirmedEmail({
              to: u.email,
              name: u.name ?? "Representante",
              planName: product.tier!.charAt(0).toUpperCase() + product.tier!.slice(1),
              planPrice: tierPrices[product.tier!] ?? "--",
              userType: "representative",
            }).catch((e) => console.warn("[Email] subscription rep email failed:", e));
          }
        } catch (e) { console.warn("[Webhook] subscription rep email error:", e); }
      } else if (product.userType === "company") {
        await db.update(companies)
          .set({ subscriptionTier: product.tier as "starter" | "pro" | "enterprise" })
          .where(eq(companies.userId, userId));
        console.log(`[Webhook] Company ${userId} upgraded to ${product.tier}`);
        // Send subscription confirmation email
        try {
          const { users: usersTable } = await import("../../drizzle/schema");
          const [u] = await db.select({ email: usersTable.email, name: usersTable.name }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
          if (u?.email) {
            const { sendSubscriptionConfirmedEmail } = await import("../email");
            const tierPrices: Record<string, string> = { starter: "99,00", pro: "299,00", enterprise: "999,00" };
            sendSubscriptionConfirmedEmail({
              to: u.email,
              name: u.name ?? "Empresa",
              planName: product.tier!.charAt(0).toUpperCase() + product.tier!.slice(1),
              planPrice: tierPrices[product.tier!] ?? "--",
              userType: "company",
            }).catch((e) => console.warn("[Email] subscription company email failed:", e));
          }
        } catch (e) { console.warn("[Webhook] subscription company email error:", e); }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
