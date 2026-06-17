import type Stripe from "stripe";
import { getStripe } from "./client";

/**
 * Stripe Connect helpers for HOA onboarding.
 *
 * Each community is a Stripe **Express** connected account. The platform
 * (Lotly) never holds the funds — dues are charged directly on the connected
 * account (see src/lib/stripe/payments.ts). Boards complete identity/bank
 * setup through Stripe-hosted Express onboarding.
 */

/** Create an Express connected account for a community. */
export async function createConnectAccount(params: {
  communityId: string;
  email?: string | null;
  communityName: string;
}): Promise<Stripe.Account> {
  return getStripe().accounts.create({
    type: "express",
    business_type: "non_profit",
    email: params.email ?? undefined,
    capabilities: {
      transfers: { requested: true },
      us_bank_account_ach_payments: { requested: true },
    },
    business_profile: {
      name: params.communityName,
      product_description: "HOA dues collection",
    },
    // Lets us reconcile webhook account.* events back to a community.
    metadata: { community_id: params.communityId },
  });
}

/**
 * Create a one-time, short-lived Express onboarding link. The board is
 * redirected here to submit identity + bank details. `refresh_url` is hit if
 * the link expires; `return_url` is hit when they finish.
 */
export async function createAccountOnboardingLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<Stripe.AccountLink> {
  return getStripe().accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: "account_onboarding",
  });
}

/**
 * Whether a connected account can actually accept charges. `details_submitted`
 * means the board finished the form; `charges_enabled` means Stripe cleared
 * them to process payments.
 */
export async function getAccountStatus(accountId: string): Promise<{
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}> {
  const account = await getStripe().accounts.retrieve(accountId);
  return {
    detailsSubmitted: account.details_submitted ?? false,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
  };
}
