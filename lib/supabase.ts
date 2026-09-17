import "server-only";
import { createClient } from "@supabase/supabase-js";

export function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  // Trusted server client for this mocked-identity demo. Production needs signed auth and RLS.
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
