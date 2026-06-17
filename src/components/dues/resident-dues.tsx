import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DUES_STATUS_LABELS, formatCurrency, periodLabel } from "@/lib/constants";
import { PayDuesButton } from "./pay-dues-button";
import type { DuesLedger, DuesStatus } from "@/types";

function statusVariant(
  status: DuesStatus,
): "default" | "secondary" | "outline" {
  if (status === "paid" || status === "waived") return "default";
  if (status === "late") return "outline";
  return "secondary";
}

const PAYABLE: DuesStatus[] = ["pending", "late", "partial"];

/** A resident's own dues ledger with a Pay-now action on outstanding rows. */
export function ResidentDues({
  dues,
  payerName,
  payerEmail,
}: {
  dues: DuesLedger[];
  payerName: string;
  payerEmail: string;
}) {
  if (dues.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          You have no dues charges yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {dues.map((d) => {
        const total = Number(d.amount) + Number(d.late_fee_applied ?? 0);
        return (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">
                  {periodLabel(d.period_year, d.period_month)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(total)}
                  {Number(d.late_fee_applied) > 0
                    ? ` (incl. ${formatCurrency(Number(d.late_fee_applied))} late fee)`
                    : ""}{" "}
                  · due {d.due_date}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={statusVariant(d.status)}>
                  {DUES_STATUS_LABELS[d.status]}
                </Badge>
                {PAYABLE.includes(d.status) ? (
                  <PayDuesButton
                    duesId={d.id}
                    payerName={payerName}
                    payerEmail={payerEmail}
                  />
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
