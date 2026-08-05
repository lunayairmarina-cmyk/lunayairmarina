/**
 * Central media helpers + filename aliases for CMS/legacy paths.
 * Physical files live under src/assets/{brand,hero,about,headers,gallery,fleet,admin}/
 */
import heroMain from "@/assets/hero/hero-main.webp";
import aboutMarina from "@/assets/about/about-marina.webp";
import adminLoginBg from "@/assets/admin/admin-login-bg.jpg";
import fleet01 from "@/assets/fleet/fleet-01.jpg";
import fleet02 from "@/assets/fleet/fleet-02.jpg";
import fleet03 from "@/assets/fleet/fleet-03.jpg";
import gallery01 from "@/assets/gallery/gallery-01-marina.jpg";
import gallery02 from "@/assets/gallery/gallery-02-deck.jpg";
import gallery03 from "@/assets/gallery/gallery-03-lounge.jpg";
import gallery04 from "@/assets/gallery/gallery-04-sunset.jpg";
import headerAbout from "@/assets/headers/header-about.webp";
import headerBlog from "@/assets/headers/header-blog.webp";
import headerContact from "@/assets/headers/header-contact.webp";
import headerServices from "@/assets/headers/header-services.webp";
import logo from "@/assets/brand/logo.png";

/** New canonical filenames */
const ASSET_BY_FILENAME: Record<string, string> = {
  "hero-main.jpg": heroMain,
  "hero-main.webp": heroMain,
  "about-marina.jpg": aboutMarina,
  "about-marina.webp": aboutMarina,
  "fleet-01.jpg": fleet01,
  "fleet-02.jpg": fleet02,
  "fleet-03.jpg": fleet03,
  "gallery-01-marina.jpg": gallery01,
  "gallery-02-deck.jpg": gallery02,
  "gallery-03-lounge.jpg": gallery03,
  "gallery-04-sunset.jpg": gallery04,
  "logo.png": logo,

  // Legacy aliases (CMS / older Firestore paths)
  "hero-yacht.jpg": heroMain,
  "yacht-1.jpg": fleet01,
  "yacht-2.jpg": fleet02,
  "yacht-3.jpg": fleet03,
  "gallery-1.jpg": gallery01,
  "gallery-2.jpg": gallery02,
  "gallery-3.jpg": gallery03,
  "gallery-4.jpg": gallery04,
  "lunayairmarina.png": logo,
  "page-header-about.jpg": headerAbout,
  "page-header-blog.jpg": headerBlog,
  "page-header-contact.jpg": headerContact,
  "page-header-services.jpg": headerServices,
  "header-about.jpg": headerAbout,
  "header-blog.jpg": headerBlog,
  "header-contact.jpg": headerContact,
  "header-services.jpg": headerServices,
  "header-about.webp": headerAbout,
  "header-blog.webp": headerBlog,
  "header-contact.webp": headerContact,
  "header-services.webp": headerServices,
  "admin-bg.jpg": adminLoginBg,
  "admin-login-bg.jpg": adminLoginBg,
};

/**
 * Normalize CMS/Firestore media URLs.
 * Fixes legacy `/src/assets/...` paths that break in the browser.
 */
export function resolvePublicMediaSrc(src: string | undefined | null, fallback = gallery01): string {
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

  if (value.startsWith("/assets/")) return value;

  if (value.startsWith("/images/") || value.startsWith("/videos/")) {
    // Prefer WebP siblings for known optimized folders (hero/headers/about).
    if (
      value.startsWith("/images/hero/") ||
      value.startsWith("/images/headers/") ||
      value.startsWith("/images/about/")
    ) {
      return value.replace(/\.jpe?g(\?.*)?$/i, ".webp$1");
    }
    return value;
  }

  const fileName = value.split(/[/\\]/).pop()?.split("?")[0]?.toLowerCase() ?? "";
  if (fileName && ASSET_BY_FILENAME[fileName]) {
    return ASSET_BY_FILENAME[fileName];
  }

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
