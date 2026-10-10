"use client";

import { useRef } from "react";
import { Mail } from "lucide-react";
import { AvatarPlaceholder, GitHubIcon, LinkedInIcon } from "./Icons";
import { domainColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface CardData {
  name: string;
  domain: string;
  position: string;
  branch: string;
  semester: number | string;
  bio: string;
  photoUrl: string | null;
  linkedin?: string | null;
  github?: string | null;
  email?: string | null;
}

interface Props {
  data: CardData;
  /** Optional label pinned to the photo, e.g. "Pending review". */
  stamp?: string;
  /** Preview mode: placeholder copy for empty fields. */
  preview?: boolean;
  tilt?: boolean;
}

/** Heavier positions get a heavier badge, so seniority reads at a glance. */
function badgeClass(position: string) {
  switch (position) {
    case "Head":
      return "bg-[var(--dc)] text-ink";
    case "Vice-Head":
      return "bg-[color-mix(in_oklab,var(--dc)_20%,#0b0813)] text-[var(--dc)] ring-1 ring-inset ring-[color-mix(in_oklab,var(--dc)_55%,transparent)]";
    case "Core Member":
      return "bg-ink/60 text-fg ring-1 ring-inset ring-wall-2";
    default:
      return "bg-ink/60 text-dim ring-1 ring-inset ring-wall";
  }
}

export function MemberCard({ data, stamp, preview = false, tilt = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const color = domainColor(data.domain);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || !tilt || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.dataset.active = "true";
    el.style.setProperty("--ry", `${((px - 0.5) * 9).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${((0.5 - py) * 7).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
    el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.dataset.active = "false";
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  const name = data.name.trim() || (preview ? "Your name" : "");
  const domain = data.domain || (preview ? "Your domain" : "");
  const position = data.position || (preview ? "Position" : "");
  const bio = data.bio.trim() || (preview ? "Your bio shows up here as you type. Say what you build and what you want to learn." : "");
  const meta = [data.branch, data.semester ? `Semester ${data.semester}` : ""].filter(Boolean).join(", ");

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className="tilt relative h-full w-full"
      style={{ "--dc": color } as React.CSSProperties}
    >
      <article
        className="relative flex h-full flex-col overflow-hidden rounded-[28px] border border-wall bg-cell"
        style={{
          boxShadow: `0 0 0 1px color-mix(in oklab, ${color} 18%, transparent), 0 40px 70px -40px color-mix(in oklab, ${color} 55%, transparent)`,
        }}
      >
        {/* Photo area: tinted by the person's domain colour */}
        <div
          className="relative aspect-[6/5] w-full overflow-hidden"
          style={{ background: `radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, ${color} 38%, #130f1f), #130f1f 78%)` }}
        >
          {data.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.photoUrl} alt={name ? `Photo of ${name}` : "Profile photo"} className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="flex size-full flex-col items-center justify-end text-[color:var(--dc)]">
              <AvatarPlaceholder className="w-[68%]" />
              {preview && <span className="absolute inset-x-0 top-[24%] text-center text-xs font-medium text-fg/60">Your photo appears here</span>}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-cell to-transparent" />
          <span className={cn("absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur", badgeClass(data.position))}>
            {position}
          </span>
          {stamp && (
            <span className="absolute right-4 top-4 rounded-full bg-ink/75 px-3 py-1 text-xs font-medium text-fg ring-1 ring-inset ring-wall-2 backdrop-blur">
              {stamp}
            </span>
          )}
        </div>

        <div className="relative -mt-9 flex flex-1 flex-col gap-3 px-5 pb-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium" style={{ color }}>
              <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />
              <span className="truncate">{domain}</span>
            </p>
            <h3 className={cn("mt-1 truncate font-display text-[26px] font-semibold leading-tight", !data.name.trim() && preview && "text-dim")}>
              {name}
            </h3>
            {meta && <p className="mt-0.5 truncate text-sm text-dim">{meta}</p>}
          </div>

          <p className={cn("line-clamp-3 break-words text-sm leading-relaxed", data.bio.trim() ? "text-fg/85" : "text-dim")}>{bio}</p>

          <div className="mt-auto flex items-center gap-1 pt-1">
            {data.linkedin && (
              <a href={data.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${name} on LinkedIn`} className="rounded-full p-2 text-dim transition-colors hover:bg-cell-2 hover:text-fg">
                <LinkedInIcon className="size-[18px]" />
              </a>
            )}
            {data.github && (
              <a href={data.github} target="_blank" rel="noopener noreferrer" aria-label={`${name} on GitHub`} className="rounded-full p-2 text-dim transition-colors hover:bg-cell-2 hover:text-fg">
                <GitHubIcon className="size-[18px]" />
              </a>
            )}
            {data.email && (
              <a href={`mailto:${data.email}`} aria-label={`Email ${name}`} className="rounded-full p-2 text-dim transition-colors hover:bg-cell-2 hover:text-fg">
                <Mail className="size-[18px]" />
              </a>
            )}
            {preview && !data.linkedin && !data.github && !data.email && <span className="px-1 text-xs text-dim">Links appear here</span>}
          </div>
        </div>
        <div className="glare" />
      </article>
    </div>
  );
}
