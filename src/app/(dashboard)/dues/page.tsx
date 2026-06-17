import { auth } from "@clerk/nextjs/server";
import { getSessionContext } from "@/lib/auth";
import { getMemberByClerkId } from "@/lib/db/members";
import { getDuesByMember } from "@/lib/db/dues";
import { getDuesDashboard } from "@/lib/dues/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { ResidentDues } from "@/components/dues/resident-dues";
import { BoardDuesDashboard } from "@/components/dues/board-dues-dashboard";

export default async function DuesPage() {
  const ctx = await getSessionContext();
  const isBoard = ctx?.role === "board_admin" || ctx?.role === "board_member";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dues</h1>
        <p className="text-sm text-muted-foreground">
          {isBoard
            ? "Track collection across the community."
            : "View and pay your HOA dues."}
        </p>
      </div>
      {isBoard && ctx?.communityId ? (
        <BoardView communityId={ctx.communityId} />
      ) : (
        <ResidentView communityId={ctx?.communityId ?? null} />
      )}
    </div>
  );
}

async function ResidentView({ communityId }: { communityId: string | null }) {
  const { userId } = await auth();
  if (!userId || !communityId) return null;

  const member = await getMemberByClerkId(userId);
  // The member must belong to the session's community (tenant check).
  if (!member || member.community_id !== communityId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Your resident profile isn&apos;t linked yet. Ask your board to add you.
        </CardContent>
      </Card>
    );
  }

  const dues = await getDuesByMember(communityId, member.id);
  const payerName =
    [member.first_name, member.last_name].filter(Boolean).join(" ").trim() ||
    member.email;

  return (
    <ResidentDues dues={dues} payerName={payerName} payerEmail={member.email} />
  );
}

async function BoardView({ communityId }: { communityId: string }) {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const { rows, stats } = await getDuesDashboard(communityId, year, month);

  return (
    <BoardDuesDashboard rows={rows} stats={stats} year={year} month={month} />
  );
}
