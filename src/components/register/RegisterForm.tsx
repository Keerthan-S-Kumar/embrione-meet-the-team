"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Eye } from "lucide-react";
import { MemberCard } from "@/components/MemberCard";
import { Field, SelectBox, inputClass } from "@/components/Field";
import { PhotoPicker } from "./PhotoPicker";
import { BIO_MAX, BIO_MIN, BRANCHES, DOMAINS, POSITIONS, SEMESTERS, type Status } from "@/lib/constants";
import { convertToWebp, type ConvertedImage } from "@/lib/image";
import { srnStatus, submitMember } from "@/lib/members";
import { isSupabaseConfigured } from "@/lib/supabase";
import { EMPTY_FORM, type FormState } from "@/lib/types";
import { SRN_PATTERN, normalizeSrn, normalizeUrl, validate } from "@/lib/validation";
import { cn } from "@/lib/utils";

type SrnCheck = { state: "idle" } | { state: "checking" } | { state: "free" } | { state: "taken"; status: Status };

const TAKEN_MESSAGE: Record<Status, string> = {
  pending: "This SRN already has a submission waiting for review.",
  approved: "This SRN is already on the team page.",
  rejected: "This SRN was reviewed earlier. Ask an admin to clear it if you need to resubmit.",
};

const REQUIRED_KEYS = ["name", "domain", "position", "srn", "email", "branch", "semester", "bio", "photo"] as const;

