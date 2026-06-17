import { Resend } from "resend";

let resend: Resend | null = null;

/**
 * Lazily-constructed Resend client (singleton). Installed but not configured
 * in Session 1. Transactional email (dues reminders, violation notices) is
 * built in a later session.
 */
export function getResend(): Resend {
  if (resend) return resend;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("Missing RESEND_API_KEY");
  }

  resend = new Resend(key);
  return resend;
}

/** Default from-address for transactional email. */
export const EMAIL_FROM = "Lotly <noreply@lotly.app>";
