import type { Community, Violation, Unit, Member } from "@/types";

export type ViolationNoticePdfInput = {
  community: Community;
  violation: Violation;
  unit: Unit | null;
  member: Member | null;
};

/**
 * Generate a violation-notice PDF and return its bytes. Session 1 stub — the
 * PDF library and layout land in a later session. Throws so callers don't
 * silently produce empty files.
 */
export async function generateViolationNoticePdf(
  _input: ViolationNoticePdfInput,
): Promise<Uint8Array> {
  throw new Error("generateViolationNoticePdf is not implemented yet");
}
