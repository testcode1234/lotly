import { inngest } from "@/inngest/client";
import { getAllCommunities } from "@/lib/db/communities";
import { getMembersByCommunity } from "@/lib/db/members";
import { getPendingDuesDueBefore, updateDuesCharge } from "@/lib/db/dues";
import { sendDuesReminder } from "@/lib/email/send";
import { formatCurrency } from "@/lib/constants";
import type { Community } from "@/types";

/** Format a Date as YYYY-MM-DD (UTC). */
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lotly.app";

/**
 * Apply late fees + send reminders for one community. A charge is overdue when
 * due_date + grace_days < today. Marks it 'late', records the late fee, and
 * emails the member. Returns how many were processed.
 */
async function applyForCommunity(community: Community): Promise<number> {
  // Cutoff = today - grace_days. Pending charges due before this are overdue.
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - (community.late_fee_grace_days ?? 0));

  const overdue = await getPendingDuesDueBefore(community.id, isoDate(cutoff));
  if (overdue.length === 0) return 0;

  const members = await getMembersByCommunity(community.id);
  const memberById = new Map(members.map((m) => [m.id, m]));
  const lateFee = Number(community.late_fee_amount ?? 0);

  for (const dues of overdue) {
    const total = Number(dues.amount) + lateFee;
    await updateDuesCharge(community.id, dues.id, {
      status: "late",
      late_fee_applied: lateFee,
    });

    const member = memberById.get(dues.member_id);
    if (!member?.email) continue;
    const name =
      [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
      member.email;

    try {
      await sendDuesReminder(member.email, {
        communityName: community.name,
        memberName: name,
        amountDue: formatCurrency(total),
        dueDate: dues.due_date,
        payUrl: `${APP_URL}/dues`,
      });
    } catch (err) {
      // Don't let a single email failure abort the batch.
      console.error(`Late-fee reminder failed for ${member.email}:`, err);
    }
  }

  return overdue.length;
}

/**
 * applyLateFees — nightly job that flags overdue dues, applies late fees, and
 * emails reminders. Also exposed as the manual event `dues/apply-late-fees`.
 */
export const applyLateFees = inngest.createFunction(
  {
    id: "apply-late-fees",
    name: "Apply late fees",
    triggers: [{ cron: "0 7 * * *" }, { event: "dues/apply-late-fees" }],
  },
  async ({ step }) => {
    const communities = await step.run("load-communities", getAllCommunities);

    let totalProcessed = 0;
    for (const community of communities) {
      const processed = await step.run(`late-fees-${community.id}`, () =>
        applyForCommunity(community),
      );
      totalProcessed += processed;
    }

    return { communities: communities.length, totalProcessed };
  },
);
