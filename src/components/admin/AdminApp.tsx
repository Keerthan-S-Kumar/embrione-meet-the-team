"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { Dashboard } from "./Dashboard";
import { ADMIN_EMAIL } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

/** Decides what /admin shows: loading, the login form, or the dashboard. */
export function AdminApp() {
  // undefined = still checking for a saved session, null = signed out
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center gap-3 py-32 text-dim" role="status">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        Checking your session
      </div>
    );
  }

  if (!session) return <LoginForm />;

  if (session.user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-3xl border border-wall bg-cell p-8 text-center">
        <h1 className="text-2xl font-semibold">This account isn&apos;t an admin</h1>
        <p className="mt-2 text-sm text-dim">Sign out and use the admin email to continue.</p>
        <button onClick={() => supabase.auth.signOut()} className="mt-6 rounded-full bg-eosin px-6 py-2.5 text-sm font-semibold text-ink">
          Sign out
        </button>
      </div>
    );
  }

  return <Dashboard email={session.user.email} />;
}
