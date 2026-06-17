import { createServerClient } from "./client";
import type { DuesLedger, DuesLedgerInsert, DuesLedgerUpdate } from "@/types";

/** All dues ledger rows for a community, most recent period first. */
export async function getDuesByCommunity(
  communityId: string,
): Promise<DuesLedger[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dues_ledger")
    .select("*")
    .eq("community_id", communityId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Dues ledger rows for a single member within a community. */
export async function getDuesByMember(
  communityId: string,
  memberId: string,
): Promise<DuesLedger[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dues_ledger")
    .select("*")
    .eq("community_id", communityId)
    .eq("member_id", memberId)
    .order("period_year", { ascending: false })
    .order("period_month", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** A single dues row, scoped to the community for tenant safety. */
export async function getDuesById(
  communityId: string,
  duesId: string,
): Promise<DuesLedger | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dues_ledger")
    .select("*")
    .eq("community_id", communityId)
    .eq("id", duesId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** All dues rows for a community in a specific billing period (year + month). */
export async function getDuesForPeriod(
  communityId: string,
  periodYear: number,
  periodMonth: number,
): Promise<DuesLedger[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dues_ledger")
    .select("*")
    .eq("community_id", communityId)
    .eq("period_year", periodYear)
    .eq("period_month", periodMonth);

  if (error) throw error;
  return data ?? [];
}

/**
 * Pending dues in a community whose due_date is strictly before `beforeDate`
 * (YYYY-MM-DD). Used by the nightly late-fee job to find overdue charges.
 */
export async function getPendingDuesDueBefore(
  communityId: string,
  beforeDate: string,
): Promise<DuesLedger[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("dues_ledger")
    .select("*")
    .eq("community_id", communityId)
    .eq("status", "pending")
    .lt("due_date", beforeDate);

  if (error) throw error;
  return data ?? [];
}

/** Create a dues charge. community_id is forced from the trusted argument. */
export async function createDuesCharge(
  communityId: string,
  data: Omit<DuesLedgerInsert, "community_id">,
): Promise<DuesLedger> {
  const supabase = createServerClient();
  const { data: created, error } = await supabase
    .from("dues_ledger")
    .insert({ ...data, community_id: communityId })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

/** Update a dues row, scoped to the community for tenant safety. */
export async function updateDuesCharge(
  communityId: string,
  duesId: string,
  data: DuesLedgerUpdate,
): Promise<DuesLedger> {
  const supabase = createServerClient();
  const { data: updated, error } = await supabase
    .from("dues_ledger")
    .update(data)
    .eq("community_id", communityId)
    .eq("id", duesId)
    .select("*")
    .single();

  if (error) throw error;
  return updated;
}
