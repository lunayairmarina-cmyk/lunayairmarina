import { useMemo } from "react";
import { loadCmsStore, type PageHeaderId } from "@/lib/cms-store";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { isFragileGallerySrc } from "@/lib/gallery-src";
import { isMediaRef, resolveMediaSrcSync } from "@/lib/media-refs";
import { resolvePublicMediaSrc } from "@/lib/media";

/** Stable public header paths (survive Vite hash changes across deploys). */
const STABLE_HEADERS: Record<PageHeaderId, string> = {
  about: "/images/headers/header-about.webp",
  services: "/images/headers/header-services.webp",
  contact: "/images/headers/header-contact.webp",
  blog: "/images/headers/header-blog.webp",
  application: "/images/headers/header-about.webp",
};

function isUsableHeaderSrc(src: string | undefined | null): src is string {
  if (!src || !src.trim()) return false;
  if (isMediaRef(src)) {
    // Only usable if already resolved in-session.
    return Boolean(resolveMediaSrcSync(src, ""));
  }
  if (isFragileGallerySrc(src)) return false;
  return true;
}

export function usePageHeaderImage(pageId: PageHeaderId, fallback: string) {
  const site = useOptionalSiteContent();
  return useMemo(() => {
    const stable = STABLE_HEADERS[pageId] || fallback;
    const fromCms = loadCmsStore().pageHeaders[pageId];

    if (isUsableHeaderSrc(fromCms)) {
      if (isMediaRef(fromCms)) {
        return resolveMediaSrcSync(fromCms, stable);
      }
      return resolvePublicMediaSrc(fromCms, stable);
    }

    // Prefer stable /images/headers over hashed /assets/... fallbacks.
    return stable || fallback;
  }, [pageId, fallback, site?.bundle?.fetchedAt]);
}
