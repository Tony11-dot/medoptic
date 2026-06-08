"use client";

import { useRef, useState } from "react";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";

// Uploads to /api/upload and reports the resulting URL. Shows a live preview.
export function ImageUpload({
  value,
  onChange,
  icon = "glasses",
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  icon?: "glasses" | "eye" | "user";
  className?: string;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-line">
        <ImageBlock src={value} alt="preview" icon={icon} rounded="rounded-none" />
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload(f);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand disabled:opacity-60"
        >
          {busy ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-start text-xs font-medium text-rose-600 hover:underline">
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
