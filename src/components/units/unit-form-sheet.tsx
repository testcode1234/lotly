"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Unit } from "@/types";

/**
 * Add/edit unit drawer. Edits (PATCH) when `unit` is provided and offers
 * delete; otherwise creates (POST).
 */
export function UnitFormSheet({
  open,
  onOpenChange,
  unit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit;
}) {
  const router = useRouter();
  const editing = Boolean(unit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const f = new FormData(e.currentTarget);
    const payload = {
      unit_number: String(f.get("unit_number") ?? "").trim(),
      address: String(f.get("address") ?? "").trim() || null,
      notes: String(f.get("notes") ?? "").trim() || null,
    };

    try {
      const res = await fetch(
        editing ? `/api/units/${unit!.id}` : "/api/units",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save unit");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save unit");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!unit) return;
    if (!confirm(`Delete unit ${unit.unit_number}?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/units/${unit.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete unit");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete unit");
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit unit" : "Add unit"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="unit_number">Unit number</Label>
            <Input
              id="unit_number"
              name="unit_number"
              required
              defaultValue={unit?.unit_number ?? ""}
              placeholder="101"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              defaultValue={unit?.address ?? ""}
              placeholder="101 Maple Dr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" name="notes" defaultValue={unit?.notes ?? ""} />
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add unit"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={onDelete}
              >
                Delete unit
              </Button>
            ) : null}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
