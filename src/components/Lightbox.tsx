"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

/** Full-size photo viewer. Closes on Escape, backdrop click, or the X button. */
export function Lightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 rounded-full bg-cell-2 p-2.5 text-fg transition hover:bg-wall-2"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl border border-wall-2 object-contain shadow-2xl"
      />
    </div>
  );
}