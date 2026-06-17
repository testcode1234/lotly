import Stripe from "stripe";

let stripe: Stripe | null = null;

/**
 * Lazily-constructed Stripe client (singleton). Stripe Connect is installed
 * but not configured in Session 1 — this just wires the SDK so later sessions
 * can build dues collection on top of it.
 *
 * Throws if STRIPE_SECRET_KEY is missing, so callers fail loudly rather than
 * silently no-op.
 */
export function getStripe(): Stripe {
  if (stripe) return stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  stripe = new Stripe(key, {
    // Pinned to the version the installed SDK (v22) is generated against.
    apiVersion: "2026-05-27.dahlia",
    typescript: true,
  });
  return stripe;
}
