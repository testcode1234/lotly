import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Server-side Supabase client. Uses the SERVICE ROLE key and therefore
 * BYPASSES Row Level Security. Use this for all server-side data access
 * (API routes, server components, db/ query functions). Tenant isolation is
 * enforced in application code by scoping every query to community_id.
 *
 * NEVER import this into client components.
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Browser Supabase client. Uses the public ANON key and is subject to RLS.
 * Safe to use in client components. (RLS currently denies anon access, so
 * this is reserved for future client-side reads guarded by policies.)
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  return createClient<Database>(url, anonKey);
}
