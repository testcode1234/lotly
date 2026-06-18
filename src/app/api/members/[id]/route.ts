import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { updateMember, deleteMember } from "@/lib/db/members";
import type { MemberUpdate } from "@/types";

// Only these fields are board-editable; everything else (id, community_id,
// clerk_id, user_id, stripe ids, timestamps) is ignored if sent.
const EDITABLE: (keyof MemberUpdate)[] = [
  "email",
  "first_name",
  "last_name",
  "phone",
  "role",
  "status",
  "unit_id",
  "dues_amount",
];

function pick(body: Record<string, unknown>): MemberUpdate {
  const out: MemberUpdate = {};
  for (const key of EDITABLE) {
    if (key in body) (out as Record<string, unknown>)[key] = body[key];
  }
  return out;
}

/** PATCH /api/members/[id] — update a member (board_admin only). */
export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/members/[id]">,
) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (getRoleFromHeaders(req) !== "board_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  let body: MemberUpdate;
  try {
    body = pick((await req.json()) as Record<string, unknown>);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const member = await updateMember(communityId, id, body);
    return NextResponse.json({ member });
  } catch (err) {
    console.error("PATCH /api/members/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE /api/members/[id] — remove a member (board_admin only). */
export async function DELETE(
  req: Request,
  ctx: RouteContext<"/api/members/[id]">,
) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (getRoleFromHeaders(req) !== "board_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  try {
    await deleteMember(communityId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/members/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
