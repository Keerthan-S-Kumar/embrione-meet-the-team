"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Inbox, Loader2, LogOut, RefreshCw, Search } from "lucide-react";
import { ReviewRow } from "./ReviewRow";
import { deleteMember, fetchAll, updateStatus } from "@/lib/members";
import { supabase } from "@/lib/supabase";
import type { Status } from "@/lib/constants";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "pending" | "approved" | "rejected" | "all";
const TABS: { id: Tab; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const EMPTY_COPY: Record<Tab, string> = {
  pending: "Nothing is waiting for review. New submissions appear here the moment they arrive.",
  approved: "No approved members yet.",
  rejected: "No rejected cards.",
  all: "No submissions yet.",
};

export function Dashboard({ email }: { email: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [confirmId, setConfirmId] = useState<string>();
  const [live, setLive] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(
    () =>
      fetchAll()
        .then((list) => {
          setMembers(list);
          setError(undefined);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load submissions."))
        .finally(() => setLoading(false)),
    [],
  );

  const refresh = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    load();
    // Live updates: Supabase Realtime tells us whenever the members table changes.
    const channel = supabase
      .channel("members-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "members" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const name = (payload.new as Partial<Member>).name ?? "Someone";
          toast.info(`New submission from ${name}`);
        }
        load();
      })
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [load]);

  const counts = useMemo(() => {
    const c = { total: members.length, pending: 0, approved: 0, rejected: 0 };
    for (const m of members) c[m.status]++;
    return c;
  }, [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (tab === "all" || m.status === tab) &&
        (!q || [m.name, m.srn, m.email, m.domain].some((v) => v.toLowerCase().includes(q))),
    );
  }, [members, tab, query]);

  const activeId = visible.find((m) => m.id === selectedId)?.id ?? visible[0]?.id;

  useEffect(() => {
    if (activeId) document.getElementById(`row-${activeId}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  /** Optimistic update: change the UI instantly, roll back if the database says no. */
  const persist = useCallback(async (m: Member, next: Status): Promise<boolean> => {
    const prev = m.status;
    setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, status: next } : x)));
    try {
      await updateStatus(m.id, next);
      return true;
    } catch (err) {
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, status: prev } : x)));
      toast.error(err instanceof Error ? err.message : "Couldn't update. Try again.");
      return false;
    }
  }, []);

  const changeStatus = useCallback(
    async (m: Member, next: Status) => {
      const prev = m.status;
      const idx = visible.findIndex((v) => v.id === m.id);
      setSelectedId(visible[idx + 1]?.id ?? visible[idx - 1]?.id); // move on to the next card
      if (!(await persist(m, next))) return;
      const verb = next === "approved" ? "approved" : next === "rejected" ? "rejected" : "moved back to pending";
      toast.success(`${m.name} ${verb}`, {
        action: { label: "Undo", onClick: () => void persist({ ...m, status: next }, prev) },
      });
    },
    [visible, persist],
  );

  /** Delete needs two clicks within 4 seconds, so a stray click can't destroy a profile. */
  function requestDelete(m: Member) {
    if (confirmId !== m.id) {
      setConfirmId(m.id);
      clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(undefined), 4000);
      return;
    }
    clearTimeout(confirmTimer.current);
    setConfirmId(undefined);
    setMembers((list) => list.filter((x) => x.id !== m.id));
    deleteMember(m)
      .then(() => toast.success(`${m.name} deleted`))
      .catch((err) => {
        setMembers((list) => [m, ...list]);
        toast.error(err instanceof Error ? err.message : "Couldn't delete. Try again.");
      });
  }

  // Keyboard shortcuts: j/k or arrows to move, a to approve, r to reject.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      const i = visible.findIndex((m) => m.id === activeId);
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedId(visible[Math.min(i + 1, visible.length - 1)]?.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedId(visible[Math.max(i - 1, 0)]?.id);
      } else if ((e.key === "a" || e.key === "r") && visible[i]) {
        changeStatus(visible[i], e.key === "a" ? "approved" : "rejected");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, activeId, changeStatus]);

  async function signOut() {
    await supabase.auth.signOut();
    toast("Signed out.");
  }

  const stats = [
    { label: "Total submissions", value: counts.total, accent: false },
    { label: "Pending", value: counts.pending, accent: counts.pending > 0 },
    { label: "Approved", value: counts.approved, accent: false },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="bg-gradient-to-br from-fg via-eosin to-[#7aa2ff] bg-clip-text pb-2 text-5xl font-semibold leading-[1.02] text-transparent sm:text-7xl">
            Moderation
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-dim">
            <span className={cn("size-2 rounded-full", live ? "bg-ok" : "bg-wall-2")} aria-hidden="true" />
            <span>Signed in as {email}</span>
            <span>{live ? "|  Live updates on." : "|  Live updates off, refresh to check."}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="inline-flex items-center gap-2 rounded-full border border-wall-2 px-4 py-2 text-sm font-medium transition hover:bg-cell-2">
            <RefreshCw className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
            Refresh
          </button>
          <button onClick={signOut} className="inline-flex items-center gap-2 rounded-full border border-wall-2 px-4 py-2 text-sm font-medium transition hover:bg-cell-2">
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      <section aria-label="Counters" className="mt-9 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className={cn("rounded-3xl border bg-cell p-6", s.accent ? "border-eosin/50" : "border-wall")}>
            <p className="text-sm text-dim">{s.label}</p>
            <p className={cn("mt-2 font-display text-6xl font-semibold tabular-nums", s.accent && "text-eosin")}>{s.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const n = t.id === "all" ? counts.total : counts[t.id];
            return (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("rounded-full px-4 py-2 text-sm font-medium transition-colors", tab === t.id ? "bg-fg text-ink" : "text-dim hover:bg-cell-2 hover:text-fg")}>
                {t.label}
                <span className={cn("ml-2 tabular-nums", tab === t.id ? "text-ink/60" : "text-dim")}>{n}</span>
              </button>
            );
          })}
        </div>
        <label className="relative block w-full sm:w-72">
          <span className="sr-only">Search submissions</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, SRN or email" className="w-full rounded-full border border-wall bg-cell py-2.5 pl-10 pr-4 text-sm placeholder:text-dim/70 focus-visible:outline-none focus:border-eosin focus:ring-2 focus:ring-eosin/25" />
        </label>
      </div>

      <div className="mt-6">
        {loading && members.length === 0 ? (
          <div className="flex items-center justify-center gap-3 py-20 text-dim" role="status">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            Loading submissions
          </div>
        ) : error ? (
          <div role="alert" className="rounded-3xl border border-bad/40 bg-bad/10 p-6 text-sm text-bad">
            {error}
            <button onClick={refresh} className="ml-3 font-semibold underline">Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-wall-2 px-6 py-16 text-center">
            <Inbox className="size-8 text-dim" aria-hidden="true" />
            <p className="mt-3 max-w-sm text-dim">{query ? "No submissions match that search." : EMPTY_COPY[tab]}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {visible.map((m) => (
              <ReviewRow key={m.id} member={m} active={m.id === activeId} confirmingDelete={confirmId === m.id} onStatus={changeStatus} onDelete={requestDelete} onSelect={() => setSelectedId(m.id)} />
            ))}
          </ul>
        )}
        {visible.length > 0 && (
          <p className="mt-6 hidden text-[13px] text-dim sm:block">
            Keyboard: j and k to move between cards, a to approve, r to reject.
          </p>
        )}
      </div>
    </div>
  );
}
