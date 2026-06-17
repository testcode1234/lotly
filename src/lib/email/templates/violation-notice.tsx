// Transactional email template (Session 1 stub). Rendered to HTML in a later
// session via react-dom/server before sending through Resend.

export type ViolationNoticeProps = {
  communityName: string;
  memberName: string;
  unitLabel: string;
  violationType: string;
  description: string;
  noticeUrl: string;
};

export function ViolationNoticeEmail({
  communityName,
  memberName,
  unitLabel,
  violationType,
  description,
  noticeUrl,
}: ViolationNoticeProps) {
  return (
    <div
      style={{ fontFamily: "system-ui, sans-serif", color: "#0f172a", lineHeight: 1.5 }}
    >
      <h1 style={{ fontSize: "20px" }}>Violation notice — {communityName}</h1>
      <p>Hi {memberName},</p>
      <p>
        A violation has been recorded for <strong>{unitLabel}</strong>.
      </p>
      <p>
        <strong>Type:</strong> {violationType}
        <br />
        <strong>Details:</strong> {description}
      </p>
      <p>
        <a
          href={noticeUrl}
          style={{
            display: "inline-block",
            background: "#0f172a",
            color: "#ffffff",
            padding: "10px 16px",
            borderRadius: "8px",
            textDecoration: "none",
          }}
        >
          View full notice
        </a>
      </p>
      <p style={{ color: "#64748b", fontSize: "12px" }}>
        Sent by Lotly on behalf of {communityName}.
      </p>
    </div>
  );
}
