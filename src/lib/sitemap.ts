import { SITE_ORIGIN } from "./site";

export type SitemapChangefreq =
  "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";

export interface SitemapEntry {
  path: string;
  priority: string;
  changefreq: SitemapChangefreq;
  lastmod?: string;
}

/**
 * Static public site pages.
 * Add every new public route here — admin routes must never appear.
 */
export const PUBLIC_STATIC_PAGES: SitemapEntry[] = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/about", priority: "0.8", changefreq: "monthly" },
  { path: "/services", priority: "0.9", changefreq: "weekly" },
  { path: "/blog", priority: "0.75", changefreq: "weekly" },
  { path: "/contact", priority: "0.85", changefreq: "monthly" },
  { path: "/application", priority: "0.7", changefreq: "monthly" },
  { path: "/advertising", priority: "0.65", changefreq: "weekly" },
];

/** Keep in sync with SERVICE_SLUGS in src/data/services.ts */
export const PUBLIC_SERVICE_SLUGS = [
  "yacht-management-360",
  "visiting-yacht-agency",
  "marina-management",
  "crew-management",
] as const;

/** Keep in sync with DEFAULT_BLOG_POSTS slugs in src/data/blog.ts */
export const PUBLIC_BLOG_SLUGS = [
  "yacht-management-red-sea-guide",
  "marina-operations-best-practices",
] as const;

const ADMIN_PREFIX = "/admin";
const API_PREFIX = "/api";

export function isAdminPath(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === ADMIN_PREFIX || normalized.startsWith(`${ADMIN_PREFIX}/`);
}

export function isPrivatePath(path: string): boolean {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return (
    isAdminPath(normalized) || normalized === API_PREFIX || normalized.startsWith(`${API_PREFIX}/`)
  );
}

export function normalizePublicPath(path: string): string {
  if (!path || path === "/") return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

/** Merge static + services + blog (+ optional extra public pages), drop admin. */
export function listPublicSitemapEntries(
  extra: SitemapEntry[] = [],
  today = new Date().toISOString().slice(0, 10),
): SitemapEntry[] {
  const servicePages: SitemapEntry[] = PUBLIC_SERVICE_SLUGS.map((slug) => ({
    path: `/services/${slug}`,
    priority: "0.85",
    changefreq: "monthly" as const,
  }));

  const blogPages: SitemapEntry[] = PUBLIC_BLOG_SLUGS.map((slug) => ({
    path: `/blog/${slug}`,
    priority: "0.7",
    changefreq: "monthly" as const,
  }));

  const merged = [...PUBLIC_STATIC_PAGES, ...servicePages, ...blogPages, ...extra];
  const seen = new Set<string>();
  const entries: SitemapEntry[] = [];

  for (const entry of merged) {
    const path = normalizePublicPath(entry.path);
    if (isPrivatePath(path) || seen.has(path)) continue;
    seen.add(path);
    entries.push({
      ...entry,
      path,
      lastmod: entry.lastmod ?? today,
    });
  }

  return entries;
}

export function toAbsoluteSitemapUrl(path: string, origin = SITE_ORIGIN): string {
  const base = origin.replace(/\/$/, "");
  if (path === "/") return `${base}/`;
  return `${base}${normalizePublicPath(path)}`;
}

export function buildSitemapXml(
  entries = listPublicSitemapEntries(),
  origin = SITE_ORIGIN,
): string {
  const urls = entries
    .map((entry) => {
      const loc = toAbsoluteSitemapUrl(entry.path, origin);
      const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : "";
      return `  <url>
    <loc>${loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
