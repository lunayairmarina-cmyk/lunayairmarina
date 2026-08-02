import heroYacht from "@/assets/hero-yacht.jpg";
import aboutMarina from "@/assets/about-marina.jpg";
import yacht1 from "@/assets/yacht-1.jpg";
import yacht2 from "@/assets/yacht-2.jpg";
import yacht3 from "@/assets/yacht-3.jpg";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import logo from "@/assets/lunayairmarina.png";

const ASSET_BY_FILENAME: Record<string, string> = {
  "hero-yacht.jpg": heroYacht,
  "about-marina.jpg": aboutMarina,
  "yacht-1.jpg": yacht1,
  "yacht-2.jpg": yacht2,
  "yacht-3.jpg": yacht3,
  "gallery-1.jpg": gallery1,
  "gallery-2.jpg": gallery2,
  "gallery-3.jpg": gallery3,
  "gallery-4.jpg": gallery4,
  "lunayairmarina.png": logo,
};

/**
 * Normalize CMS/Firestore media URLs.
 * Fixes legacy `/src/assets/...` paths that break in the browser.
 */
export function resolvePublicMediaSrc(src: string | undefined | null, fallback = gallery1): string {
  if (!src || !src.trim()) return fallback;
  const value = src.trim();

  if (
    value.startsWith("data:") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  // Already a Vite-bundled asset URL
  if (value.startsWith("/assets/")) return value;

  // Public mirrored seed paths — keep as-is when present under /public
  if (value.startsWith("/images/") || value.startsWith("/videos/")) return value;

  const fileName = value.split(/[/\\]/).pop()?.split("?")[0]?.toLowerCase() ?? "";
  if (fileName && ASSET_BY_FILENAME[fileName]) {
    return ASSET_BY_FILENAME[fileName];
  }

  // Legacy absolute-ish source paths
  if (value.includes("/src/assets/") || value.startsWith("src/assets/")) {
    return ASSET_BY_FILENAME[fileName] ?? fallback;
  }

  return value;
}

export function isUsableBlogSlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  const trimmed = slug.trim();
  return trimmed.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(trimmed);
}
