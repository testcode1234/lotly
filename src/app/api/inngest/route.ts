import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { generateMonthlyDues } from "@/inngest/functions/generate-monthly-dues";
import { applyLateFees } from "@/inngest/functions/apply-late-fees";

/**
 * Inngest endpoint. Registers all background functions and handles invocation,
 * cron scheduling, and the dev/cloud handshake. Inngest authenticates requests
 * with INNGEST_SIGNING_KEY, so this route is exempt from Clerk auth.
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateMonthlyDues, applyLateFees],
});
