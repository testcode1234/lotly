import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMemberByClerkId } from "@/lib/db/members";
import { getCommunityById } from "@/lib/db/communities";
import { createAccountOnboardingLink } from "@/lib/stripe/connect";

/**
 * GET /api/onboarding/refresh?communityId=...
 *
 * Stripe Express onboarding `refresh_url` — hit when the original (short-lived)
 * account link expires. Mints a fresh link and bounces the board back into
 * Stripe-hosted onboarding.
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

  const member = await getMemberByClerkId(userId);
  if (!member || member.community_id !== communityId) {
    return NextResponse.redirect(new URL("/onboarding", url.origin));
  }

  try {
    const community = await getCommunityById(communityId);
    if (!community?.stripe_account_id) {
      return NextResponse.redirect(new URL("/onboarding", url.origin));
    }

    const link = await createAccountOnboardingLink({
      accountId: community.stripe_account_id,
      refreshUrl: `${url.origin}/api/onboarding/refresh?communityId=${communityId}`,
      returnUrl: `${url.origin}/api/onboarding/return?communityId=${communityId}`,
    });
    return NextResponse.redirect(link.url);
  } catch (err) {
    console.error("GET /api/onboarding/refresh failed:", err);
    return NextResponse.redirect(new URL("/onboarding?error=1", url.origin));
  }
}
