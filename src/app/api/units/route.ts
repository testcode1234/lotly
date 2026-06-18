import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { getUnitsByCommunity, createUnit } from "@/lib/db/units";
import type { UnitInsert } from "@/types";

function isBoard(req: Request): boolean {
  const role = getRoleFromHeaders(req);
  return role === "board_admin" || role === "board_member";
}

/** GET /api/units — all units in the caller's community (board only). */
export async function GET(req: Request) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isBoard(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const units = await getUnitsByCommunity(communityId);
    return NextResponse.json({ units });
  } catch (err) {
    console.error("GET /api/units failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST /api/units — create a unit (board_admin only). */
export async function POST(req: Request) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (getRoleFromHeaders(req) !== "board_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Omit<UnitInsert, "community_id">;
  try {
    // community_id forced from the session header, never the request body.
    const { community_id: _ignored, ...rest } = (await req.json()) as UnitInsert;
    body = rest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.unit_number?.trim()) {
    return NextResponse.json(
      { error: "unit_number is required" },
      { status: 400 },
    );
  }

  try {
    const unit = await createUnit(communityId, body);
    return NextResponse.json({ unit }, { status: 201 });
  } catch (err) {
    console.error("POST /api/units failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
