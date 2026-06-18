"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABELS, formatCurrency } from "@/lib/constants";
import { MemberFormSheet } from "./member-form-sheet";
import { ImportCsvSheet } from "./import-csv-sheet";
import type { Member, MemberStatus, Role, Unit } from "@/types";

function fullName(m: Member): string {
  return [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.email;
}

function roleVariant(role: Role): "default" | "secondary" | "outline" {
  if (role === "board_admin") return "default";
  if (role === "board_member") return "secondary";
  return "outline";
}

function statusVariant(status: MemberStatus): "default" | "secondary" | "outline" {
  if (status === "active") return "default";
  if (status === "invited") return "secondary";
  return "outline";
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  active: "Active",
  invited: "Invited",
  inactive: "Inactive",
};

export function MembersManager({
  members,
  units,
  canEdit,
}: {
  members: Member[];
  units: Unit[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const unitNumberById = new Map(units.map((u) => [u.id, u.unit_number]));
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
        {canEdit ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImporting(true)}>
              Import CSV
            </Button>
            <Button onClick={() => setAdding(true)}>Add member</Button>
          </div>
        ) : null}
      </div>

      {members.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No members yet. {canEdit ? "Add one or import a CSV to get started." : ""}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile: stacked cards */}
          <div className="space-y-3 md:hidden">
            {members.map((m) => (
              <Card
                key={m.id}
                onClick={canEdit ? () => setEditing(m) : undefined}
                className={canEdit ? "cursor-pointer" : undefined}
              >
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
                    <span>
                      {m.dues_amount != null
                        ? formatCurrency(Number(m.dues_amount))
                        : "no dues"}
                    </span>
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
                  <TableHead>Dues</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow
                    key={m.id}
                    onClick={canEdit ? () => setEditing(m) : undefined}
                    className={canEdit ? "cursor-pointer" : undefined}
                  >
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
                      {m.dues_amount != null
                        ? formatCurrency(Number(m.dues_amount))
                        : "—"}
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

      {canEdit ? (
        <>
          <MemberFormSheet open={adding} onOpenChange={setAdding} units={units} />
          <MemberFormSheet
            key={editing?.id ?? "none"}
            open={Boolean(editing)}
            onOpenChange={(o) => !o && setEditing(null)}
            member={editing ?? undefined}
            units={units}
          />
          <ImportCsvSheet open={importing} onOpenChange={setImporting} />
        </>
      ) : null}
    </div>
  );
}
