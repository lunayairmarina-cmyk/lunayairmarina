import { useEffect, useState } from "react";
import { isMediaRef, resolveMediaSrc, resolveMediaSrcSync } from "@/lib/media-refs";
import { resolvePublicMediaSrc } from "@/lib/media";

/** Resolve CMS image values (`media:id`, paths, URLs) for use as `<img src>`. */
export function useResolvedMediaSrc(src?: string | null, fallback = ""): string {
  const [resolved, setResolved] = useState(() => {
    if (!src) return fallback;
    if (isMediaRef(src)) return resolveMediaSrcSync(src, fallback);
    return resolvePublicMediaSrc(src, fallback);
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!src) {
        if (!cancelled) setResolved(fallback);
        return;
      }
      if (isMediaRef(src)) {
        const url = await resolveMediaSrc(src, fallback);
        if (!cancelled) setResolved(url || fallback);
        return;
      }
      if (!cancelled) setResolved(resolvePublicMediaSrc(src, fallback));
    })();
    return () => {
      cancelled = true;
    };
  }, [src, fallback]);

  return resolved;
}
