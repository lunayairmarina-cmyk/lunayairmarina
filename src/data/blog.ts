import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import yacht1 from "@/assets/yacht-1.jpg";
import aboutMarina from "@/assets/about-marina.jpg";
import type { Language } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";

export type Localized = { en: string; ar: string };

export type BlogInline =
  | { type: "text"; text: Localized }
  | { type: "keyword"; text: Localized; href: string };

export type BlogBlock =
  | { id: string; type: "paragraph"; spans: BlogInline[] }
  | { id: string; type: "heading"; level: 2 | 3; text: Localized }
  | { id: string; type: "image"; src: string; alt: Localized; caption?: Localized }
  | { id: string; type: "quote"; text: Localized };

export interface BlogPost {
  id: string;
  slug: string;
  title: Localized;
  excerpt: Localized;
  coverImage: string;
  coverAlt: Localized;
  author: Localized;
  publishedAt: string;
  updatedAt: string;
  status: "published" | "draft";
  seoTitle: Localized;
  seoDescription: Localized;
  focusKeyword: Localized;
  tags: Localized[];
  blocks: BlogBlock[];
}

export const BLOG_STORAGE_KEY = "lunayairmarina.blog.posts.v2";

export function tx(value: Localized | string | undefined, language: Language): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || value.ar || "";
}

