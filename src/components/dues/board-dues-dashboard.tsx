"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DUES_STATUS_LABELS, formatCurrency, periodLabel } from "@/lib/constants";
import type { DuesStatus } from "@/types";
import type { DuesDashboardRow, DuesDashboardStats } from "@/lib/dues/dashboard";

// Color-coded status pill: paid=green, pending=amber, late=red.
const STATUS_PILL: Record<DuesStatus, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  late: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  partial: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  waived: "bg-muted text-muted-foreground",
};

function StatusPill({ status }: { status: DuesStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_PILL[status],
      )}
    >
      {DUES_STATUS_LABELS[status]}
    </span>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

const PAYABLE: DuesStatus[] = ["pending", "late", "partial"];

export function BoardDuesDashboard({
  rows,
  stats,
  year,
  month,
}: {
  rows: DuesDashboardRow[];
  stats: DuesDashboardStats;
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function markPaid(duesId: string) {
    setPending(duesId);
    try {
      const res = await fetch(`/api/dues/${duesId}/mark-paid`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label="Collected" value={formatCurrency(stats.collected)} />
        <Stat label="Outstanding" value={formatCurrency(stats.outstanding)} />
        <Stat
          label="Collection rate"
          value={`${Math.round(stats.collectionRate * 100)}%`}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {periodLabel(year, month)} · {rows.length}{" "}
          {rows.length === 1 ? "charge" : "charges"}
        </p>
        <a
          href={`/api/dues/export?year=${year}&month=${month}`}
          download
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Export CSV
        </a>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No dues generated for {periodLabel(year, month)} yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.duesId}>
                  <TableCell className="font-medium">{r.unitNumber}</TableCell>
                  <TableCell>
                    <div>{r.memberName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.email}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(r.amount)}</TableCell>
                  <TableCell>
                    <StatusPill status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {PAYABLE.includes(r.status) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending === r.duesId}
                        onClick={() => markPaid(r.duesId)}
                      >
                        {pending === r.duesId ? "Saving…" : "Mark paid"}
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
