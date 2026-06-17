import { Inngest } from "inngest";

/**
 * Inngest client for background jobs (late-fee application, dues/violation
 * reminder triggers). Installed but not wired to any functions in Session 1.
 * Event/signing keys are read from INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY.
 */
export const inngest = new Inngest({ id: "lotly" });
