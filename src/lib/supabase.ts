import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until the two env vars are set. The UI shows a setup banner instead of crashing. */
export const isSupabaseConfigured = Boolean(url && anonKey);

// The fallbacks only exist so `next build` can run without secrets; no request is made with them.
export const supabase = createClient(url || "http://localhost:54321", anonKey || "missing-anon-key");
