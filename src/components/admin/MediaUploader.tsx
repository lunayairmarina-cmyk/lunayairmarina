import { useEffect, useRef, useState } from "react";
import { ImagePlus, LoaderCircle } from "lucide-react";
import { uploadMediaFile } from "@/services/adminCmsService";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { GalleryPicker } from "@/components/admin/GalleryPicker";
import { resolveMediaSrc, resolveMediaSrcSync, isMediaRef } from "@/lib/media-refs";
import { resolvePublicMediaSrc } from "@/lib/media";

interface MediaUploaderProps {
  value?: string;
  onChange: (url: string, meta?: { caption?: { en: string; ar: string } }) => void;
  pathPrefix?: string;
  label?: string;
  className?: string;
  /** Allow picking an existing site gallery image */
  allowGallery?: boolean;
}

function previewFor(value: string | undefined): string {
  if (!value) return "";
  if (isMediaRef(value)) return resolveMediaSrcSync(value, "");
  if (value.startsWith("data:") || value.startsWith("blob:")) return value;
  return resolvePublicMediaSrc(value, value);
}

export function MediaUploader({
  value,
  onChange,
  pathPrefix = "images/uploads",
  label,
  className,
  allowGallery = false,
}: MediaUploaderProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState(() => previewFor(value));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!value) {
        if (!cancelled) setPreview("");
        return;
      }
      if (isMediaRef(value)) {
        const src = await resolveMediaSrc(value, "");
        if (!cancelled) setPreview(src);
        return;
      }
      if (!cancelled) setPreview(previewFor(value));
    })();
    return () => {
      cancelled = true;
    };
  }, [value]);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await uploadMediaFile(file, pathPrefix);
      onChange(url);
    } catch {
      setError(t("admin.cms.uploadFailed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-[0.6rem] tracking-[0.22em] text-navy/40 uppercase">{label}</p>
      ) : null}
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-navy/10 bg-[#faf8f4]">
          {preview ? (
            <img src={preview} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-navy/35" strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-2 text-xs tracking-[0.14em] text-navy uppercase transition hover:border-navy/25 disabled:opacity-60"
          >
            {busy ? (
              <LoaderCircle className="size-3.5 animate-spin" strokeWidth={1.6} />
            ) : (
              <ImagePlus className="size-3.5" strokeWidth={1.6} />
            )}
            {t("admin.actions.upload")}
          </button>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
      </div>
      {allowGallery ? (
        <GalleryPicker
          value={value}
          onSelect={(src, caption) => onChange(src, { caption })}
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => void onPick(event.target.files?.[0])}
      />
    </div>
  );
}
