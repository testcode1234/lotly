"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

/**
 * Community setup form. Posts to /api/onboarding/community, which creates the
 * community + Stripe Express account, then returns a Stripe-hosted onboarding
 * URL we send the board to.
 */
export function OnboardingForm() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const unitCountRaw = form.get("unitCount");
    const payload = {
      name: form.get("name"),
      address: form.get("address"),
      city: form.get("city"),
      state: form.get("state"),
      zip: form.get("zip"),
      unitCount: unitCountRaw ? Number(unitCountRaw) : 0,
    };

    try {
      const res = await fetch("/api/onboarding/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        onboardingUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.onboardingUrl) {
        throw new Error(data.error ?? "Something went wrong");
      }
      // Hand off to Stripe-hosted Express onboarding.
      window.location.href = data.onboardingUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Community name</Label>
        <Input id="name" name="name" required placeholder="Maple Grove HOA" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Street address</Label>
        <Input id="address" name="address" placeholder="100 Maple Ridge Dr" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" placeholder="Austin" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" maxLength={2} placeholder="TX" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" name="zip" placeholder="78704" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="unitCount">Number of units</Label>
        <Input
          id="unitCount"
          name="unitCount"
          type="number"
          min={0}
          placeholder="48"
        />
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Setting up…" : "Continue to payment setup"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Next you&apos;ll connect a bank account with Stripe so your HOA can
        collect dues.
      </p>
    </form>
  );
}
