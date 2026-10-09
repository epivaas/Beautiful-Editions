import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with the service role key: bypasses RLS, so only for server code (the suggestions
 * table has no policies at all). "server-only" makes the build fail if a client component imports this.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL.");
  return createClient(url, key, { auth: { persistSession: false } });
}
