// Transactional email template (Session 1 stub). Rendered to HTML in a later
// session via react-dom/server before sending through Resend.

export type DuesReminderProps = {
  communityName: string;
  memberName: string;
  amountDue: string; // pre-formatted currency, e.g. "$250.00"
  dueDate: string; // pre-formatted date
  payUrl: string;
};

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
