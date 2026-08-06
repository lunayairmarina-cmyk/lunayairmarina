import { galleryImages } from "@/data/mock";
import { resolvePublicMediaSrc } from "@/lib/media";
import { isMediaRef, resolveMediaSrcSync } from "@/lib/media-refs";

/** Stable public paths for curated gallery ids (survive Vite hash changes). */
const CURATED_STABLE_SRC: Record<string, string> = {
  g1: "/images/gallery/gallery-01-marina.webp",
  g2: "/images/gallery/gallery-03-lounge.webp",
  g3: "/images/gallery/gallery-02-deck.webp",
  g4: "/images/gallery/gallery-08-bridge.webp",
  g5: "/images/hero/hero-main.webp",
  g6: "/images/gallery/gallery-05-arrival.webp",
  g7: "/images/gallery/gallery-06-crew.webp",
  g8: "/images/gallery/gallery-04-sunset.webp",
  g9: "/images/gallery/gallery-07-harbor.webp",
};

function isUploadSrc(src: string): boolean {
  return (
    isMediaRef(src) ||
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    /^https?:\/\//i.test(src)
  );
}

/** Stale Vite build URLs or other non-public paths that often break after deploy. */
export function isFragileGallerySrc(src: string | undefined | null): boolean {
  if (!src) return true;
  if (isMediaRef(src)) return false;
  if (src.startsWith("data:") || src.startsWith("blob:")) return false;
  if (src.startsWith("/images/") || src.startsWith("/videos/")) return false;
  if (/^https?:\/\//i.test(src)) return /\/assets\//i.test(src);
  return src.startsWith("/assets/") || src.includes("/src/assets/");
}

/**
 * Display URL for a gallery item.
 * Uploads (media:/data:/http) win; curated ids fall back to bundled/stable assets
 * so Firestore entries with old Vite `/assets/...-hash` URLs still show.
 */
export function pickGallerySrc(remoteSrc: string, itemId?: string): string {
  if (isMediaRef(remoteSrc) || remoteSrc.startsWith("data:")) {
    return resolveMediaSrcSync(remoteSrc, "");
  }
  if (itemId) {
    const stable = CURATED_STABLE_SRC[itemId];
    const local = galleryImages.find((g) => g.id === itemId);
    if (isFragileGallerySrc(remoteSrc)) {
      return local?.src ?? stable ?? resolvePublicMediaSrc(remoteSrc);
    }
    if (local?.src && !isUploadSrc(remoteSrc)) {
      return local.src;
    }
  }
  return resolvePublicMediaSrc(remoteSrc);
}

/** Normalize stored gallery src before save (prefer stable public paths for curated ids). */
export function healGallerySrc(id: string, src: string): string {
  if (isUploadSrc(src) && !isFragileGallerySrc(src)) return src;
  if (isMediaRef(src) || src.startsWith("data:") || src.startsWith("blob:")) return src;
  const stable = CURATED_STABLE_SRC[id];
  if (stable && (isFragileGallerySrc(src) || !src.startsWith("/images/"))) {
    return stable;
  }
  return src;
}
