"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/Field";
import { ADMIN_EMAIL } from "@/lib/constants";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!isSupabaseConfigured) return setError("Supabase isn't connected yet. Check the environment variables.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      setError(
        error.message.toLowerCase().includes("invalid")
          ? "That email or password isn't right."
          : error.message,
      );
      return;
    }
    toast.success("Signed in.");
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-md">
      <div className="rounded-3xl border border-wall bg-cell p-7 sm:p-9">
        <div className="grid size-11 place-items-center rounded-2xl bg-cell-2 text-eosin">
          <Lock className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold">Admin sign in</h1>
        <p className="mt-1.5 text-sm text-dim">Sign in to review pending member cards.</p>

        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-5" noValidate>
          <Field id="email" label="Email">
            <input id="email" type="email" autoComplete="username" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ADMIN_EMAIL} required />
          </Field>
          <Field id="password" label="Password">
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} autoComplete="current-password" className={`${inputClass} pr-11`} value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-dim hover:text-fg">
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          {error && (
            <p role="alert" className="rounded-xl border border-bad/40 bg-bad/10 px-3.5 py-2.5 text-sm text-bad">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !email || !password} className="inline-flex items-center justify-center gap-2 rounded-full bg-eosin px-6 py-3 text-[15px] font-semibold text-ink transition hover:bg-eosin-deep disabled:cursor-not-allowed disabled:opacity-60">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
