import { createServerClient } from "./client";
import type { User, UserInsert } from "@/types";

/**
 * Insert or update the users row mirrored from Clerk. Keyed on clerk_id so
 * repeated user.created/user.updated webhooks are idempotent.
 */
export async function upsertUserFromClerk(data: UserInsert): Promise<User> {
  const supabase = createServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .upsert(data, { onConflict: "clerk_id" })
    .select("*")
    .single();

  if (error) throw error;
  return user;
}

/** Remove the mirrored users row when a Clerk user is deleted. */
export async function deleteUserByClerkId(clerkId: string): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("clerk_id", clerkId);

  if (error) throw error;
}
