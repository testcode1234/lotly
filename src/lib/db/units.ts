import { createServerClient } from "./client";
import type { Unit } from "@/types";

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
