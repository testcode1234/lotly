import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMemberByClerkId } from "@/lib/db/members";
import { getCommunityById, updateCommunity } from "@/lib/db/communities";
import { getAccountStatus } from "@/lib/stripe/connect";

/**
 * GET /api/onboarding/return?communityId=...
 *
 * Stripe Express onboarding `return_url`. Re-checks the connected account's
 * status and, once Stripe reports the details submitted, flips
 * `stripe_onboarding_complete` and sends the board to the dashboard. If they
 * bailed early, sends them back to /onboarding to resume.
 */
export async function GET(req: Request): Promise<Response> {
  const { userId } = await auth();
  const url = new URL(req.url);
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", url.origin));
  }

  const communityId = url.searchParams.get("communityId");
  if (!communityId) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  // Tenant check: the caller must be the board_admin who created this community.
  const member = await getMemberByClerkId(userId);
  if (!member || member.community_id !== communityId) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  try {
    const community = await getCommunityById(communityId);
    if (!community?.stripe_account_id) {
      return NextResponse.redirect(new URL("/onboarding", url.origin));
    }

    const status = await getAccountStatus(community.stripe_account_id);
    if (status.detailsSubmitted && !community.stripe_onboarding_complete) {
      await updateCommunity(communityId, { stripe_onboarding_complete: true });
    }

    const dest = status.detailsSubmitted ? "/dashboard" : "/onboarding?incomplete=1";
    return NextResponse.redirect(new URL(dest, url.origin));
  } catch (err) {
    console.error("GET /api/onboarding/return failed:", err);
    return NextResponse.redirect(new URL("/onboarding?error=1", url.origin));
  }
}
