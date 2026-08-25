import { loadCmsStore, type PageHeaderId } from "@/lib/cms-store";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { isFragileGallerySrc } from "@/lib/gallery-src";
import { isMediaRef } from "@/lib/media-refs";
import { useResolvedMediaSrc } from "@/hooks/useResolvedMediaSrc";

/** Stable public header paths (survive Vite hash changes across deploys). */
const STABLE_HEADERS: Record<PageHeaderId, string> = {
  about: "/images/headers/header-about.webp",
  services: "/images/headers/header-services.webp",
  contact: "/images/headers/header-contact.webp",
  blog: "/images/headers/header-blog.webp",
  application: "/images/headers/header-about.webp",
  advertising: "/images/headers/header-advertising.webp",
};

function pickHeaderCandidate(pageId: PageHeaderId, fallback: string): string {
  const stable = STABLE_HEADERS[pageId] || fallback;
  const fromCms = loadCmsStore().pageHeaders[pageId];
  if (!fromCms?.trim()) return stable;
  if (isMediaRef(fromCms)) return fromCms;
  if (isFragileGallerySrc(fromCms)) return stable;
  return fromCms;
}

export function usePageHeaderImage(pageId: PageHeaderId, fallback: string) {
  const site = useOptionalSiteContent();
  const stable = STABLE_HEADERS[pageId] || fallback;
  // Re-read when CMS bundle refreshes
  void site?.bundle?.fetchedAt;
  const candidate = pickHeaderCandidate(pageId, fallback);
  return useResolvedMediaSrc(candidate, stable);
}
