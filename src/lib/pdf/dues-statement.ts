import type { Community, DuesLedger, Member } from "@/types";

export type DuesStatementPdfInput = {
  community: Community;
  member: Member;
  ledger: DuesLedger[];
};

/**
 * Generate a dues-statement PDF for a member and return its bytes. Session 1
 * stub — implemented in a later session. Throws so callers don't silently
 * produce empty files.
 */
export async function generateDuesStatementPdf(
  _input: DuesStatementPdfInput,
): Promise<Uint8Array> {
  throw new Error("generateDuesStatementPdf is not implemented yet");
}
