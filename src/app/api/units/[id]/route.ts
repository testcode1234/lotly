import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { updateUnit, deleteUnit } from "@/lib/db/units";
import type { UnitUpdate } from "@/types";

/** PATCH /api/units/[id] — update a unit (board_admin only). */
export async function PATCH(
  req: Request,
  ctx: RouteContext<"/api/units/[id]">,
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
  let body: UnitUpdate;
  try {
    const { id: _i, community_id: _c, ...rest } = (await req.json()) as UnitUpdate & {
      id?: string;
      community_id?: string;
    };
    body = rest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const unit = await updateUnit(communityId, id, body);
    return NextResponse.json({ unit });
  } catch (err) {
    console.error("PATCH /api/units/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** DELETE /api/units/[id] — delete a unit (board_admin only). */
export async function DELETE(
  req: Request,
  ctx: RouteContext<"/api/units/[id]">,
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
    await deleteUnit(communityId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/units/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
