import { NextResponse } from "next/server";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { createCommunity, updateCommunity } from "@/lib/db/communities";
import { createMember } from "@/lib/db/members";
import { upsertUserFromClerk } from "@/lib/db/users";
import {
  createConnectAccount,
  createAccountOnboardingLink,
} from "@/lib/stripe/connect";

type Body = {
  name?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
  unitCount?: unknown;
};

const str = (v: unknown): string | null =>
  typeof v === "string" && v.trim() ? v.trim() : null;

/**
 * POST /api/onboarding/community
 *
 * Bootstraps a brand-new community for the signed-in user (who has no
 * community yet). Steps:
 *   1. Create the community row in Supabase.
 *   2. Create a Stripe Express connected account; save stripe_account_id.
 *   3. Mirror the user into `users` and create their board_admin `members` row.
 *   4. Set Clerk publicMetadata { role, communityId } so the session is bound
 *      to the new tenant (stripe_onboarding_complete is flipped later, on the
 *      Stripe return — see /api/onboarding/return).
 *   5. Return a Stripe-hosted Express onboarding URL for the client to follow.
 */
export async function POST(req: Request): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = str(body.name);
  if (!name) {
    return NextResponse.json(
      { error: "Community name is required" },
      { status: 400 },
    );
  }
  const unitCount =
    typeof body.unitCount === "number" && Number.isFinite(body.unitCount)
      ? Math.max(0, Math.trunc(body.unitCount))
      : 0;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const origin = new URL(req.url).origin;

  try {
    // 1. Community row.
    const community = await createCommunity({
      name,
      address: str(body.address),
      city: str(body.city),
      state: str(body.state),
      zip: str(body.zip),
      unit_count: unitCount,
    });

    // 2. Stripe Express account + persist its id.
    const account = await createConnectAccount({
      communityId: community.id,
      email,
      communityName: name,
    });
    await updateCommunity(community.id, { stripe_account_id: account.id });

    // 3. Mirror the Clerk user + create their board_admin member record.
    const dbUser = await upsertUserFromClerk({
      clerk_id: userId,
      email: email ?? `${userId}@no-email.local`,
      first_name: user?.firstName ?? null,
      last_name: user?.lastName ?? null,
      avatar_url: user?.imageUrl ?? null,
    });
    await createMember(community.id, {
      user_id: dbUser.id,
      clerk_id: userId,
      email: email ?? `${userId}@no-email.local`,
      first_name: user?.firstName ?? null,
      last_name: user?.lastName ?? null,
      role: "board_admin",
      status: "active",
    });

    // 4. Bind the Clerk session to this tenant.
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: { role: "board_admin", communityId: community.id },
    });

    // 5. Stripe-hosted Express onboarding link.
    const link = await createAccountOnboardingLink({
      accountId: account.id,
      refreshUrl: `${origin}/api/onboarding/refresh?communityId=${community.id}`,
      returnUrl: `${origin}/api/onboarding/return?communityId=${community.id}`,
    });

    return NextResponse.json({ onboardingUrl: link.url });
  } catch (err) {
    console.error("POST /api/onboarding/community failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
