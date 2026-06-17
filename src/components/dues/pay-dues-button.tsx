"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";

type PayState = "idle" | "linking" | "processing" | "done" | "error";

/**
 * Pay a dues charge by ACH. Asks the server for a PaymentIntent client_secret,
 * then completes bank linking in the browser with Stripe Financial Connections
 * against the community's connected account. ACH settles asynchronously, so a
 * successful submission lands in "processing"; the Stripe webhook flips the
 * ledger row to paid once funds clear.
 */
export function PayDuesButton({
  duesId,
  payerName,
  payerEmail,
}: {
  duesId: string;
  payerName: string;
  payerEmail: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<PayState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function pay() {
    setState("linking");
    setMessage(null);
    try {
      const res = await fetch(`/api/dues/${duesId}/pay`, { method: "POST" });
      const data = (await res.json()) as {
        clientSecret?: string;
        connectedAccountId?: string;
        publishableKey?: string;
        error?: string;
      };
      if (!res.ok || !data.clientSecret || !data.publishableKey) {
        throw new Error(data.error ?? "Could not start payment");
      }

      // Stripe.js must target the same connected account as the PaymentIntent.
      const stripe = await loadStripe(data.publishableKey, {
        stripeAccount: data.connectedAccountId,
      });
      if (!stripe) throw new Error("Stripe failed to load");

      const collected = await stripe.collectBankAccountForPayment({
        clientSecret: data.clientSecret,
        params: {
          payment_method_type: "us_bank_account",
          payment_method_data: {
            billing_details: { name: payerName, email: payerEmail },
          },
        },
      });
      if (collected.error) throw new Error(collected.error.message);

      let intent = collected.paymentIntent;
      if (intent?.status === "requires_confirmation") {
        const confirmed = await stripe.confirmUsBankAccountPayment(
          data.clientSecret,
        );
        if (confirmed.error) throw new Error(confirmed.error.message);
        intent = confirmed.paymentIntent;
      }

      if (intent?.status === "processing" || intent?.status === "succeeded") {
        setState(intent.status === "succeeded" ? "done" : "processing");
        setMessage(
          intent.status === "succeeded"
            ? "Payment complete."
            : "Payment submitted — ACH transfers take a few business days to clear.",
        );
        router.refresh();
      } else {
        throw new Error("Payment could not be completed");
      }
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Payment failed");
    }
  }

  if (state === "done" || state === "processing") {
    return <span className="text-sm text-muted-foreground">{message}</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        onClick={pay}
        disabled={state === "linking"}
      >
        {state === "linking" ? "Starting…" : "Pay now"}
      </Button>
      {state === "error" && message ? (
        <span className="text-xs text-destructive">{message}</span>
      ) : null}
    </div>
  );
}
