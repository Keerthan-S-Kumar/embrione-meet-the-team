"use client";

import { useRef, useState } from "react";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import type { ConvertedImage } from "@/lib/image";
import { formatBytes, cn } from "@/lib/utils";

interface Props {
  previewUrl: string | null;
  info: ConvertedImage | null;
  fileName: string;
  converting: boolean;
  error?: string;
  onFile: (file: File) => void;
  onClear: () => void;
}

export function PhotoPicker({ previewUrl, info, fileName, converting, error, onFile, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        id="photo"
        name="photo"
        type="file"
        accept=".png,.jpg,.jpeg,image/png,image/jpeg"
        className="sr-only"
        aria-invalid={error ? true : undefined}
        aria-describedby="photo-msg"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = ""; // lets the same file be picked again
        }}
      />

      {!previewUrl && !converting ? (
        <label
          htmlFor="photo"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed px-6 py-9 text-center transition-colors",
            dragging ? "border-eosin bg-eosin/10" : "border-wall-2 bg-cell hover:border-eosin/60",
            error && "border-bad",
          )}
        >
          <ImagePlus className="size-7 text-eosin" aria-hidden="true" />
          <span className="text-[15px] font-medium">Choose a photo or drop it here</span>
          <span className="text-[13px] text-dim">PNG or JPG, up to 15 MB. We convert it to WebP in your browser.</span>
        </label>
      ) : (
        <div className="flex items-center gap-4 rounded-2xl border border-wall bg-cell p-3">
          <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-cell-2">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Your converted photo" className="size-full object-cover" />
            )}
            {converting && (
              <div className="grid size-full place-items-center">
                <Loader2 className="size-5 animate-spin text-dim" aria-hidden="true" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {converting ? (
              <p className="text-sm text-dim" role="status">Converting to WebP…</p>
            ) : (
              info && (
                <>
                  <p className="truncate text-sm font-medium">{fileName}</p>
                  <p className="mt-0.5 flex items-start gap-1.5 text-[13px] text-ok" role="status">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {formatBytes(info.originalBytes)} {info.originalType.replace("image/", "").toUpperCase()} became{" "}
                      {formatBytes(info.webpBytes)} WebP at {info.width}×{info.height}
                    </span>
                  </p>
                  <label htmlFor="photo" className="mt-1.5 inline-block cursor-pointer text-[13px] font-medium text-eosin hover:underline">
                    Replace photo
                  </label>
                </>
              )
            )}
          </div>
          {!converting && (
            <button type="button" onClick={onClear} aria-label="Remove photo" className="rounded-full p-2 text-dim transition-colors hover:bg-cell-2 hover:text-fg">
              <X className="size-4" />
            </button>
          )}
        </div>
      )}

      {error ? (
        <p id="photo-msg" role="alert" className="text-[13px] text-bad">
          {error}
        </p>
      ) : (
        <p id="photo-msg" className="sr-only">
          Profile picture, required.
        </p>
      )}
    </div>
  );
}
