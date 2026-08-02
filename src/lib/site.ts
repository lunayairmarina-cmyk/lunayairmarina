/**
 * Public site origin for canonical URLs and Open Graph images.
 * Set VITE_SITE_URL in Vercel to https://lunayairmarina.vercel.app (or your custom domain).
 */
export function getSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "https://lunayairmarina.vercel.app";
}

export const DEFAULT_OG_IMAGE_PATH = "/og-cover.jpg";
export const DEFAULT_LOGO_PATH = "/og-image.png";

export function absoluteUrl(pathOrUrl: string, site = getSiteUrl()): string {
  if (!pathOrUrl) return `${site}${DEFAULT_OG_IMAGE_PATH}`;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://") || pathOrUrl.startsWith("data:")) {
    return pathOrUrl;
  }
  return `${site}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