function L(en: string, ar: string): Localized {
  return { en, ar };
}

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: "b1",
    slug: "yacht-management-red-sea-guide",
    title: L(
      "Complete Guide to Yacht Management in the Red Sea",
      "الدليل الشامل لإدارة اليخوت في البحر الأحمر",
    ),
    excerpt: L(
      "What yacht owners should expect from professional management across Jeddah, the Red Sea and the Arabian Gulf.",
      "ما الذي يتوقعه ملاك اليخوت من الإدارة الاحترافية في جدة والبحر الأحمر والخليج العربي.",
    ),
    coverImage: gallery2,
    coverAlt: L(
      "Aerial view of a marina with luxury yachts",
      "منظر جوي لمارينا مليء باليخوت الفاخرة",
    ),
    author: L("lunayairmarina Editorial", "فريق تحرير lunayairmarina"),
    publishedAt: "2026-06-12T09:00:00.000Z",
    updatedAt: "2026-07-20T11:00:00.000Z",
    status: "published",
    seoTitle: L(
      "Yacht Management in the Red Sea | lunayairmarina",
      "إدارة اليخوت في البحر الأحمر | lunayairmarina",
    ),
    seoDescription: L(
      "Learn how professional yacht management works in the Red Sea: maintenance, crew, compliance and owner reporting with lunayairmarina.",
      "تعرّف على إدارة اليخوت الاحترافية في البحر الأحمر: الصيانة والطواقم والامتثال والتقارير مع lunayairmarina.",
    ),
    focusKeyword: L("yacht management Red Sea", "إدارة اليخوت البحر الأحمر"),
    tags: [
      L("yacht management", "إدارة اليخوت"),
      L("Red Sea", "البحر الأحمر"),
      L("Jeddah", "جدة"),
    ],
    blocks: [
      {
        id: "b1-h1",
        type: "heading",
        level: 2,
        text: L(
          "Why Red Sea yacht management is different",
          "لماذا تختلف إدارة اليخوت في البحر الأحمر",
        ),
      },
      {
        id: "b1-p1",
        type: "paragraph",
        spans: [
          {
            type: "text",
            text: L(
              "Operating a private yacht between Jeddah and the Arabian Gulf requires more than a captain. Owners need structured ",
              "تشغيل يخت خاص بين جدة والخليج العربي يحتاج أكثر من قبطان. يحتاج الملاك إلى ",
            ),
          },
          {
            type: "keyword",
            text: L("yacht management", "إدارة يخوت"),
            href: "/services",
          },
          {
            type: "text",
            text: L(
              " covering technical supervision, crew payroll, berthing and transparent financial control.",
              " منظمة تغطي الإشراف الفني ورواتب الطاقم والرسو والرقابة المالية الشفافة.",
            ),
          },
        ],
      },
      {
        id: "b1-img1",
        type: "image",
        src: aboutMarina,
        alt: L(
          "Luxury yacht berthed at dusk in a marina",
          "يخت فاخر راسٍ عند الغروب في المارينا",
        ),
        caption: L(
          "Dedicated berthing and operations planning protect asset value.",
          "الرسو المخصص وتخطيط العمليات يحميان قيمة الأصول.",
        ),
      },
      {
        id: "b1-p2",
        type: "paragraph",
        spans: [
          { type: "text", text: L("At ", "في ") },
          { type: "keyword", text: L("lunayairmarina", "lunayairmarina"), href: "/about" },
          {
            type: "text",
            text: L(
              ", every vessel is assigned a dedicated manager, a documented maintenance programme and 24/7 marine response.",
              "، يُعيَّن لكل سفينة مدير مخصص وبرنامج صيانة موثّق واستجابة بحرية على مدار الساعة.",
            ),
          },
        ],
      },
      {
        id: "b1-h2",
        type: "heading",
        level: 2,
        text: L(
          "What Google-ready owners look for",
          "ما الذي يبحث عنه الملاك في المحتوى الاحترافي",
        ),
      },
      {
        id: "b1-p3",
        type: "paragraph",
        spans: [
          {
            type: "text",
            text: L(
              "Clear service pages, expert articles and internal links help owners discover trusted operators. Use focused keywords naturally, add descriptive image alt text, and keep publishing practical guides.",
              "صفحات الخدمات الواضحة والمقالات المتخصصة والروابط الداخلية تساعد الملاك على اكتشاف المشغّلين الموثوقين. استخدم الكلمات المفتاحية بشكل طبيعي، وأضف نصوصًا بديلة للصور، واستمر في نشر أدلة عملية.",
            ),
          },
        ],
      },
      {
        id: "b1-q1",
        type: "quote",
        text: L(
          "Discretion, precision and care are the standards that keep a yacht ready for every season.",
          "السرية والدقة والعناية هي المعايير التي تبقي اليخت جاهزًا لكل موسم.",
        ),
      },
    ],
  },
  {
    id: "b2",
    slug: "marina-operations-best-practices",
    title: L(
      "Marina Operations Best Practices for Visiting Yachts",
      "أفضل ممارسات عمليات المارينا لليخوت الزائرة",
    ),
    excerpt: L(
      "Agency support, berth allocation and concierge logistics for international yachts arriving in Saudi waters.",
      "دعم الوكالة وتخصيص المراسي ولوجستيات الكونسيرج لليخوت الدولية القادمة إلى المياه السعودية.",
    ),
    coverImage: yacht1,
    coverAlt: L(
      "White motor yacht cruising near marina docks",
      "يخت أبيض آلي يبحر قرب أرصفة المارينا",
    ),
    author: L("lunayairmarina Operations", "عمليات lunayairmarina"),
    publishedAt: "2026-05-03T10:30:00.000Z",
    updatedAt: "2026-05-03T10:30:00.000Z",
    status: "published",
    seoTitle: L(
      "Marina Operations for Visiting Yachts | lunayairmarina",
      "عمليات المارينا لليخوت الزائرة | lunayairmarina",
    ),
    seoDescription: L(
      "Best practices for visiting yacht agency services, marina berthing and logistics in Saudi Arabia with lunayairmarina.",
      "أفضل الممارسات لخدمات وكالة اليخوت الزائرة والرسو واللوجستيات في السعودية مع lunayairmarina.",
    ),
    focusKeyword: L("marina operations", "عمليات المارينا"),
    tags: [
      L("marina", "مارينا"),
      L("visiting yachts", "يخوت زائرة"),
      L("agency", "وكالة"),
    ],
    blocks: [
      {
        id: "b2-p1",
        type: "paragraph",
        spans: [
          {
            type: "text",
            text: L("Successful ", "تبدأ "),
          },
          {
            type: "keyword",
            text: L("marina operations", "عمليات المارينا"),
            href: "/services",
          },
          {
            type: "text",
            text: L(
              " start before the yacht arrives: permits, berth allocation, provisioning and crew coordination.",
              " الناجحة قبل وصول اليخت: التصاريح وتخصيص الرصيف والتموين وتنسيق الطاقم.",
            ),
          },
        ],
      },
      {
        id: "b2-img1",
        type: "image",
        src: gallery1,
        alt: L(
          "Jacuzzi sundeck overlooking open blue water",
          "جاكوزي على السطح المطل على المياه الزرقاء",
        ),
        caption: L(
          "Owner experience depends on seamless shore-side coordination.",
          "تجربة المالك تعتمد على تنسيق ساحلي سلس.",
        ),
      },
      {
        id: "b2-p2",
        type: "paragraph",
        spans: [
          {
            type: "text",
            text: L(
              "If you are planning a Red Sea season, speak with our team through the ",
              "إذا كنت تخطط لموسم في البحر الأحمر، تواصل مع فريقنا عبر ",
            ),
          },
          {
            type: "keyword",
            text: L("contact page", "صفحة التواصل"),
            href: "/contact",
          },
          {
            type: "text",
            text: L(" for a private consultation.", " للحصول على استشارة خاصة."),
          },
        ],
      },
    ],
  },
];

function asLocalized(value: unknown, fallback = ""): Localized {
  if (value && typeof value === "object" && "en" in (value as object)) {
    const loc = value as Localized;
    return { en: loc.en || fallback, ar: loc.ar || loc.en || fallback };
  }
  if (typeof value === "string") return { en: value, ar: value };
  return { en: fallback, ar: fallback };
}

function normalizeInline(span: unknown): BlogInline {
  const raw = span as { type?: string; text?: unknown; href?: string };
  if (raw?.type === "keyword") {
    return { type: "keyword", text: asLocalized(raw.text), href: raw.href || "/services" };
  }
  return { type: "text", text: asLocalized(raw?.text) };
}

