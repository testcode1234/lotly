import type Stripe from "stripe";
import { getStripe } from "./client";
import type { Community, DuesLedger, Member } from "@/types";

/** Total owed on a dues row in cents (base amount + any applied late fee). */
export function duesAmountCents(dues: DuesLedger): number {
  const dollars = Number(dues.amount) + Number(dues.late_fee_applied ?? 0);
  return Math.round(dollars * 100);
}

/**
 * Create an ACH (us_bank_account) PaymentIntent for a dues charge as a DIRECT
 * charge on the community's connected account — funds settle to the HOA, never
 * the platform. Bank linking uses Stripe Financial Connections (NOT Plaid).
 *
 * The returned client_secret is completed in the browser with Stripe.js, which
 * must be initialized with the same connected account (stripeAccount).
 */
export async function createDuesPaymentIntent(params: {
  community: Community;
  dues: DuesLedger;
  member: Member;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const { community, dues, member } = params;
  if (!community.stripe_account_id) {
    throw new Error("Community has no connected Stripe account");
  }

  // No payment_method_data here: the bank account is linked + attached in the
  // browser via Financial Connections (collectBankAccountForPayment).
  const intent = await getStripe().paymentIntents.create(
    {
      amount: duesAmountCents(dues),
      currency: "usd",
      payment_method_types: ["us_bank_account"],
      payment_method_options: {
        us_bank_account: {
          financial_connections: { permissions: ["payment_method", "balances"] },
          verification_method: "automatic",
        },
      },
      // Reconciled in the Stripe webhook back to the ledger row + tenant.
      metadata: {
        dues_id: dues.id,
        community_id: community.id,
        member_id: member.id,
      },
    },
    // Direct charge on the connected account.
    { stripeAccount: community.stripe_account_id },
  );

  if (!intent.client_secret) {
    throw new Error("Stripe did not return a client secret");
  }
  return { clientSecret: intent.client_secret, paymentIntentId: intent.id };
}

/** Narrowed shape of the PaymentIntent fields the webhook reconciler reads. */
export type ReconcilablePaymentIntent = Pick<
  Stripe.PaymentIntent,
  "id" | "metadata"
>;
