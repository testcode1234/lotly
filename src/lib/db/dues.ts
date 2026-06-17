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
