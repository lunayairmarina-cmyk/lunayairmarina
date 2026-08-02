import type {
  AboutContent,
  BlogContent,
  FaqContent,
  FleetItem,
  GalleryContent,
  HomepageContent,
  LocalizedString,
  ServiceContent,
  SiteSettings,
  TeamMember,
  TestimonialContent,
  TrustContent,
  WhyContent,
} from "@/types/content";

export const CMS_STORAGE_KEY = "lunayairmarina.cms.v1";
export const CMS_UPDATED_EVENT = "lunayairmarina-cms-updated";

export type SeoPageId = "home" | "about" | "services" | "contact" | "blog" | "application";

export type PageHeaderId = "about" | "services" | "contact" | "blog" | "application";

export interface SeoPageMeta {
  title: LocalizedString;
  description: LocalizedString;
  keywords?: LocalizedString;
  focusKeyword?: LocalizedString;
  ogImage?: string;
  ogType?: string;
  canonicalPath?: string;
  robots?: string;
}

export interface CmsMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  yachtType?: string;
  yachtLength?: string;
  yachtLocation?: string;
  serviceNeeded?: string;
  date: string;
  status: "new" | "read";
  source?: "contact-form" | "admin";
}

export type FirebaseSyncStatus = "local" | "synced" | "error" | "unknown";

export interface CmsStore {
  copy: { en: Record<string, unknown>; ar: Record<string, unknown> } | null;
  settings: SiteSettings | null;
  homepage: HomepageContent | null;
  about: AboutContent | null;
  why: WhyContent | null;
  trust: TrustContent | null;
  services: ServiceContent[];
  gallery: GalleryContent[];
  testimonials: TestimonialContent[];
  faq: FaqContent[];
  blog: BlogContent[];
  team: TeamMember[];
  fleet: FleetItem[];
  seo: Partial<Record<SeoPageId, SeoPageMeta>>;
  /** Per-service SEO keyed by slug, e.g. yacht-management-360 */
  serviceSeo: Partial<Record<string, SeoPageMeta>>;
  /** Page header/cover images for public routes */
  pageHeaders: Partial<Record<PageHeaderId, string>>;
  messages: CmsMessage[];
  logoUrl?: string;
  firebaseSync: FirebaseSyncStatus;
  updatedAt: string;
}

export function emptyCmsStore(): CmsStore {
  return {
    copy: null,
    settings: null,
    homepage: null,
    about: null,
    why: null,
    trust: null,
    services: [],
    gallery: [],
    testimonials: [],
    faq: [],
    blog: [],
    team: [],
    fleet: [],
    seo: {},
    serviceSeo: {},
    pageHeaders: {},
    messages: [],
    firebaseSync: "unknown",
    updatedAt: new Date(0).toISOString(),
  };
}

export function loadCmsStore(): CmsStore {
  if (typeof window === "undefined") return emptyCmsStore();
  try {
    const raw = window.localStorage.getItem(CMS_STORAGE_KEY);
    if (!raw) return emptyCmsStore();
    const parsed = JSON.parse(raw) as Partial<CmsStore>;
    return {
      ...emptyCmsStore(),
      ...parsed,
      services: parsed.services ?? [],
      gallery: parsed.gallery ?? [],
      testimonials: parsed.testimonials ?? [],
      faq: parsed.faq ?? [],
      blog: parsed.blog ?? [],
      team: parsed.team ?? [],
      fleet: parsed.fleet ?? [],
      seo: parsed.seo ?? {},
      serviceSeo: parsed.serviceSeo ?? {},
      pageHeaders: parsed.pageHeaders ?? {},
      messages: parsed.messages ?? [],
    };
  } catch {
    return emptyCmsStore();
  }
}

export function saveCmsStore(store: CmsStore) {
  if (typeof window === "undefined") return;
  const next: CmsStore = {
    ...store,
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT, { detail: next }));
}

export function patchCmsStore(patch: Partial<CmsStore>): CmsStore {
  const current = loadCmsStore();
  const next = { ...current, ...patch };
  saveCmsStore(next);
  return next;
}

export function deepMergeCopy(
  base: Record<string, unknown> | null | undefined,
  overlay: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!base && !overlay) return {};
  if (!base) return { ...(overlay ?? {}) };
  if (!overlay) return { ...base };

  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const existing = result[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      existing &&
      typeof existing === "object" &&
      !Array.isArray(existing)
    ) {
      result[key] = deepMergeCopy(
        existing as Record<string, unknown>,
        value as Record<string, unknown>,
      );
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function setCopyPath(
  copy: { en: Record<string, unknown>; ar: Record<string, unknown> },
  language: "en" | "ar",
  path: string,
  value: unknown,
) {
  const parts = path.split(".");
  const root = structuredClone(copy[language] ?? {}) as Record<string, unknown>;
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]!;
    const next = cursor[part];
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      cursor[part] = {};
    }
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
  return { ...copy, [language]: root };
}

export function getCopyPath(dict: Record<string, unknown> | null | undefined, path: string): unknown {
  if (!dict) return undefined;
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
}
