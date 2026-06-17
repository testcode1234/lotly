import { createServerClient } from "./client";
import type { Member, MemberInsert, MemberUpdate } from "@/types";

/** All members in a community, newest first. */
export async function getMembersByCommunity(
  communityId: string,
): Promise<Member[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Active members in a community (status = 'active'). */
export async function getActiveMembersByCommunity(
  communityId: string,
): Promise<Member[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("community_id", communityId)
    .eq("status", "active");

  if (error) throw error;
  return data ?? [];
}

/**
 * Look up a member by Clerk id (across communities). Used by the Clerk
 * webhook to link a freshly synced user to their member record. Returns null
 * if no member is associated with that Clerk id yet.
 */
export async function getMemberByClerkId(
  clerkId: string,
): Promise<Member | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("clerk_id", clerkId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Fetch a single member, scoped to the community for tenant safety. */
export async function getMemberById(
  communityId: string,
  memberId: string,
): Promise<Member | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("community_id", communityId)
    .eq("id", memberId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Create a member in the given community. community_id is forced from the
 * trusted argument and can never be overridden by the caller's payload. */
export async function createMember(
  communityId: string,
  data: Omit<MemberInsert, "community_id">,
): Promise<Member> {
  const supabase = createServerClient();
  const { data: created, error } = await supabase
    .from("members")
    .insert({ ...data, community_id: communityId })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

/** Update a member, scoped to the community so cross-tenant writes fail. */
export async function updateMember(
  communityId: string,
  memberId: string,
  data: MemberUpdate,
): Promise<Member> {
  const supabase = createServerClient();
  const { data: updated, error } = await supabase
    .from("members")
    .update(data)
    .eq("community_id", communityId)
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) throw error;
  return updated;
}
