import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";

/**
 * Stripe webhook endpoint. Verifies the signature with
 * stripe.webhooks.constructEvent and STRIPE_WEBHOOK_SECRET. Event handling
 * (dues payment reconciliation, Connect account updates) is built in Session 2;
 * for now verified events are acknowledged so Stripe stops retrying.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return new Response("Server misconfigured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    console.error("Stripe webhook verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Session 2: handle payment_intent.succeeded, account.updated, etc.
  console.log(`Received Stripe event: ${event.type}`);

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}