export function RegisterForm() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [attempted, setAttempted] = useState(false);

  const [photo, setPhoto] = useState<ConvertedImage | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState("");
  const [converting, setConverting] = useState(false);
  const [photoError, setPhotoError] = useState<string>();

  const [srnResult, setSrnResult] = useState<{ value: string; status: Status | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewVisible, setPreviewVisible] = useState(true);

  const errors = useMemo(() => {
    const e = validate(form, Boolean(photo));
    if (photoError) e.photo = photoError;
    return e;
  }, [form, photo, photoError]);

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const blur = (key: keyof FormState) => () => setTouched((t) => ({ ...t, [key]: true }));
  const shown = (key: keyof FormState | "photo") => {
    if (key === "photo") return attempted ? errors.photo : photoError;
    return touched[key] || attempted ? errors[key] : undefined;
  };

  // Free the temporary preview URL when it's replaced or the page closes.
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  // Duplicate SRN check: wait 450ms after typing stops, then ask the database.
  const normalizedSrn = normalizeSrn(form.srn);
  const checkable = SRN_PATTERN.test(normalizedSrn) && isSupabaseConfigured;

  useEffect(() => {
    if (!checkable) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const status = await srnStatus(normalizedSrn);
        if (!cancelled) setSrnResult({ value: normalizedSrn, status });
      } catch {
        /* a failed check isn't fatal; the submit step checks again */
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [checkable, normalizedSrn]);

  // What the SRN field shows: nothing, "checking", "available" or "taken"
  const srn: SrnCheck = !checkable
    ? { state: "idle" }
    : srnResult?.value !== normalizedSrn
      ? { state: "checking" }
      : srnResult.status
        ? { state: "taken", status: srnResult.status }
        : { state: "free" };

  // On small screens, show a "Preview" button whenever the card has scrolled out of view.
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setPreviewVisible(entry.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, [done]);

  async function handleFile(file: File) {
    setConverting(true);
    setPhotoError(undefined);
    try {
      const result = await convertToWebp(file);
      setPhoto(result);
      setPhotoName(file.name);
      setPhotoUrl(URL.createObjectURL(result.blob)); // local preview only; nothing is uploaded yet
    } catch (err) {
      setPhoto(null);
      setPhotoUrl(null);
      setPhotoError(err instanceof Error ? err.message : "Couldn't process that image.");
    } finally {
      setConverting(false);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoUrl(null);
    setPhotoName("");
    setPhotoError(undefined);
  }

  const progress = useMemo(() => {
    const missing = REQUIRED_KEYS.filter((k) => errors[k]).length;
    return Math.round(((REQUIRED_KEYS.length - missing) / REQUIRED_KEYS.length) * 100);
  }, [errors]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);

    const blocked = Object.keys(errors).length > 0 || srn.state === "taken";
    if (blocked || !photo) {
      toast.error("Fix the highlighted fields, then submit again.");
      requestAnimationFrame(() => {
        const bad = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        bad?.focus();
        bad?.scrollIntoView({ block: "center", behavior: "smooth" });
      });
      return;
    }
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet. Check the environment variables.");
      return;
    }

    setSubmitting(true);
    try {
      // Re-check right before saving, in case someone took the SRN while this form was open.
      const existing = await srnStatus(form.srn);
      if (existing) {
        setSrnResult({ value: normalizeSrn(form.srn), status: existing });
        toast.error(TAKEN_MESSAGE[existing]);
        return;
      }
      await submitMember(form, photo.blob);
      toast.success("Submitted. An admin will review your card soon.");
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setForm(EMPTY_FORM);
    setTouched({});
    setAttempted(false);
    clearPhoto();
    setSrnResult(null);
    setDone(false);
  }

  const srnError = shown("srn") ?? (srn.state === "taken" ? TAKEN_MESSAGE[srn.status] : undefined);
  const bioLen = form.bio.trim().length;

  const card = (
    <MemberCard
      preview
      stamp={done ? "Pending review" : undefined}
      data={{
        name: form.name,
        domain: form.domain,
        position: form.position,
        branch: form.branch,
        semester: form.semester,
        bio: form.bio,
        photoUrl,
        linkedin: normalizeUrl(form.linkedin, "linkedin.com"),
        github: normalizeUrl(form.github, "github.com"),
        email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()) ? form.email.trim() : null,
      }}
    />
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
      {/* Preview column: first on phones, sticky on desktop */}
      <aside className="order-first lg:order-last" aria-label="Card preview">
        <div ref={previewRef} className="mx-auto w-full max-w-[360px] lg:sticky lg:top-24">
          {card}
          <div className="mt-5" aria-live="polite">
            <div className="mb-1.5 flex items-center justify-between text-[13px] text-dim">
              <span>{done ? "Submitted" : "Card completeness"}</span>
              <span>{done ? "100%" : `${progress}%`}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-cell-2" role="progressbar" aria-valuenow={done ? 100 : progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-eosin transition-[width] duration-300" style={{ width: `${done ? 100 : progress}%` }} />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {done ? (
          <div className="rounded-3xl border border-wall bg-cell p-8">
            <CheckCircle2 className="size-9 text-ok" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-semibold">Your card is in the queue</h2>
            <p className="mt-2 max-w-md text-dim">
              An admin will review it. Once it&apos;s approved, your card appears on the team page. Rejected cards stay hidden.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/team" className="rounded-full bg-eosin px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-eosin-deep">
                See the team page
              </Link>
              <button onClick={reset} className="rounded-full border border-wall-2 px-5 py-2.5 text-sm font-semibold transition hover:bg-cell-2">
                Submit another card
              </button>
            </div>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-10">
            <Section title="About you">
              <Field id="name" label="Full name" error={shown("name")}>
                <input id="name" name="name" autoComplete="name" className={inputClass} value={form.name} onChange={(e) => set("name")(e.target.value)} onBlur={blur("name")} aria-invalid={shown("name") ? true : undefined} aria-describedby="name-msg" placeholder="Aarav Menon" maxLength={60} />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="domain" label="Domain" error={shown("domain")}>
                  <SelectBox id="domain" name="domain" value={form.domain} onChange={(e) => set("domain")(e.target.value)} onBlur={blur("domain")} aria-invalid={shown("domain") ? true : undefined} aria-describedby="domain-msg">
                    <option value="" disabled>Select a domain</option>
                    {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </SelectBox>
                </Field>
                <Field id="position" label="Position" error={shown("position")}>
                  <SelectBox id="position" name="position" value={form.position} onChange={(e) => set("position")(e.target.value)} onBlur={blur("position")} aria-invalid={shown("position") ? true : undefined} aria-describedby="position-msg">
                    <option value="" disabled>Select a position</option>
                    {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </SelectBox>
                </Field>
              </div>
            </Section>

            <Section title="College details">
              <Field
                id="srn"
                label="SRN"
                error={srnError}
                hint="Example: PES1UG23CS001"
                aside={
                  srn.state === "checking" ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-dim"><Loader2 className="size-3 animate-spin" aria-hidden="true" />Checking</span>
                  ) : srn.state === "free" ? (
                    <span className="flex items-center gap-1.5 text-[13px] text-ok"><CheckCircle2 className="size-3.5" aria-hidden="true" />Available</span>
                  ) : null
                }
              >
                <input id="srn" name="srn" className={cn(inputClass, "uppercase placeholder:normal-case")} value={form.srn} onChange={(e) => set("srn")(e.target.value)} onBlur={blur("srn")} aria-invalid={srnError ? true : undefined} aria-describedby="srn-msg" placeholder="PES1UG23CS001" maxLength={16} autoCapitalize="characters" spellCheck={false} />
              </Field>
              <Field id="email" label="Email" error={shown("email")} hint="Your PES email or a personal one.">
                <input id="email" name="email" type="email" autoComplete="email" className={inputClass} value={form.email} onChange={(e) => set("email")(e.target.value)} onBlur={blur("email")} aria-invalid={shown("email") ? true : undefined} aria-describedby="email-msg" placeholder="you@pesu.pes.edu" />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="branch" label="Branch" error={shown("branch")}>
                  <SelectBox id="branch" name="branch" value={form.branch} onChange={(e) => set("branch")(e.target.value)} onBlur={blur("branch")} aria-invalid={shown("branch") ? true : undefined} aria-describedby="branch-msg">
                    <option value="" disabled>Select a branch</option>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </SelectBox>
                </Field>
                <Field id="semester" label="Semester" error={shown("semester")}>
                  <SelectBox id="semester" name="semester" value={form.semester} onChange={(e) => set("semester")(e.target.value)} onBlur={blur("semester")} aria-invalid={shown("semester") ? true : undefined} aria-describedby="semester-msg">
                    <option value="" disabled>Select a semester</option>
                    {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                  </SelectBox>
                </Field>
              </div>
            </Section>

            <Section title="Links">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="linkedin" label="LinkedIn URL" optional error={shown("linkedin")}>
                  <input id="linkedin" name="linkedin" inputMode="url" autoComplete="off" className={inputClass} value={form.linkedin} onChange={(e) => set("linkedin")(e.target.value)} onBlur={blur("linkedin")} aria-invalid={shown("linkedin") ? true : undefined} aria-describedby="linkedin-msg" placeholder="linkedin.com/in/yourname" />
                </Field>
                <Field id="github" label="GitHub URL" optional error={shown("github")}>
                  <input id="github" name="github" inputMode="url" autoComplete="off" className={inputClass} value={form.github} onChange={(e) => set("github")(e.target.value)} onBlur={blur("github")} aria-invalid={shown("github") ? true : undefined} aria-describedby="github-msg" placeholder="github.com/yourname" />
                </Field>
              </div>
            </Section>

            <Section title="Your card">
              <Field
                id="bio"
                label="Short bio"
                error={shown("bio")}
                hint={`${BIO_MIN} to ${BIO_MAX} characters.`}
                aside={
                  <span className={cn("text-[13px] tabular-nums", bioLen === 0 ? "text-dim" : bioLen < BIO_MIN ? "text-eosin" : "text-ok")}>
                    {bioLen} / {BIO_MAX}
                  </span>
                }
              >
                <textarea id="bio" name="bio" rows={4} maxLength={BIO_MAX} className={cn(inputClass, "resize-none leading-relaxed")} value={form.bio} onChange={(e) => set("bio")(e.target.value)} onBlur={blur("bio")} aria-invalid={shown("bio") ? true : undefined} aria-describedby="bio-msg" placeholder="What do you build, and what are you learning right now?" />
              </Field>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">Profile picture</span>
                <PhotoPicker previewUrl={photoUrl} info={photo} fileName={photoName} converting={converting} error={shown("photo")} onFile={handleFile} onClear={clearPhoto} />
              </div>
            </Section>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="submit" disabled={submitting || converting} className="inline-flex items-center justify-center gap-2 rounded-full bg-eosin px-7 py-3 text-[15px] font-semibold text-ink transition hover:bg-eosin-deep disabled:cursor-not-allowed disabled:opacity-60">
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {submitting ? "Submitting" : "Submit for review"}
              </button>
              <p className="text-[13px] text-dim">Your photo uploads only when you submit.</p>
            </div>
          </form>
        )}
      </div>

      {/* Phones: jump back up to the live card from anywhere in the form */}
      {!previewVisible && !done && (
        <button
          type="button"
          onClick={() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          className="fixed bottom-5 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-wall-2 bg-cell-2/95 px-5 py-2.5 text-sm font-semibold shadow-xl backdrop-blur lg:hidden"
        >
          <Eye className="size-4 text-eosin" aria-hidden="true" />
          Preview card
        </button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="border-b border-wall pb-2 text-lg font-semibold text-fg">{title}</h2>
      {children}
    </section>
  );
}
