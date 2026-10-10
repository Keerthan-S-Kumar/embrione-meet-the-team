"use client";

import { isSupabaseConfigured } from "@/lib/supabase";

/** Shown only when the Supabase env vars are missing, so a bad deploy explains itself. */
export function ConfigBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <div role="alert" className="border-b border-bad/40 bg-bad/10 px-5 py-3 text-center text-sm text-bad">
      Supabase isn&apos;t connected. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then redeploy.
    </div>
  );
}
