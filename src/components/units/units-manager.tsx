"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnitFormSheet } from "./unit-form-sheet";
import type { Member, Unit } from "@/types";

function occupantName(m: Member): string {
  return [m.first_name, m.last_name].filter(Boolean).join(" ").trim() || m.email;
}

export function UnitsManager({
  units,
  members,
  canEdit,
}: {
  units: Unit[];
  members: Member[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState<Unit | null>(null);
  const [adding, setAdding] = useState(false);

  // Occupants per unit (a unit can have more than one member).
  const occupantsByUnit = new Map<string, Member[]>();
  for (const m of members) {
    if (!m.unit_id) continue;
    const list = occupantsByUnit.get(m.unit_id) ?? [];
    list.push(m);
    occupantsByUnit.set(m.unit_id, list);
  }
  const occupantsLabel = (unitId: string) =>
    (occupantsByUnit.get(unitId) ?? []).map(occupantName).join(", ") || "—";

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Units</h1>
          <p className="text-sm text-muted-foreground">
            {units.length} {units.length === 1 ? "unit" : "units"}
          </p>
        </div>
        {canEdit ? <Button onClick={() => setAdding(true)}>Add unit</Button> : null}
      </div>

      {units.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No units yet. {canEdit ? "Add one or import a CSV from the Members page." : ""}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Occupants</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow
                  key={u.id}
                  onClick={canEdit ? () => setEditing(u) : undefined}
                  className={canEdit ? "cursor-pointer" : undefined}
                >
                  <TableCell className="font-medium">{u.unit_number}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.address ?? "—"}
                  </TableCell>
                  <TableCell>{occupantsLabel(u.id)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {canEdit ? (
        <>
          <UnitFormSheet open={adding} onOpenChange={setAdding} />
          <UnitFormSheet
            key={editing?.id ?? "none"}
            open={Boolean(editing)}
            onOpenChange={(o) => !o && setEditing(null)}
            unit={editing ?? undefined}
          />
        </>
      ) : null}
    </div>
  );
}
