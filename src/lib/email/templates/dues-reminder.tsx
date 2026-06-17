// Transactional email template. `DuesReminderEmail` is the React component
// (handy for previews); `renderDuesReminderHtml` produces the HTML string we
// actually send via Resend — kept as a plain string builder so it never pulls
// `react-dom/server` into the Next app graph (Turbopack forbids that import).

export type DuesReminderProps = {
  communityName: string;
  memberName: string;
  amountDue: string; // pre-formatted currency, e.g. "$250.00"
  dueDate: string; // pre-formatted date
  payUrl: string;
};

/** Minimal HTML escaping for interpolated, user-controlled values. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render the dues reminder to an HTML string for sending. */
export function renderDuesReminderHtml({
  communityName,
  memberName,
  amountDue,
  dueDate,
  payUrl,
}: DuesReminderProps): string {
  return `<div style="font-family:system-ui,sans-serif;color:#0f172a;line-height:1.5">
  <h1 style="font-size:20px">Dues reminder — ${esc(communityName)}</h1>
  <p>Hi ${esc(memberName)},</p>
  <p>This is a friendly reminder that <strong>${esc(amountDue)}</strong> in HOA dues is due on <strong>${esc(dueDate)}</strong>.</p>
  <p><a href="${esc(payUrl)}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:10px 16px;border-radius:8px;text-decoration:none">Pay dues</a></p>
  <p style="color:#64748b;font-size:12px">Sent by Lotly on behalf of ${esc(communityName)}.</p>
</div>`;
}

export function DuesReminderEmail({
  communityName,
  memberName,
  amountDue,
  dueDate,
  payUrl,
}: DuesReminderProps) {
  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif", color: "#0f172a", lineHeight: 1.5 }}
    >
      <h1 style={{ fontSize: "20px" }}>Dues reminder — {communityName}</h1>
      <p>Hi {memberName},</p>
      <p>
        This is a friendly reminder that <strong>{amountDue}</strong> in HOA dues
        is due on <strong>{dueDate}</strong>.
      </p>
      <p>
        <a
          href={payUrl}
          style={{
            display: "inline-block",
            background: "#0f172a",
            color: "#ffffff",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          Pay dues
        </a>
      </p>
      <p style={{ color: "#64748b", fontSize: "12px" }}>
        Sent by Lotly on behalf of {communityName}.
      </p>
    </div>
  );
}
