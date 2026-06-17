import { createServerClient } from "./client";
import type { Community, CommunityUpdate, CommunityStats } from "@/types";

/** Fetch a single community by id. Returns null if not found. */
export async function getCommunityById(
  communityId: string,
): Promise<Community | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", communityId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Update a community's settings/profile. */
export async function updateCommunity(
  communityId: string,
  data: CommunityUpdate,
): Promise<Community> {
  const supabase = createServerClient();
  const { data: updated, error } = await supabase
    .from("communities")
    .update(data)
    .eq("id", communityId)
    .select("*")
    .single();

  if (error) throw error;
  return updated;
}

/**
 * Aggregate dashboard stats for a community: total units, total members,
 * outstanding dues (pending + late + partial, including any late fees), and
 * open violations (open + notified + remediation).
 */
export async function getCommunityStats(
  communityId: string,
): Promise<CommunityStats> {
  const supabase = createServerClient();

  const [unitsRes, membersRes, duesRes, violationsRes] = await Promise.all([
    supabase
      .from("units")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId),
    supabase
      .from("dues_ledger")
      .select("amount, late_fee_applied")
      .eq("community_id", communityId)
      .in("status", ["pending", "late", "partial"]),
    supabase
      .from("violations")
      .select("*", { count: "exact", head: true })
      .eq("community_id", communityId)
      .in("status", ["open", "notified", "remediation"]),
  ]);

  if (unitsRes.error) throw unitsRes.error;
  if (membersRes.error) throw membersRes.error;
  if (duesRes.error) throw duesRes.error;
  if (violationsRes.error) throw violationsRes.error;

  const pendingDues = (duesRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.amount) + Number(row.late_fee_applied ?? 0),
    0,
  );

  return {
    totalUnits: unitsRes.count ?? 0,
    totalMembers: membersRes.count ?? 0,
    pendingDues,
    openViolations: violationsRes.count ?? 0,
  };
}
