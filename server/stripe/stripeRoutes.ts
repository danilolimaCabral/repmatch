import Stripe from "stripe";
import { Router, Request, Response } from "express";
import { getDb } from "../db";
import { representatives, companies } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { STRIPE_PRODUCTS, ProductKey } from "./products";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

export const stripeRouter = Router();

// ─── Create Checkout Session ─────────────────────────────────────────────────
stripeRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const { productKey, userId, userEmail, userName, jobId } = req.body as {
      productKey: ProductKey;
      userId: number;
      userEmail: string;
      userName: string;
      jobId?: number;
    };

    const product = STRIPE_PRODUCTS[productKey];
    if (!product) {
      return res.status(400).json({ error: "Produto inválido" });
    }

    const origin = req.headers.origin ?? "http://localhost:3000";

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
      },
      success_url: `${origin}/dashboard/${product.userType === "company" ? "company" : "rep"}?payment=success`,
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

      const product = STRIPE_PRODUCTS[productKey];
      if (!product || !product.tier) return res.json({ received: true });

      const db = await getDb();
      if (!db) return res.json({ received: true });

      if (product.userType === "representative") {
        await db.update(representatives)
          .set({ subscriptionTier: product.tier as "free" | "premium" | "elite" })
          .where(eq(representatives.userId, userId));
        console.log(`[Webhook] Rep ${userId} upgraded to ${product.tier}`);
      } else if (product.userType === "company") {
        await db.update(companies)
          .set({ subscriptionTier: product.tier as "starter" | "pro" | "enterprise" })
          .where(eq(companies.userId, userId));
        console.log(`[Webhook] Company ${userId} upgraded to ${product.tier}`);
      }

      // Handle featured job
      if (productKey === "FEATURED_JOB" && session.metadata?.job_id) {
        const jobId = parseInt(session.metadata.job_id);
        if (jobId) {
          const { jobs } = await import("../../drizzle/schema");
          await db.update(jobs).set({ isFeatured: true }).where(eq(jobs.id, jobId));
        }
      }
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("[Webhook] Processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
});
