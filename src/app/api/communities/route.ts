import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import {
  getCommunityById,
  getCommunityStats,
  updateCommunity,
} from "@/lib/db/communities";
import type { CommunityUpdate } from "@/types";

/** GET /api/communities — the caller's own community plus dashboard stats. */
export async function GET(req: Request) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [community, stats] = await Promise.all([
      getCommunityById(communityId),
      getCommunityStats(communityId),
    ]);
    if (!community) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ community, stats });
  } catch (err) {
    console.error("GET /api/communities failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** PATCH /api/communities — update the caller's community (board_admin only). */
export async function PATCH(req: Request) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromHeaders(req) !== "board_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: CommunityUpdate;
  try {
    body = (await req.json()) as CommunityUpdate;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const community = await updateCommunity(communityId, body);
    return NextResponse.json({ community });
  } catch (err) {
    console.error("PATCH /api/communities failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
