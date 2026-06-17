import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { updateDuesCharge } from "@/lib/db/dues";
import { getCommunityByStripeAccountId, updateCommunity } from "@/lib/db/communities";

/**
 * Stripe webhook endpoint. Verifies the signature with
 * stripe.webhooks.constructEvent and STRIPE_WEBHOOK_SECRET, then reconciles
 * dues payments and Connect account status back into Supabase.
 *
 * Connect events for direct charges arrive with `event.account` set to the
 * connected account; dues events also carry community_id/dues_id in metadata,
 * which is what we reconcile against.
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

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        await reconcileDuesPayment(event.data.object, "succeeded");
        break;
      }
      case "payment_intent.payment_failed": {
        await reconcileDuesPayment(event.data.object, "failed");
        break;
      }
      case "account.updated": {
        await reconcileAccount(event.data.object);
        break;
      }
      default:
        // Acknowledge everything else so Stripe stops retrying.
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler error (${event.type}):`, err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

/** Mark the matching dues row paid (or note the failure) from PI metadata. */
async function reconcileDuesPayment(
  pi: Stripe.PaymentIntent,
  outcome: "succeeded" | "failed",
): Promise<void> {
  const communityId = pi.metadata?.community_id;
  const duesId = pi.metadata?.dues_id;
  if (!communityId || !duesId) {
    // Not a dues PaymentIntent we created — nothing to reconcile.
    return;
  }

  if (outcome === "succeeded") {
    await updateDuesCharge(communityId, duesId, {
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_payment_intent_id: pi.id,
    });
  } else {
    const reason = pi.last_payment_error?.message ?? "ACH payment failed";
    await updateDuesCharge(communityId, duesId, {
      stripe_payment_intent_id: pi.id,
      notes: `Payment failed: ${reason}`,
    });
  }
}

/** Keep stripe_onboarding_complete in sync when Stripe updates the account. */
async function reconcileAccount(account: Stripe.Account): Promise<void> {
  const community = await getCommunityByStripeAccountId(account.id);
  if (!community) return;

  const complete = (account.details_submitted ?? false) &&
    (account.charges_enabled ?? false);
  if (complete !== community.stripe_onboarding_complete) {
    await updateCommunity(community.id, { stripe_onboarding_complete: complete });
  }
}
