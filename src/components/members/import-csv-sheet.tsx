"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";

type Summary = {
  unitsCreated: number;
  membersCreated: number;
  skipped: number;
  errors: string[];
};

const SAMPLE = `unit_number,address,email,first_name,last_name,phone,role,dues_amount
101,101 Maple Dr,jane@example.com,Jane,Doe,555-0101,resident,250
102,102 Maple Dr,john@example.com,John,Smith,555-0102,board_member,250`;

/**
 * Bulk-import drawer. Paste CSV (or load a .csv file) and POST to /api/import.
 * Shows a summary of created/skipped rows and any per-line errors.
 */
export function ImportCsvSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setCsv(await file.text());
  }

  async function onImport() {
    setError(null);
    setSummary(null);
    setBusy(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = (await res.json()) as { summary?: Summary; error?: string };
      if (!res.ok || !data.summary) {
        throw new Error(data.error ?? "Import failed");
      }
      setSummary(data.summary);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Import members & units</SheetTitle>
          <SheetDescription>
            Paste CSV with a header row. Recognized columns: unit_number,
            address, email, first_name, last_name, phone, role, dues_amount.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="csv-file">Upload .csv</Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1 file:text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csv-text">…or paste CSV</Label>
            <textarea
              id="csv-text"
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={8}
              placeholder={SAMPLE}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {summary ? (
            <div className="rounded-md bg-muted px-3 py-2 text-sm">
              <p className="font-medium">Import complete</p>
              <p className="text-muted-foreground">
                {summary.unitsCreated} units · {summary.membersCreated} members
                created · {summary.skipped} skipped
              </p>
              {summary.errors.length > 0 ? (
                <ul className="mt-1 list-disc pl-4 text-xs text-destructive">
                  {summary.errors.slice(0, 8).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <SheetFooter className="px-0">
            <Button onClick={onImport} disabled={busy || !csv.trim()}>
              {busy ? "Importing…" : "Import"}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
