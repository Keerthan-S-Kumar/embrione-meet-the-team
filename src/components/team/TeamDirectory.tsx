"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Search, SearchX, Users } from "lucide-react";
import { MemberCard } from "@/components/MemberCard";
import { DOMAINS, POSITIONS, domainColor } from "@/lib/constants";
import { fetchApproved } from "@/lib/members";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TeamDirectory() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [domain, setDomain] = useState<string>("All");
  const [position, setPosition] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [firstLoad, setFirstLoad] = useState(true);

  const load = useCallback(
    () =>
      fetchApproved()
        .then((list) => {
          setMembers(list);
          setError(undefined);
        })
        .catch((err) => setError(err instanceof Error ? err.message : "Couldn't load the team."))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    load();
    window.addEventListener("focus", load); // pick up fresh approvals when the tab regains focus
    return () => window.removeEventListener("focus", load);
  }, [load]);

  // After the first set of cards has played its entrance, later filter changes shouldn't re-stagger.
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFirstLoad(false), 1200);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const perDomain = useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of members) map[m.domain] = (map[m.domain] ?? 0) + 1;
    return map;
  }, [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (domain === "All" || m.domain === domain) &&
        (position === "All" || m.position === position) &&
        (!q || m.name.toLowerCase().includes(q)),
    );
  }, [members, domain, position, query]);

  const filtering = domain !== "All" || position !== "All" || query.trim() !== "";

  function clear() {
    setDomain("All");
    setPosition("All");
    setQuery("");
  }

  return (
    <MotionConfig reducedMotion="user">
      <section aria-label="Filters" className="flex flex-col gap-5">
        <div role="group" aria-label="Filter by domain" className="flex flex-wrap gap-2">
          <Chip active={domain === "All"} onClick={() => setDomain("All")}>
            All domains
            <Count n={members.length} />
          </Chip>
          {DOMAINS.map((d) => (
            <Chip key={d} active={domain === d} onClick={() => setDomain(d)} dim={!perDomain[d]}>
              <span className="size-2 rounded-full" style={{ background: domainColor(d) }} aria-hidden="true" />
              {d}
              <Count n={perDomain[d] ?? 0} />
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div role="group" aria-label="Filter by position" className="flex flex-wrap gap-2">
            {["All", ...POSITIONS].map((p) => (
              <Chip key={p} active={position === p} onClick={() => setPosition(p)} subtle>
                {p === "All" ? "All positions" : p}
              </Chip>
            ))}
          </div>
          <label className="relative block w-full sm:w-64">
            <span className="sr-only">Search by name</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" aria-hidden="true" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name" className="w-full rounded-full border border-wall bg-cell py-2.5 pl-10 pr-4 text-sm placeholder:text-dim/70 focus-visible:outline-none focus:border-eosin focus:ring-2 focus:ring-eosin/25" />
          </label>
        </div>
      </section>

      <p className="mt-8 text-sm text-dim" aria-live="polite">
        {loading ? "Loading the team" : `Showing ${visible.length} of ${members.length} member${members.length === 1 ? "" : "s"}`}
      </p>

      <div className="mt-5">
        {loading ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="skeleton aspect-[3/4] rounded-[28px] border border-wall" />
            ))}
          </ul>
        ) : error ? (
          <div role="alert" className="rounded-3xl border border-bad/40 bg-bad/10 p-6 text-sm text-bad">
            {error}
            <button onClick={() => { setLoading(true); load(); }} className="ml-3 font-semibold underline">Try again</button>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-wall-2 px-6 py-20 text-center">
            {filtering ? <SearchX className="size-9 text-dim" aria-hidden="true" /> : <Users className="size-9 text-dim" aria-hidden="true" />}
            <h2 className="mt-4 text-2xl font-semibold">{filtering ? "No one matches those filters" : "No one is on the page yet"}</h2>
            <p className="mt-1.5 max-w-sm text-dim">
              {filtering ? "Try a different domain or position, or clear the filters." : "Approved member cards show up here. Build yours to get things started."}
            </p>
            {filtering ? (
              <button onClick={clear} className="mt-6 rounded-full bg-eosin px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-eosin-deep">Clear filters</button>
            ) : (
              <Link href="/register" className="mt-6 rounded-full bg-eosin px-6 py-2.5 text-sm font-semibold text-ink transition hover:bg-eosin-deep">Build your card</Link>
            )}
          </div>
        ) : (
          <motion.ul layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {visible.map((m, i) => (
                <motion.li
                  key={m.id}
                  className="h-full"
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, delay: firstLoad ? Math.min(i, 8) * 0.06 : 0 }}
                >
                  <MemberCard
                    data={{
                      name: m.name,
                      domain: m.domain,
                      position: m.position,
                      branch: m.branch,
                      semester: m.semester,
                      bio: m.bio ?? "",
                      photoUrl: m.photo_url,
                      linkedin: m.linkedin_url,
                      github: m.github_url,
                      email: m.email,
                    }}
                  />
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </MotionConfig>
  );
}

function Chip({
  active,
  onClick,
  children,
  dim,
  subtle,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dim?: boolean;
  subtle?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-fg text-ink"
          : cn("border text-fg/90 hover:bg-cell-2", subtle ? "border-wall/70" : "border-wall", dim && "text-dim"),
      )}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return <span className="tabular-nums opacity-60">{n}</span>;
}
