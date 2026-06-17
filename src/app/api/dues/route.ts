import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { getDuesByCommunity, createDuesCharge } from "@/lib/db/dues";
import type { DuesLedgerInsert } from "@/types";

/** GET /api/dues — dues ledger for the caller's community (board only). */
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
    const dues = await getDuesByCommunity(communityId);
    return NextResponse.json({ dues });
  } catch (err) {
    console.error("GET /api/dues failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/** POST /api/dues — create a dues charge (board_admin only). */
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

  let body: Omit<DuesLedgerInsert, "community_id">;
  try {
    const { community_id: _ignored, ...rest } =
      (await req.json()) as DuesLedgerInsert;
    body = rest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !body.member_id ||
    body.amount == null ||
    body.period_year == null ||
    body.period_month == null ||
    !body.due_date
  ) {
    return NextResponse.json(
      { error: "member_id, amount, period_year, period_month, due_date are required" },
      { status: 400 },
    );
  }

  try {
    const charge = await createDuesCharge(communityId, body);
    return NextResponse.json({ charge }, { status: 201 });
  } catch (err) {
    console.error("POST /api/dues failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
