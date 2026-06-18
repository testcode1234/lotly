import { createServerClient } from "./client";
import type { Unit, UnitInsert, UnitUpdate } from "@/types";

/** All units in a community, ordered by unit number. */
export async function getUnitsByCommunity(
  communityId: string,
): Promise<Unit[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("community_id", communityId)
    .order("unit_number", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** Create a unit. community_id is forced from the trusted argument. */
export async function createUnit(
  communityId: string,
  data: Omit<UnitInsert, "community_id">,
): Promise<Unit> {
  const supabase = createServerClient();
  const { data: created, error } = await supabase
    .from("units")
    .insert({ ...data, community_id: communityId })
    .select("*")
    .single();

  if (error) throw error;
  return created;
}

/** Update a unit, scoped to the community so cross-tenant writes fail. */
export async function updateUnit(
  communityId: string,
  unitId: string,
  data: UnitUpdate,
): Promise<Unit> {
  const supabase = createServerClient();
  const { data: updated, error } = await supabase
    .from("units")
    .update(data)
    .eq("community_id", communityId)
    .eq("id", unitId)
    .select("*")
    .single();

  if (error) throw error;
  return updated;
}

/** Delete a unit, scoped to the community. Members keep their row but their
 * unit_id is set null by the FK (ON DELETE SET NULL). */
export async function deleteUnit(
  communityId: string,
  unitId: string,
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("community_id", communityId)
    .eq("id", unitId);

  if (error) throw error;
}
