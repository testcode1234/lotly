import { getResend, EMAIL_FROM } from "./client";
import {
  renderDuesReminderHtml,
  type DuesReminderProps,
} from "./templates/dues-reminder";

/**
 * Render and send the dues reminder email via Resend. Returns the Resend id on
 * success.
 */
export async function sendDuesReminder(
  to: string,
  props: DuesReminderProps,
): Promise<string | null> {
  const html = renderDuesReminderHtml(props);
  const { data, error } = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Dues reminder — ${props.communityName}`,
    html,
  });
  if (error) throw error;
  return data?.id ?? null;
}
