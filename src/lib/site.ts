/**
 * Public site origin for canonical URLs, Open Graph, sitemap and robots.
 * Prefer VITE_SITE_URL in production; default is the live domain.
 */
export const SITE_ORIGIN = "https://www.lunayairmarina.com";

export function getSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return SITE_ORIGIN;
}

export const DEFAULT_OG_IMAGE_PATH = "/og-cover.jpg";
export const DEFAULT_LOGO_PATH = "/og-image.png";

export function absoluteUrl(pathOrUrl: string, site = getSiteUrl()): string {
  if (!pathOrUrl) return `${site}${DEFAULT_OG_IMAGE_PATH}`;
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:")
  ) {
    return pathOrUrl;
  }
  return `${site}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}
