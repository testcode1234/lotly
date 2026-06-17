import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { getMembersByCommunity, createMember } from "@/lib/db/members";
import type { MemberInsert } from "@/types";

/** GET /api/members — all members in the caller's community. */
export async function GET(req: Request) {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (getRoleFromHeaders(req) === "resident") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const members = await getMembersByCommunity(communityId);
    return NextResponse.json({ members });
  } catch (err) {
    console.error("GET /api/members failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST /api/members — invite/create a member (board_admin only). */
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

  let body: Omit<MemberInsert, "community_id">;
  try {
    // community_id is intentionally dropped here — it is forced from the
    // session-derived header, never trusted from the request body.
    const { community_id: _ignored, ...rest } = (await req.json()) as MemberInsert;
    body = rest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  try {
    const member = await createMember(communityId, body);
    return NextResponse.json({ member }, { status: 201 });
  } catch (err) {
    console.error("POST /api/members failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
