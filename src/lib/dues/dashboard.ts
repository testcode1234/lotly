import { getDuesForPeriod } from "@/lib/db/dues";
import { getMembersByCommunity } from "@/lib/db/members";
import { getUnitsByCommunity } from "@/lib/db/units";
import type { DuesStatus } from "@/types";

export type DuesDashboardRow = {
  duesId: string;
  unitNumber: string;
  memberName: string;
  email: string;
  amount: number; // base + applied late fee
  lateFee: number;
  status: DuesStatus;
  dueDate: string;
  paidAt: string | null;
};

export type DuesDashboardStats = {
  collected: number;
  outstanding: number;
  collectionRate: number; // 0–1; 1 when nothing is billed
  billed: number;
};

export type DuesDashboard = {
  rows: DuesDashboardRow[];
  stats: DuesDashboardStats;
};

const OUTSTANDING: DuesStatus[] = ["pending", "late", "partial"];

/**
 * Build the board dues dashboard for one billing period: one row per dues
 * charge (enriched with member + unit), plus collection summary stats.
 */
export async function getDuesDashboard(
  communityId: string,
  year: number,
  month: number,
): Promise<DuesDashboard> {
  const [dues, members, units] = await Promise.all([
    getDuesForPeriod(communityId, year, month),
    getMembersByCommunity(communityId),
    getUnitsByCommunity(communityId),
  ]);

  const memberById = new Map(members.map((m) => [m.id, m]));
  const unitById = new Map(units.map((u) => [u.id, u]));

  const rows: DuesDashboardRow[] = dues.map((d) => {
    const member = memberById.get(d.member_id);
    const unit = d.unit_id ? unitById.get(d.unit_id) : undefined;
    const memberName =
      [member?.first_name, member?.last_name].filter(Boolean).join(" ").trim() ||
      member?.email ||
      "—";
    const lateFee = Number(d.late_fee_applied ?? 0);
    return {
      duesId: d.id,
      unitNumber: unit?.unit_number ?? "—",
      memberName,
      email: member?.email ?? "—",
      amount: Number(d.amount) + lateFee,
      lateFee,
      status: d.status,
      dueDate: d.due_date,
      paidAt: d.paid_at,
    };
  });

  // Stats: collected = paid; outstanding = pending/late/partial; rate over billed.
  let collected = 0;
  let outstanding = 0;
  for (const r of rows) {
    if (r.status === "paid") collected += r.amount;
    else if (OUTSTANDING.includes(r.status)) outstanding += r.amount;
  }
  const billed = collected + outstanding;
  const collectionRate = billed > 0 ? collected / billed : 1;

  // Sort by unit number for a stable, scannable table.
  rows.sort((a, b) =>
    a.unitNumber.localeCompare(b.unitNumber, undefined, { numeric: true }),
  );

  return { rows, stats: { collected, outstanding, collectionRate, billed } };
}
