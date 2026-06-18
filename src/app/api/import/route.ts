import { NextResponse } from "next/server";
import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { parseCsvWithHeader } from "@/lib/csv";
import { getUnitsByCommunity, createUnit } from "@/lib/db/units";
import { getMembersByCommunity, createMember } from "@/lib/db/members";
import type { Role } from "@/types";

const VALID_ROLES: Role[] = ["board_admin", "board_member", "resident"];

// Accept a few common header spellings for each field.
function field(row: Record<string, string>, ...names: string[]): string {
  for (const n of names) {
    if (row[n]) return row[n];
  }
  return "";
}

type ImportSummary = {
  unitsCreated: number;
  membersCreated: number;
  skipped: number;
  errors: string[];
};

/**
 * POST /api/import — bulk-import units + members from CSV (board_admin only).
 *
 * Body: { csv: string }. Each row may carry a unit and/or a member. Recognized
 * headers (case-insensitive): unit_number/unit, address, email, first_name,
 * last_name, phone, role, dues_amount. Units dedupe by unit_number; members
 * skip if the email already exists in the community.
 */
export async function POST(req: Request): Promise<Response> {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (getRoleFromHeaders(req) !== "board_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let csv: string;
  try {
    const body = (await req.json()) as { csv?: unknown };
    if (typeof body.csv !== "string" || !body.csv.trim()) {
      return NextResponse.json({ error: "csv is required" }, { status: 400 });
    }
    csv = body.csv;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = parseCsvWithHeader(csv);
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "No data rows found (need a header row + at least one row)" },
      { status: 400 },
    );
  }

  const summary: ImportSummary = {
    unitsCreated: 0,
    membersCreated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Seed lookup maps from existing data so re-imports stay idempotent.
    const [existingUnits, existingMembers] = await Promise.all([
      getUnitsByCommunity(communityId),
      getMembersByCommunity(communityId),
    ]);
    const unitIdByNumber = new Map(
      existingUnits.map((u) => [u.unit_number.toLowerCase(), u.id]),
    );
    const memberEmails = new Set(
      existingMembers.map((m) => m.email.toLowerCase()),
    );

    let lineNo = 1; // header is line 1
    for (const row of rows) {
      lineNo++;
      const unitNumber = field(row, "unit_number", "unit", "unit number");
      const email = field(row, "email").toLowerCase();

      // 1. Unit (create if new).
      let unitId: string | null = null;
      if (unitNumber) {
        const key = unitNumber.toLowerCase();
        unitId = unitIdByNumber.get(key) ?? null;
        if (!unitId) {
          try {
            const unit = await createUnit(communityId, {
              unit_number: unitNumber,
              address: field(row, "address", "unit_address") || null,
            });
            unitId = unit.id;
            unitIdByNumber.set(key, unit.id);
            summary.unitsCreated++;
          } catch {
            summary.errors.push(`Line ${lineNo}: failed to create unit "${unitNumber}"`);
          }
        }
      }

      // 2. Member (skip if no email or duplicate).
      if (!email) {
        if (!unitNumber) summary.skipped++; // row had nothing usable
        continue;
      }
      if (memberEmails.has(email)) {
        summary.skipped++;
        continue;
      }

      const roleRaw = field(row, "role").toLowerCase().replace(/\s+/g, "_");
      const role = (VALID_ROLES as string[]).includes(roleRaw)
        ? (roleRaw as Role)
        : "resident";
      const duesRaw = field(row, "dues_amount", "dues");
      const dues = duesRaw ? Number(duesRaw) : null;

      try {
        await createMember(communityId, {
          email,
          first_name: field(row, "first_name", "first name") || null,
          last_name: field(row, "last_name", "last name") || null,
          phone: field(row, "phone") || null,
          role,
          status: "invited",
          unit_id: unitId,
          dues_amount: dues != null && Number.isFinite(dues) ? dues : null,
        });
        memberEmails.add(email);
        summary.membersCreated++;
      } catch {
        summary.errors.push(`Line ${lineNo}: failed to create member "${email}"`);
      }
    }

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("POST /api/import failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
