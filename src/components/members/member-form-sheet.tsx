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
import { Input, Label, Select } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/constants";
import type { Member, Role, MemberStatus, Unit } from "@/types";

const ROLES: Role[] = ["board_admin", "board_member", "resident"];
const STATUSES: MemberStatus[] = ["invited", "active", "inactive"];

/**
 * Add/edit member drawer. When `member` is provided it edits (PATCH) and shows
 * a delete action; otherwise it creates (POST). Controlled via open/onOpenChange.
 */
export function MemberFormSheet({
  open,
  onOpenChange,
  member,
  units,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member;
  units: Unit[];
}) {
  const router = useRouter();
  const editing = Boolean(member);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const f = new FormData(e.currentTarget);
    const duesRaw = f.get("dues_amount");
    const payload = {
      email: String(f.get("email") ?? "").trim(),
      first_name: String(f.get("first_name") ?? "").trim() || null,
      last_name: String(f.get("last_name") ?? "").trim() || null,
      phone: String(f.get("phone") ?? "").trim() || null,
      role: f.get("role") as Role,
      status: f.get("status") as MemberStatus,
      unit_id: (f.get("unit_id") as string) || null,
      dues_amount: duesRaw ? Number(duesRaw) : null,
    };

    try {
      const res = await fetch(
        editing ? `/api/members/${member!.id}` : "/api/members",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not save member");
      }
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save member");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!member) return;
    if (!confirm(`Remove ${member.email} from this community?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not remove member");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove member");
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editing ? "Edit member" : "Add member"}</SheetTitle>
        </SheetHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 px-4 pb-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={member?.email ?? ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={member?.first_name ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={member?.last_name ?? ""}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={member?.phone ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue={member?.role ?? "resident"}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                name="status"
                defaultValue={member?.status ?? "invited"}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit_id">Unit</Label>
            <Select id="unit_id" name="unit_id" defaultValue={member?.unit_id ?? ""}>
              <option value="">— Unassigned —</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unit_number}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dues_amount">Monthly dues ($)</Label>
            <Input
              id="dues_amount"
              name="dues_amount"
              type="number"
              min={0}
              step="0.01"
              placeholder="e.g. 250.00"
              defaultValue={member?.dues_amount ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Required for this member to be billed by the monthly dues job.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <SheetFooter className="px-0">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add member"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={onDelete}
              >
                Remove member
              </Button>
            ) : null}
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
