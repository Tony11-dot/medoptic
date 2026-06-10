"use client";

import { useRef, useState } from "react";
import { upload as blobUpload } from "@vercel/blob/client";
import { ImageBlock } from "@/components/ui/ImageBlock";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/LanguageProvider";
import { cn } from "@/lib/cn";

// Uploads an image and reports the resulting URL. In production it goes straight
// from the browser to Vercel Blob (so large photos work); locally it falls back
// to a server route that writes to /public/uploads.
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
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    try {
      // Use an ASCII-safe upload path. The original file name may contain Hebrew
      // or special characters, which Safari rejects when the Blob client puts the
      // path in a request header ("string did not match the expected pattern").
      // Blob adds a unique suffix server-side, so a generic name is fine.
      const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg" } as Record<string, string>)[file.type] || "jpg";
      const safePath = `uploads/photo.${ext}`;

      // Try direct-to-Blob (production). Returns 501 locally → fall back.
      try {
        const blob = await blobUpload(safePath, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
        });
        onChange(blob.url);
        return;
      } catch {
        // fall through to local server upload
      }
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-local", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.admin.imageUpload.failed);
      onChange(data.url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.admin.imageUpload.failed);
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
          {busy ? t.admin.imageUpload.uploading : value ? t.admin.imageUpload.replace : t.admin.imageUpload.upload}
        </button>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-start text-xs font-medium text-rose-600 hover:underline">
            {t.admin.imageUpload.remove}
          </button>
        )}
      </div>
    </div>
  );
}
