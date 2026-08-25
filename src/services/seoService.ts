import { doc, getDoc } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  loadCmsStore,
  type SeoPageId,
  type SeoPageMeta,
} from "@/lib/cms-store";
import type { LocalizedString } from "@/types/content";
import { SERVICE_SLUGS, type ServiceSlug } from "@/data/services";
import {
  absoluteUrl,
  DEFAULT_LOGO_PATH,
  DEFAULT_OG_IMAGE_PATH,
  getSiteUrl,
} from "@/lib/site";

const DEFAULT_SEO: Record<SeoPageId, SeoPageMeta> = {
  home: {
    title: {
      en: "lunayairmarina | Yacht Management Saudi Arabia & Gulf",
      ar: "lunayairmarina | إدارة يخوت احترافية في السعودية والخليج",
    },
    description: {
      en: "Professional 360° yacht management, marina ops, visiting yacht agency and crew for owners in Jeddah, the Red Sea and the Gulf.",
      ar: "إدارة يخوت ٣٦٠ درجة، تشغيل مارينا، وكالة اليخوت الزائرة وخدمات الطواقم لملاك اليخوت في جدة والبحر الأحمر والخليج.",
    },
    keywords: {
      en: "yacht management Saudi Arabia, lunayairmarina, boat management Jeddah, Red Sea yacht management, marina management",
      ar: "إدارة يخوت السعودية, lunayairmarina, إدارة قوارب جدة, إدارة يخوت البحر الأحمر, إدارة مارينا, وكالة يخوت",
    },
    focusKeyword: { en: "yacht management Saudi Arabia", ar: "إدارة يخوت السعودية" },
    canonicalPath: "/",
    robots: "index,follow",
    ogType: "website",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
  about: {
    title: {
      en: "About lunayairmarina | Yacht Management Expertise",
      ar: "من نحن | خبرة إدارة اليخوت — lunayairmarina",
    },
    description: {
      en: "Learn about lunayairmarina — yacht management built for Gulf owners from Jeddah.",
      ar: "تعرّف على lunayairmarina — إدارة يخوت مصممة لملاك الخليج من جدة.",
    },
    keywords: {
      en: "about lunayairmarina, yacht management company Jeddah",
      ar: "عن lunayairmarina, شركة إدارة يخوت جدة",
    },
    focusKeyword: { en: "yacht management company", ar: "شركة إدارة يخوت" },
    canonicalPath: "/about",
    robots: "index,follow",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
  services: {
    title: {
      en: "Yacht Management Services | lunayairmarina",
      ar: "خدمات إدارة اليخوت | lunayairmarina",
    },
    description: {
      en: "360° yacht management, visiting yacht agency, marina operations and crew services.",
      ar: "إدارة يخوت ٣٦٠، وكالة اليخوت الزائرة، تشغيل المارينا وخدمات الطواقم.",
    },
    keywords: {
      en: "yacht management services, visiting yacht agency Saudi Arabia, marina management",
      ar: "خدمات إدارة يخوت, وكالة يخوت زائرة السعودية, إدارة مارينا",
    },
    focusKeyword: { en: "yacht management services", ar: "خدمات إدارة اليخوت" },
    canonicalPath: "/services",
    robots: "index,follow",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
  contact: {
    title: {
      en: "Contact lunayairmarina — Yacht Management Consultation Jeddah",
      ar: "تواصل مع lunayairmarina — استشارة إدارة يخوت في جدة",
    },
    description: {
      en: "Request a private yacht management consultation in Jeddah.",
      ar: "اطلب استشارة خاصة لإدارة اليخوت في جدة.",
    },
    keywords: {
      en: "yacht management consultation Jeddah, contact lunayairmarina",
      ar: "استشارة إدارة يخوت جدة, تواصل lunayairmarina",
    },
    focusKeyword: { en: "yacht management consultation", ar: "استشارة إدارة يخوت" },
    canonicalPath: "/contact",
    robots: "index,follow",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
  blog: {
    title: {
      en: "Yacht Management Insights | lunayairmarina Blog",
      ar: "رؤى إدارة اليخوت | مدونة lunayairmarina",
    },
    description: {
      en: "Guides and insights on yacht management across the Red Sea and Arabian Gulf.",
      ar: "أدلة ورؤى حول إدارة اليخوت في البحر الأحمر والخليج العربي.",
    },
    keywords: {
      en: "yacht management blog, Red Sea yachting guides",
      ar: "مدونة إدارة يخوت, أدلة يخوت البحر الأحمر",
    },
    focusKeyword: { en: "yacht management blog", ar: "مدونة إدارة اليخوت" },
    canonicalPath: "/blog",
    robots: "index,follow",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
  application: {
    title: {
      en: "lunayairmarina App | Yacht Owner Concierge",
      ar: "تطبيق lunayairmarina | كونسيرج لملاك اليخوت",
    },
    description: {
      en: "Discover the lunayairmarina owner application for operations clarity.",
      ar: "اكتشف تطبيق lunayairmarina للملاك لوضوح العمليات.",
    },
    keywords: {
      en: "yacht owner app, yacht management application",
      ar: "تطبيق ملاك اليخوت, تطبيق إدارة يخوت",
    },
    focusKeyword: { en: "yacht owner app", ar: "تطبيق ملاك اليخوت" },
    canonicalPath: "/application",
    robots: "index,follow",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
  advertising: {
    title: {
      en: "Advertising | lunayairmarina",
      ar: "الإعلانات | lunayairmarina",
    },
    description: {
      en: "Temporary company advertising featured with lunayairmarina — premium brands aligned with yacht management excellence.",
      ar: "مساحة إعلانات الشركات المؤقتة مع lunayairmarina — علامات فاخرة متوافقة مع تميز إدارة اليخوت.",
    },
    keywords: {
      en: "lunayairmarina advertising, yacht advertising, marina advertising",
      ar: "إعلانات lunayairmarina, إعلانات اليخوت, إعلانات المارينا",
    },
    focusKeyword: { en: "advertising", ar: "الإعلانات" },
    canonicalPath: "/advertising",
    robots: "index,follow",
    ogImage: DEFAULT_OG_IMAGE_PATH,
  },
};

const DEFAULT_SERVICE_SEO: Record<ServiceSlug, SeoPageMeta> = {
  "yacht-management-360": {
    title: {
      en: "360° Yacht Management Saudi Arabia | lunayairmarina",
      ar: "إدارة يخوت ٣٦٠ درجة | lunayairmarina",
    },
    description: {
      en: "Complete yacht and boat management covering operations, maintenance, compliance and financial reporting for Gulf owners.",
      ar: "إدارة متكاملة لليخوت تشمل التشغيل والصيانة والامتثال والتقارير المالية لملاك الخليج.",
    },
    keywords: {
      en: "360 yacht management, full yacht management Saudi Arabia",
      ar: "إدارة يخوت ٣٦٠, إدارة يخوت كاملة السعودية",
    },
    focusKeyword: { en: "360 yacht management", ar: "إدارة يخوت ٣٦٠" },
    canonicalPath: "/services/yacht-management-360",
    robots: "index,follow",
  },
  "visiting-yacht-agency": {
    title: {
      en: "Visiting Yacht Agency Saudi Arabia | lunayairmarina",
      ar: "وكالة اليخوت الزائرة السعودية | lunayairmarina",
    },
    description: {
      en: "Agency services for international yachts arriving in Saudi waters — permits, berths, provisioning and logistics.",
      ar: "خدمات وكالة لليخوت الدولية القادمة للمياه السعودية — تصاريح ورسو وتموين ولوجستيات.",
    },
    keywords: {
      en: "visiting yacht agency Saudi Arabia, yacht clearance Jeddah",
      ar: "وكالة يخوت زائرة السعودية, تخليص يخوت جدة",
    },
    focusKeyword: { en: "visiting yacht agency", ar: "وكالة اليخوت الزائرة" },
    canonicalPath: "/services/visiting-yacht-agency",
    robots: "index,follow",
  },
  "marina-management": {
    title: {
      en: "Marina Management Services | lunayairmarina",
      ar: "خدمات إدارة المارينا | lunayairmarina",
    },
    description: {
      en: "World-class marina and yacht-club operations for safe luxury berthing across the Red Sea and Gulf.",
      ar: "تشغيل مارينا ونوادي يخوت بمعايير عالمية لرسو فاخر وآمن في البحر الأحمر والخليج.",
    },
    keywords: {
      en: "marina management Saudi Arabia, yacht club operations",
      ar: "إدارة مارينا السعودية, تشغيل نادي يخوت",
    },
    focusKeyword: { en: "marina management", ar: "إدارة المارينا" },
    canonicalPath: "/services/marina-management",
    robots: "index,follow",
  },
  "crew-management": {
    title: {
      en: "Yacht Crew Management & Recruitment | lunayairmarina",
      ar: "إدارة وتوظيف طواقم اليخوت | lunayairmarina",
    },
    description: {
      en: "Vetted crew recruitment, contracts, payroll and training matched to luxury yacht service standards.",
      ar: "توظيف طواقم معتمدة وعقود ورواتب وتدريب وفق معايير اليخوت الفاخرة.",
    },
    keywords: {
      en: "yacht crew management, yacht crew recruitment Saudi Arabia",
      ar: "إدارة طواقم اليخوت, توظيف طواقم يخوت السعودية",
    },
    focusKeyword: { en: "yacht crew management", ar: "إدارة طواقم اليخوت" },
    canonicalPath: "/services/crew-management",
    robots: "index,follow",
  },
};

function pickLocalized(value: LocalizedString | undefined, language: "en" | "ar") {
  if (!value) return "";
  return value[language] || value.en || value.ar || "";
}

export function getSeoFromCms(pageId: SeoPageId): SeoPageMeta {
  const store = loadCmsStore();
  return { ...DEFAULT_SEO[pageId], ...(store.seo[pageId] ?? {}) };
}

export function getServiceSeoFromCms(slug: string): SeoPageMeta {
  const store = loadCmsStore();
  const fallback =
    DEFAULT_SERVICE_SEO[slug as ServiceSlug] ??
    ({
      title: { en: "Yacht Management Service | lunayairmarina", ar: "خدمة إدارة يخوت | lunayairmarina" },
      description: {
        en: "Premium yacht management service by lunayairmarina.",
        ar: "خدمة إدارة يخوت مميزة من lunayairmarina.",
      },
      canonicalPath: `/services/${slug}`,
      robots: "index,follow",
    } satisfies SeoPageMeta);
  return { ...fallback, ...(store.serviceSeo[slug] ?? {}) };
}

export function pickSeo(
  meta: SeoPageMeta,
  language: "en" | "ar" = "en",
): {
  title: string;
  description: string;
  keywords?: string;
  focusKeyword?: string;
  ogImage?: string;
  ogType?: string;
  robots?: string;
  canonicalPath?: string;
} {
  return {
    title: pickLocalized(meta.title, language),
    description: pickLocalized(meta.description, language),
    keywords: pickLocalized(meta.keywords, language) || undefined,
    focusKeyword: pickLocalized(meta.focusKeyword, language) || undefined,
    ogImage: meta.ogImage,
    ogType: meta.ogType || "website",
    robots: meta.robots || "index,follow",
    canonicalPath: meta.canonicalPath,
  };
}

export type SeoScore = {
  score: number;
  checks: Array<{
    id: "titleLen" | "descLen" | "focusTitle" | "focusDesc" | "keywords" | "og" | "canonical";
    ok: boolean;
    current?: number;
  }>;
};

export function scoreSeo(meta: SeoPageMeta, language: "en" | "ar" = "en"): SeoScore {
  const title = pickLocalized(meta.title, language);
  const description = pickLocalized(meta.description, language);
  const keywords = pickLocalized(meta.keywords, language);
  const focus = pickLocalized(meta.focusKeyword, language).toLowerCase();
  const titleOk = title.length >= 30 && title.length <= 60;
  const descOk = description.length >= 120 && description.length <= 160;
  const focusInTitle = focus ? title.toLowerCase().includes(focus) : false;
  const focusInDesc = focus ? description.toLowerCase().includes(focus) : false;
  const hasKeywords = keywords.split(",").map((k) => k.trim()).filter(Boolean).length >= 2;
  const hasOg = Boolean(meta.ogImage);
  const hasCanonical = Boolean(meta.canonicalPath);
  const checks: SeoScore["checks"] = [
    { id: "titleLen", ok: titleOk, current: title.length },
    { id: "descLen", ok: descOk, current: description.length },
    { id: "focusTitle", ok: !focus || focusInTitle },
    { id: "focusDesc", ok: !focus || focusInDesc },
    { id: "keywords", ok: hasKeywords },
    { id: "og", ok: hasOg },
    { id: "canonical", ok: hasCanonical },
  ];
  const passed = checks.filter((c) => c.ok).length;
  return { score: Math.round((passed / checks.length) * 100), checks };
}

export async function getSeoForPage(
  pageId: SeoPageId,
  language: "en" | "ar" = "en",
) {
  const local = getSeoFromCms(pageId);
  try {
    const snap = await getDoc(doc(getDb(), "seo", pageId));
    if (snap.exists()) {
      return pickSeo({ ...local, ...(snap.data() as SeoPageMeta) }, language);
    }
  } catch {
    // Fall through.
  }
  return pickSeo(local, language);
}

export function buildSeoHeadFromMeta(
  meta: SeoPageMeta,
  fallbackPath: string,
  language: "en" | "ar" = "en",
) {
  const picked = pickSeo(meta, language);
  const titleAr = pickLocalized(meta.title, "ar");
  const titleEn = pickLocalized(meta.title, "en");
  const descAr = pickLocalized(meta.description, "ar");
  const descEn = pickLocalized(meta.description, "en");
  const keywordsAr = pickLocalized(meta.keywords, "ar");
  const keywordsEn = pickLocalized(meta.keywords, "en");

  // WhatsApp / social previews: bilingual title + description so Arabic shows too.
  const shareTitle =
    titleAr && titleEn && titleAr !== titleEn ? `${titleAr} | ${titleEn}` : picked.title;
  const shareDescription =
    descAr && descEn && descAr !== descEn ? `${descAr} — ${descEn}` : picked.description;
  const shareKeywords = [keywordsAr, keywordsEn].filter(Boolean).join(", ");

  const site = getSiteUrl();
  const path = picked.canonicalPath || fallbackPath;
  const url = path.startsWith("http")
    ? path
    : `${site}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImage = absoluteUrl(picked.ogImage || DEFAULT_OG_IMAGE_PATH, site);
  const logoUrl = absoluteUrl(DEFAULT_LOGO_PATH, site);

  return {
    meta: [
      { title: picked.title },
      { name: "description", content: shareDescription },
      ...(shareKeywords ? [{ name: "keywords", content: shareKeywords }] : []),
      { name: "robots", content: picked.robots || "index,follow" },
      { property: "og:site_name", content: "lunayairmarina" },
      { property: "og:locale", content: "ar_SA" },
      { property: "og:locale:alternate", content: "en_US" },
      { property: "og:title", content: shareTitle },
      { property: "og:description", content: shareDescription },
      { property: "og:type", content: picked.ogType || "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: ogImage },
      { property: "og:image:secure_url", content: ogImage },
      { property: "og:image:alt", content: "lunayairmarina — إدارة يخوت | Yacht Management" },
      { property: "og:image:type", content: ogImage.endsWith(".png") ? "image/png" : "image/jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: shareTitle },
      { name: "twitter:description", content: shareDescription },
      { name: "twitter:image", content: ogImage },
      { name: "twitter:image:alt", content: "lunayairmarina logo and yacht management" },
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "image_src", href: logoUrl },
    ],
  };
}

export function buildSeoHead(
  pageId: SeoPageId,
  path: string,
  language: "en" | "ar" = "en",
) {
  return buildSeoHeadFromMeta(getSeoFromCms(pageId), path, language);
}

export function buildServiceSeoHead(slug: string, language: "en" | "ar" = "en") {
  return buildSeoHeadFromMeta(getServiceSeoFromCms(slug), `/services/${slug}`, language);
}

export function listServiceSeoTargets() {
  return [...SERVICE_SLUGS];
}

export { DEFAULT_SEO, DEFAULT_SERVICE_SEO };
