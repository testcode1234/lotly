import { getCommunityIdFromHeaders, getRoleFromHeaders } from "@/lib/auth";
import { getDuesDashboard } from "@/lib/dues/dashboard";
import { DUES_STATUS_LABELS } from "@/lib/constants";

/** Wrap a CSV cell, escaping quotes and forcing text for safety. */
function cell(value: string | number): string {
  const s = String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/**
 * GET /api/dues/export?year=&month=
 *
 * Board-only CSV export of a billing period's dues. Defaults to the current
 * month when year/month are omitted.
 */
export async function GET(req: Request): Promise<Response> {
  let communityId: string;
  try {
    communityId = getCommunityIdFromHeaders(req);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const role = getRoleFromHeaders(req);
  if (role !== "board_admin" && role !== "board_member") {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year")) || now.getUTCFullYear();
  const month = Number(url.searchParams.get("month")) || now.getUTCMonth() + 1;

  try {
    const { rows } = await getDuesDashboard(communityId, year, month);
    const header = ["Unit", "Member", "Email", "Amount", "Status", "Due date", "Paid at"];
    const lines = [
      header.map(cell).join(","),
      ...rows.map((r) =>
        [
          r.unitNumber,
          r.memberName,
          r.email,
          r.amount.toFixed(2),
          DUES_STATUS_LABELS[r.status],
          r.dueDate,
          r.paidAt ?? "",
        ]
          .map(cell)
          .join(","),
      ),
    ];
    const csv = lines.join("\r\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="dues-${year}-${String(month).padStart(2, "0")}.csv"`,
      },
    });
  } catch (err) {
    console.error("GET /api/dues/export failed:", err);
    return new Response("Internal error", { status: 500 });
  }
}
