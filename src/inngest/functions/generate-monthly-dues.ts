import { inngest } from "@/inngest/client";
import { getAllCommunities, getCommunityById } from "@/lib/db/communities";
import { getActiveMembersByCommunity } from "@/lib/db/members";
import { createDuesCharge, getDuesForPeriod } from "@/lib/db/dues";
import type { Community } from "@/types";

/** Clamp the configured dues day (1–28) and build a YYYY-MM-DD due date. */
function buildDueDate(year: number, month: number, dayOfMonth: number): string {
  const day = Math.min(Math.max(dayOfMonth || 1, 1), 28);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Generate dues_ledger rows for one community for the given period. Creates a
 * row for every active member that has a dues_amount and doesn't already have
 * a row for that period. Returns how many were created/skipped.
 */
async function generateForCommunity(
  community: Community,
  year: number,
  month: number,
): Promise<{ created: number; skipped: number }> {
  const [members, existing] = await Promise.all([
    getActiveMembersByCommunity(community.id),
    getDuesForPeriod(community.id, year, month),
  ]);

  const alreadyBilled = new Set(existing.map((d) => d.member_id));
  const dueDate = buildDueDate(year, month, community.dues_day_of_month);

  let created = 0;
  let skipped = 0;
  for (const member of members) {
    if (alreadyBilled.has(member.id)) {
      skipped += 1;
      continue;
    }
    // No dues amount configured for this member → nothing to charge.
    if (member.dues_amount == null || member.dues_amount <= 0) {
      skipped += 1;
      continue;
    }

    await createDuesCharge(community.id, {
      member_id: member.id,
      unit_id: member.unit_id,
      period_year: year,
      period_month: month,
      amount: member.dues_amount,
      due_date: dueDate,
      status: "pending",
    });
    created += 1;
  }

  return { created, skipped };
}

type ManualPayload = {
  data?: { year?: number; month?: number; communityId?: string };
};

/**
 * generateMonthlyDues — creates the monthly dues charges for every community.
 *
 * Triggers:
 *  - Cron on the 1st of each month (00:00 UTC).
 *  - Manual event `dues/generate.monthly`, optionally scoped via
 *    data.communityId and/or data.year + data.month.
 */
export const generateMonthlyDues = inngest.createFunction(
  {
    id: "generate-monthly-dues",
    name: "Generate monthly dues",
    // Cron on the 1st (00:00 UTC) + a manual/event trigger for ad-hoc runs.
    triggers: [{ cron: "0 0 1 * *" }, { event: "dues/generate.monthly" }],
  },
  async ({ event, step }) => {
    const payload = event as ManualPayload;
    const now = new Date();
    const year = payload.data?.year ?? now.getUTCFullYear();
    const month = payload.data?.month ?? now.getUTCMonth() + 1;
    const onlyCommunityId = payload.data?.communityId;

    const communities = await step.run("load-communities", async () => {
      if (onlyCommunityId) {
        const c = await getCommunityById(onlyCommunityId);
        return c ? [c] : [];
      }
      return getAllCommunities();
    });

    const results: Record<string, { created: number; skipped: number }> = {};
    for (const community of communities) {
      results[community.id] = await step.run(
        `generate-${community.id}`,
        () => generateForCommunity(community, year, month),
      );
    }

    const totalCreated = Object.values(results).reduce(
      (n, r) => n + r.created,
      0,
    );
    return { year, month, communities: communities.length, totalCreated };
  },
);
