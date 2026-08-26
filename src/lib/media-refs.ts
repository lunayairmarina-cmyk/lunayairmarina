import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";

const MEDIA_PREFIX = "media:";
const memoryCache = new Map<string, string>();

export function isMediaRef(src: string | undefined | null): boolean {
  return Boolean(src && src.startsWith(MEDIA_PREFIX));
}

export function mediaRefId(src: string): string | null {
  if (!isMediaRef(src)) return null;
  return src.slice(MEDIA_PREFIX.length) || null;
}

export function toMediaRef(id: string): string {
  return `${MEDIA_PREFIX}${id}`;
}

/** Cache a displayable URL (https or data:) keyed by media id. */
export function cacheMediaDataUrl(id: string, url: string) {
  if (!id) return;
  if (url.startsWith("data:") || url.startsWith("https://") || url.startsWith("http://")) {
    memoryCache.set(id, url);
  }
}

export function getCachedMediaDataUrl(src: string | undefined | null): string | null {
  if (!src) return null;
  if (src.startsWith("data:") || src.startsWith("https://") || src.startsWith("http://")) {
    return src;
  }
  const id = mediaRefId(src);
  if (!id) return null;
  return memoryCache.get(id) ?? null;
}

/** Sync resolve: cache/data URL/https/passthrough. Never returns a raw `media:` ref. */
export function resolveMediaSrcSync(src: string | undefined | null, fallback = ""): string {
  if (!src) return fallback;
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("https://") ||
    src.startsWith("http://")
  ) {
    return src;
  }
  const cached = getCachedMediaDataUrl(src);
  if (cached) return cached;
  if (isMediaRef(src)) return fallback;
  return src;
}

type MediaDoc = {
  dataUrl?: string;
  url?: string;
};

/** Resolve media:id from memory or Firestore `media/{id}` (url or legacy dataUrl). */
export async function resolveMediaSrc(
  src: string | undefined | null,
  fallback = "",
): Promise<string> {
  if (!src) return fallback;
  if (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("https://") ||
    src.startsWith("http://")
  ) {
    return src;
  }
  const cached = getCachedMediaDataUrl(src);
  if (cached) return cached;

  const id = mediaRefId(src);
  if (!id) return isMediaRef(src) ? fallback : src;

  try {
    const snap = await getDoc(doc(getDb(), "media", id));
    if (!snap.exists()) return fallback;
    const data = snap.data() as MediaDoc;
    const url = String(data.url ?? "");
    if (url.startsWith("https://") || url.startsWith("http://")) {
      cacheMediaDataUrl(id, url);
      return url;
    }
    const dataUrl = String(data.dataUrl ?? "");
    if (dataUrl.startsWith("data:")) {
      cacheMediaDataUrl(id, dataUrl);
      return dataUrl;
    }
  } catch {
    // Offline / rules
  }
  return fallback;
}

export async function resolveManyMediaSrcs(srcs: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    srcs.map(async (src) => {
      out[src] = await resolveMediaSrc(src, src);
    }),
  );
  return out;
}
