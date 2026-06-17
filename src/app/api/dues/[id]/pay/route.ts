import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCommunityIdFromHeaders } from "@/lib/auth";
import { getCommunityById } from "@/lib/db/communities";
import { getDuesById } from "@/lib/db/dues";
import { getMemberByClerkId } from "@/lib/db/members";
import { createDuesPaymentIntent } from "@/lib/stripe/payments";

/**
 * POST /api/dues/[id]/pay
 *
 * Starts an ACH payment for a dues charge. Returns a PaymentIntent
 * client_secret (and the connected account id) for the browser to complete via
 * Stripe Financial Connections. A resident may only pay their own charge.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/dues/[id]/pay">,
): Promise<Response> {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: duesId } = await ctx.params;

  try {
    const member = await getMemberByClerkId(userId);
    if (!member || member.community_id !== communityId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dues = await getDuesById(communityId, duesId);
    if (!dues) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Residents pay only their own dues.
    if (dues.member_id !== member.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (dues.status === "paid") {
      return NextResponse.json({ error: "Already paid" }, { status: 409 });
    }

    const community = await getCommunityById(communityId);
    if (!community?.stripe_account_id || !community.stripe_onboarding_complete) {
      return NextResponse.json(
        { error: "This community isn't set up to accept payments yet." },
        { status: 409 },
      );
    }

    const { clientSecret } = await createDuesPaymentIntent({
      community,
      dues,
      member,
    });

    return NextResponse.json({
      clientSecret,
      connectedAccountId: community.stripe_account_id,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (err) {
    console.error("POST /api/dues/[id]/pay failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
