"use client";

import { useState } from "react";
import { Lightbox } from "@/components/Lightbox";
import { Check, Mail, Trash2, Undo2, X } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/Icons";
import { domainColor, type Status } from "@/lib/constants";
import type { Member } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const STATUS_STYLE: Record<Status, string> = {
  pending: "bg-eosin/15 text-eosin ring-eosin/40",
  approved: "bg-ok/15 text-ok ring-ok/40",
  rejected: "bg-bad/15 text-bad ring-bad/40",
};

interface Props {
  member: Member;
  active: boolean;
  confirmingDelete: boolean;
  rejecting: boolean;
  onStatus: (m: Member, s: Status) => void;
  onRejectConfirm: (m: Member, note: string) => void;
  onRejectCancel: () => void;
  onDelete: (m: Member) => void;
  onSelect: () => void;
}

const QUICK_REASONS = ["Photo is unclear", "Bio is too short or off-topic", "Wrong domain or position", "Duplicate or test entry"];

export function ReviewRow({ member: m, active, confirmingDelete, rejecting, onStatus, onRejectConfirm, onRejectCancel, onDelete, onSelect }: Props) {
  const color = domainColor(m.domain);
  const [note, setNote] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  return (
    <li
      id={`row-${m.id}`}
      onClick={onSelect}
      className={cn(
        "grid gap-4 rounded-3xl border bg-cell p-4 transition-colors sm:grid-cols-[88px_minmax(0,1fr)] sm:p-5 lg:grid-cols-[88px_minmax(0,1fr)_auto]",
        active ? "border-eosin/60 ring-1 ring-eosin/30" : "border-wall",
      )}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setLightboxOpen(true);
        }}
        aria-label={`View ${m.name}'s photo full size`}
        className="size-20 shrink-0 overflow-hidden rounded-2xl bg-cell-2 transition hover:opacity-80 sm:size-[88px]"
        >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.photo_url} alt={`Photo of ${m.name}`} className="size-full object-cover" loading="lazy" />
      </button>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h3 className="truncate font-display text-xl font-semibold">{m.name}</h3>
          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset", STATUS_STYLE[m.status])}>{m.status}</span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
          <span className="inline-flex items-center gap-1.5 font-medium" style={{ color }}>
            <span className="size-2 rounded-full" style={{ background: color }} />
            {m.domain}
          </span>
          <span className="text-dim">{m.position}</span>
        </p>
        <p className="mt-1 text-[13px] text-dim">
          {m.srn}, {m.branch}, Semester {m.semester}. Submitted {timeAgo(m.created_at)}.
        </p>
        {m.status === "rejected" && m.rejection_note && (
          <p className="mt-2.5 rounded-xl border border-bad/30 bg-bad/10 px-3 py-2 text-[13px] text-bad">Reason: {m.rejection_note}</p>
        )}
        {m.bio && <p className="mt-2.5 line-clamp-3 break-words text-sm leading-relaxed text-fg/85">{m.bio}</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-1 text-dim">
          <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[13px] hover:bg-cell-2 hover:text-fg">
            <Mail className="size-3.5" aria-hidden="true" />
            <span className="max-w-[220px] truncate">{m.email}</span>
          </a>
          {m.linkedin_url && (
            <a href={m.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on LinkedIn`} className="rounded-full p-2 hover:bg-cell-2 hover:text-fg">
              <LinkedInIcon className="size-4" />
            </a>
          )}
          {m.github_url && (
            <a href={m.github_url} target="_blank" rel="noopener noreferrer" aria-label={`${m.name} on GitHub`} className="rounded-full p-2 hover:bg-cell-2 hover:text-fg">
              <GitHubIcon className="size-4" />
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2 sm:col-span-2 lg:col-span-1 lg:w-44 lg:flex-col">
        {m.status !== "approved" && (
          <button onClick={() => onStatus(m, "approved")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-eosin px-4 py-2 text-sm font-semibold text-ink transition hover:bg-eosin-deep lg:w-full lg:flex-none">
            <Check className="size-4" aria-hidden="true" />
            Approve
          </button>
        )}
        {m.status !== "rejected" && (
          <button onClick={() => onStatus(m, "rejected")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-wall-2 px-4 py-2 text-sm font-semibold transition hover:bg-cell-2 lg:w-full lg:flex-none">
            <X className="size-4" aria-hidden="true" />
            Reject
          </button>
        )}
        {m.status !== "pending" && (
          <button onClick={() => onStatus(m, "pending")} className="inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-dim transition hover:bg-cell-2 hover:text-fg lg:w-full lg:flex-none">
            <Undo2 className="size-4" aria-hidden="true" />
            Back to pending
          </button>
        )}
        <button
          onClick={() => onDelete(m)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition lg:w-full",
            confirmingDelete ? "bg-bad text-ink" : "text-dim hover:bg-bad/10 hover:text-bad",
          )}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {confirmingDelete ? "Click to confirm" : "Delete"}
        </button>
      </div>

      {rejecting && (
        <div className="rounded-2xl border border-wall-2 bg-cell-2 p-4 sm:col-span-2 lg:col-span-3" onKeyDown={(e) => e.key === "Escape" && onRejectCancel()}>
          <label htmlFor={`note-${m.id}`} className="text-sm font-medium">
            Reason for rejecting {m.name} <span className="font-normal text-dim">optional</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button key={r} type="button" onClick={() => setNote(r)} className="rounded-full border border-wall-2 px-3 py-1 text-[13px] text-dim transition hover:bg-cell hover:text-fg">
                {r}
              </button>
            ))}
          </div>
          <textarea id={`note-${m.id}`} autoFocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} rows={2} placeholder="A note for the other admins" className="mt-3 w-full resize-none rounded-xl border border-wall bg-cell px-3.5 py-2.5 text-sm placeholder:text-dim/60 focus-visible:outline-none focus:border-eosin focus:ring-2 focus:ring-eosin/25" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button onClick={() => onRejectConfirm(m, note)} className="rounded-full bg-bad px-5 py-2 text-sm font-semibold text-ink transition hover:opacity-90">Confirm reject</button>
            <button onClick={onRejectCancel} className="rounded-full border border-wall-2 px-5 py-2 text-sm font-medium transition hover:bg-cell">Cancel</button>
            <span className="ml-auto text-[13px] tabular-nums text-dim">{note.length} / 300</span>
          </div>
        </div>
      )}
      {lightboxOpen && <Lightbox src={m.photo_url} alt={`Photo of ${m.name}`} onClose={() => setLightboxOpen(false)} />}
    </li>
  );
}