function normalizeBlock(block: unknown): BlogBlock | null {
  const raw = block as BlogBlock & { text?: unknown; alt?: unknown; caption?: unknown; spans?: unknown[] };
  if (!raw?.id || !raw?.type) return null;
  if (raw.type === "paragraph") {
    return {
      id: raw.id,
      type: "paragraph",
      spans: Array.isArray(raw.spans) ? raw.spans.map(normalizeInline) : [],
    };
  }
  if (raw.type === "heading") {
    return {
      id: raw.id,
      type: "heading",
      level: raw.level === 3 ? 3 : 2,
      text: asLocalized(raw.text),
    };
  }
  if (raw.type === "image") {
    return {
      id: raw.id,
      type: "image",
      src: typeof raw.src === "string" ? raw.src : gallery1,
      alt: asLocalized(raw.alt),
      caption: raw.caption ? asLocalized(raw.caption) : undefined,
    };
  }
  if (raw.type === "quote") {
    return { id: raw.id, type: "quote", text: asLocalized(raw.text) };
  }
  return null;
}

export function normalizePost(raw: unknown): BlogPost | null {
  if (!raw || typeof raw !== "object") return null;
  const post = raw as Record<string, unknown>;
  if (typeof post.id !== "string" || typeof post.slug !== "string") return null;
  const blocks = Array.isArray(post.blocks)
    ? post.blocks.map(normalizeBlock).filter((b): b is BlogBlock => Boolean(b))
    : [];
  const tags = Array.isArray(post.tags)
    ? post.tags.map((tag) => asLocalized(tag))
    : [];
  return {
    id: post.id,
    slug: post.slug,
    title: asLocalized(post.title),
    excerpt: asLocalized(post.excerpt),
    coverImage: typeof post.coverImage === "string" ? post.coverImage : gallery1,
    coverAlt: asLocalized(post.coverAlt),
    author: asLocalized(post.author, "lunayairmarina"),
    publishedAt: typeof post.publishedAt === "string" ? post.publishedAt : new Date().toISOString(),
    updatedAt: typeof post.updatedAt === "string" ? post.updatedAt : new Date().toISOString(),
    status: post.status === "draft" ? "draft" : "published",
    seoTitle: asLocalized(post.seoTitle),
    seoDescription: asLocalized(post.seoDescription),
    focusKeyword: asLocalized(post.focusKeyword),
    tags,
    blocks,
  };
}

function readStoredPosts(): BlogPost[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BLOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return null;
    const posts = parsed.map(normalizePost).filter((p): p is BlogPost => Boolean(p));
    return posts.length ? posts : null;
  } catch {
    return null;
  }
}

export function loadBlogPosts(): BlogPost[] {
  const cmsPosts = loadCmsStore().blog;
  if (cmsPosts.length) {
    const normalized = cmsPosts
      .map((item) =>
        normalizePost({
          ...item,
          coverImage:
            typeof item.coverImage === "string" ? item.coverImage : item.image,
          publishedAt:
            typeof item.publishedAt === "string" ? item.publishedAt : item.date,
        }),
      )
      .filter((post): post is BlogPost => Boolean(post));
    if (normalized.length) return normalized;
  }
  return readStoredPosts() ?? DEFAULT_BLOG_POSTS;
}

export function saveBlogPosts(posts: BlogPost[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BLOG_STORAGE_KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event("lunayairmarina-blog-posts"));
}

export function getPublishedPosts(posts = loadBlogPosts()) {
  return posts
    .filter((post) => post.status === "published")
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
}

export function getPostBySlug(slug: string, posts = loadBlogPosts()) {
  return posts.find((post) => post.slug === slug) ?? null;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function absoluteUrl(path: string) {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return `https://lunayairmarina.com${path}`;
}

export function buildArticleJsonLd(post: BlogPost, language: Language = "en") {
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: tx(post.seoTitle, language) || tx(post.title, language),
    description: tx(post.seoDescription, language) || tx(post.excerpt, language),
    image: [post.coverImage],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      "@type": "Person",
      name: tx(post.author, language),
    },
    publisher: {
      "@type": "Organization",
      name: "lunayairmarina",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/photo/lunayairmarina.png"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    keywords: [tx(post.focusKeyword, language), ...post.tags.map((tag) => tx(tag, language))]
      .filter(Boolean)
      .join(", "),
  };
}

export function buildBlogListJsonLd(posts: BlogPost[], language: Language = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "lunayairmarina Blog",
    description:
      language === "ar"
        ? "أدلة متخصصة في إدارة اليخوت وعمليات المارينا والإبحار في البحر الأحمر من lunayairmarina."
        : "Expert guides on yacht management, marina operations and Red Sea yachting from lunayairmarina.",
    url: absoluteUrl("/blog"),
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: tx(post.title, language),
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      description: tx(post.excerpt, language),
    })),
  };
}

export function newBlockId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
