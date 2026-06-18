import { getSessionContext } from "@/lib/auth";
import { getUnitsByCommunity } from "@/lib/db/units";
import { getMembersByCommunity } from "@/lib/db/members";
import { Card, CardContent } from "@/components/ui/card";
import { UnitsManager } from "@/components/units/units-manager";
import type { Member, Unit } from "@/types";

export default async function UnitsPage() {
  const ctx = await getSessionContext();

  // Board-only page.
  if (!ctx?.communityId || ctx.role === "resident" || ctx.role === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Units</h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You don&apos;t have access to unit management.
          </CardContent>
        </Card>
      </div>
    );
  }

  let units: Unit[] = [];
  let members: Member[] = [];
  let loadError = false;
  try {
    [units, members] = await Promise.all([
      getUnitsByCommunity(ctx.communityId),
      getMembersByCommunity(ctx.communityId),
    ]);
  } catch (err) {
    console.error("Failed to load units:", err);
    loadError = true;
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Units</h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load units right now. Please try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <UnitsManager
      units={units}
      members={members}
      canEdit={ctx.role === "board_admin"}
    />
  );
}
