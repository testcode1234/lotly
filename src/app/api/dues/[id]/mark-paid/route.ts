import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { getDuesById, updateDuesCharge } from "@/lib/db/dues";

/**
 * POST /api/dues/[id]/mark-paid
 *
 * Board-only manual reconciliation for check/cash payments. Marks a dues row
 * paid without going through Stripe.
 */
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/dues/[id]/mark-paid">,
): Promise<Response> {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = getRoleFromHeaders(req);
  if (role !== "board_admin" && role !== "board_member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: duesId } = await ctx.params;

  try {
    const dues = await getDuesById(communityId, duesId);
    if (!dues) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await updateDuesCharge(communityId, duesId, {
      status: "paid",
      paid_at: new Date().toISOString(),
      notes: "Marked paid manually (check/cash)",
    });
    return NextResponse.json({ dues: updated });
  } catch (err) {
    console.error("POST /api/dues/[id]/mark-paid failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
