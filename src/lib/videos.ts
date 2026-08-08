import { absoluteUrl, SITE_ORIGIN } from "@/lib/site";

/**
 * Public videos Google (and others) may index/archive.
 * Keep paths under public/videos/ — never put admin-only media here.
 */
export type SiteVideo = {
  id: string;
  /** Page URL that embeds the video (landing page Google associates with it). */
  pagePath: string;
  /** Public MP4/WebM path or absolute URL. */
  contentPath: string;
  /** Poster / thumbnail path. */
  thumbnailPath: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  /** ISO 8601 duration, e.g. PT45S */
  duration?: string;
  uploadDate?: string;
};

export const SITE_VIDEOS: SiteVideo[] = [
  {
    id: "hero-lunayair",
    pagePath: "/",
    contentPath: "/videos/lunayair.mp4",
    thumbnailPath: "/images/hero/hero-main.webp",
    title: {
      en: "Lunayair Marina — Yacht Management Hero Film",
      ar: "لوناير مارينا — فيلم إدارة اليخوت",
    },
    description: {
      en: "Hero film showcasing Lunayair Marina yacht management, marina operations and Red Sea luxury yachting.",
      ar: "فيلم تعريفي يعرض إدارة اليخوت وتشغيل المارينا والإبحار الفاخر مع لوناير مارينا في البحر الأحمر.",
    },
    duration: "PT53S",
    uploadDate: "2025-01-01",
  },
];

export function buildVideoObjectSchema(video: SiteVideo, origin = SITE_ORIGIN) {
  const contentUrl = absoluteUrl(video.contentPath, origin);
  const thumbnailUrl = absoluteUrl(video.thumbnailPath, origin);
  const pageUrl = absoluteUrl(video.pagePath === "/" ? "/" : video.pagePath, origin);

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#video-${video.id}`,
    name: `${video.title.ar} | ${video.title.en}`,
    alternateName: video.title.en,
    description: `${video.description.ar} ${video.description.en}`,
    thumbnailUrl: [thumbnailUrl],
    contentUrl,
    embedUrl: pageUrl,
    url: pageUrl,
    uploadDate: video.uploadDate ?? "2025-01-01",
    ...(video.duration ? { duration: video.duration } : {}),
    encodingFormat: "video/mp4",
    width: 1920,
    height: 1080,
    inLanguage: ["ar", "en"],
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    keywords: [
      "yacht management",
      "إدارة يخوت",
      "Lunayair Marina",
      "Saudi Arabia",
      "Red Sea",
      "marina operations",
    ],
    publisher: {
      "@type": "Organization",
      name: "lunayairmarina",
      url: origin,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/og-image.png", origin),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };
}

export function buildSitemapIndexXml(origin = SITE_ORIGIN): string {
  const today = new Date().toISOString().slice(0, 10);
  const base = origin.replace(/\/$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${base}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${base}/sitemap-video.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;
}

export function buildVideoOgMeta(video: SiteVideo, origin = SITE_ORIGIN) {
  const contentUrl = absoluteUrl(video.contentPath, origin);
  const thumbnailUrl = absoluteUrl(video.thumbnailPath, origin);
  return [
    { property: "og:video", content: contentUrl },
    { property: "og:video:secure_url", content: contentUrl },
    { property: "og:video:type", content: "video/mp4" },
    { property: "og:video:width", content: "1920" },
    { property: "og:video:height", content: "1080" },
    { property: "og:image", content: thumbnailUrl },
  ];
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Google video sitemap — https://developers.google.com/search/docs/crawling-indexing/sitemaps/video-sitemaps */
export function buildVideoSitemapXml(videos = SITE_VIDEOS, origin = SITE_ORIGIN): string {
  const urls = videos
    .map((video) => {
      const pageUrl = absoluteUrl(video.pagePath === "/" ? "/" : video.pagePath, origin);
      const contentUrl = absoluteUrl(video.contentPath, origin);
      const thumbUrl = absoluteUrl(video.thumbnailPath, origin);
      const title = escapeXml(`${video.title.ar} | ${video.title.en}`);
      const description = escapeXml(`${video.description.ar} ${video.description.en}`);
      const durationTag = video.duration
        ? `\n      <video:duration>${isoDurationToSeconds(video.duration)}</video:duration>`
        : "";
      const uploadTag = video.uploadDate
        ? `\n      <video:publication_date>${video.uploadDate}</video:publication_date>`
        : "";

      return `  <url>
    <loc>${escapeXml(pageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumbUrl)}</video:thumbnail_loc>
      <video:title>${title}</video:title>
      <video:description>${description}</video:description>
      <video:content_loc>${escapeXml(contentUrl)}</video:content_loc>
      <video:player_loc allow_embed="yes">${escapeXml(pageUrl)}</video:player_loc>${durationTag}${uploadTag}
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
      <video:requires_subscription>no</video:requires_subscription>
    </video:video>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urls}
</urlset>
`;
}

/** Convert simple PT#S / PT#M#S durations to seconds for the video sitemap. */
function isoDurationToSeconds(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(iso.trim());
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}
