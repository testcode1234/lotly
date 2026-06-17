import { getSessionContext } from "@/lib/auth";
import { getMembersByCommunity } from "@/lib/db/members";
import { getUnitsByCommunity } from "@/lib/db/units";
import { ROLE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Member, MemberStatus, Role } from "@/types";

function fullName(m: Member): string {
  const name = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  return name || m.email;
}

function roleVariant(role: Role): "default" | "secondary" | "outline" {
  if (role === "board_admin") return "default";
  if (role === "board_member") return "secondary";
  return "outline";
}

function statusVariant(
  status: MemberStatus,
): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "invited") return "secondary";
  return "outline";
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

export default async function MembersPage() {
  const ctx = await getSessionContext();

  // Board-only page. Residents who navigate here directly are turned away.
  if (!ctx?.communityId || ctx.role === "resident" || ctx.role === null) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You don&apos;t have access to member management.
          </CardContent>
        </Card>
      </div>
    );
  }

  let members: Member[] = [];
  let unitNumberById = new Map<string, string>();
  let loadError = false;
  try {
    const [memberRows, unitRows] = await Promise.all([
      getMembersByCommunity(ctx.communityId),
      getUnitsByCommunity(ctx.communityId),
    ]);
    members = memberRows;
    unitNumberById = new Map(unitRows.map((u) => [u.id, u.unit_number]));
  } catch (err) {
    console.error("Failed to load members:", err);
    loadError = true;
  }

  const unitLabel = (m: Member) =>
    m.unit_id ? (unitNumberById.get(m.unit_id) ?? "—") : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} {members.length === 1 ? "member" : "members"}
          </p>
        </div>
      </div>

      {loadError ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Couldn&apos;t load members right now. Please try again.
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No members yet. Invite homeowners to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {members.map((m) => (
              <Card key={m.id}>
                <CardContent className="space-y-2 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{fullName(m)}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {m.email}
                      </p>
                    </div>
                    <Badge variant={statusVariant(m.status)}>
                      {STATUS_LABELS[m.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={roleVariant(m.role)}>
                      {ROLE_LABELS[m.role]}
                    </Badge>
                    <span>Unit {unitLabel(m)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{fullName(m)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email}
                    </TableCell>
                    <TableCell>{unitLabel(m)}</TableCell>
                    <TableCell>
                      <Badge variant={roleVariant(m.role)}>
                        {ROLE_LABELS[m.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(m.status)}>
                        {STATUS_LABELS[m.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
