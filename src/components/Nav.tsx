"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CellMark } from "./Icons";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/team", label: "Team" },
  { href: "/register", label: "Join" },
  { href: "/admin", label: "Admin" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-wall/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Embrione home">
          <CellMark className="size-7" />
          <span className="bg-linear-to-r from-[#c39bff] to-eosin bg-clip-text font-display text-xl font-semibold tracking-tight text-transparent">
            Embrione
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-cell-2 text-fg" : "text-dim hover:text-fg",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
