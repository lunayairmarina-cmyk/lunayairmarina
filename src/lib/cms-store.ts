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
export const CMS_BROADCAST_CHANNEL = "lunayairmarina-cms-broadcast";

export type ManagedCollection =
  | "gallery"
  | "team"
  | "faq"
  | "testimonials"
  | "blog"
  | "services"
  | "fleet"
  | "messages";

function managedStorageKey(name: ManagedCollection) {
  return name === "gallery" ? "lunaya.cms.galleryManaged" : `lunaya.cms.${name}Managed`;
}

export function markCollectionManaged(name: ManagedCollection) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(managedStorageKey(name), "1");
  } catch {
    // ignore
  }
}

export function isCollectionManaged(name: ManagedCollection): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(managedStorageKey(name)) === "1";
  } catch {
    return false;
  }
}

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
    // Drop inline data URLs so localStorage does not blow the quota and wipe CMS state.
    gallery: store.gallery.map((item) => ({
      ...item,
      src: item.src.startsWith("data:") ? "" : item.src,
    })).filter((item) => Boolean(item.src)),
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded — still notify listeners with in-memory event payload.
  }
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

/**
 * Replace strings that were saved in the wrong language (e.g. English text
 * stored inside the Arabic CMS copy) with the correct locale value.
 */
export function repairWrongLanguageCopy(
  copy: Record<string, unknown> | null | undefined,
  correctLocale: Record<string, unknown>,
  wrongLocale: Record<string, unknown>,
): Record<string, unknown> {
  if (!copy) return { ...correctLocale };

  const walk = (node: unknown, correct: unknown, wrong: unknown): unknown => {
    if (typeof node === "string") {
      if (
        typeof wrong === "string" &&
        typeof correct === "string" &&
        node === wrong &&
        correct !== wrong
      ) {
        return correct;
      }
      // Latin-only CMS string while correct locale is Arabic → use locale.
      if (
        typeof correct === "string" &&
        /[\u0600-\u06FF]/.test(correct) &&
        !/[\u0600-\u06FF]/.test(node) &&
        /[A-Za-z]{3,}/.test(node)
      ) {
        return correct;
      }
      return node;
    }
    if (Array.isArray(node)) {
      if (!Array.isArray(correct)) return node;
      return node.map((item, index) =>
        walk(item, (correct as unknown[])[index], Array.isArray(wrong) ? wrong[index] : undefined),
      );
    }
    if (node && typeof node === "object") {
      const result: Record<string, unknown> = {};
      const correctObj =
        correct && typeof correct === "object" && !Array.isArray(correct)
          ? (correct as Record<string, unknown>)
          : {};
      const wrongObj =
        wrong && typeof wrong === "object" && !Array.isArray(wrong)
          ? (wrong as Record<string, unknown>)
          : {};
      const keys = new Set([
        ...Object.keys(node as Record<string, unknown>),
        ...Object.keys(correctObj),
      ]);
      for (const key of keys) {
        const value = (node as Record<string, unknown>)[key];
        if (value === undefined) {
          if (correctObj[key] !== undefined) result[key] = correctObj[key];
          continue;
        }
        result[key] = walk(value, correctObj[key], wrongObj[key]);
      }
      return result;
    }
    return node;
  };

  return walk(copy, correctLocale, wrongLocale) as Record<string, unknown>;
}

/** Keep only CMS overrides that differ from the bundled locale. */
export function diffCopyAgainstLocale(
  copy: Record<string, unknown>,
  locale: Record<string, unknown>,
): Record<string, unknown> {
  const walk = (node: unknown, base: unknown): unknown => {
    if (typeof node === "string") {
      return typeof base === "string" && node === base ? undefined : node;
    }
    if (Array.isArray(node)) {
      if (JSON.stringify(node) === JSON.stringify(base)) return undefined;
      return node;
    }
    if (node && typeof node === "object") {
      const result: Record<string, unknown> = {};
      const baseObj =
        base && typeof base === "object" && !Array.isArray(base)
          ? (base as Record<string, unknown>)
          : {};
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        const next = walk(value, baseObj[key]);
        if (next !== undefined) result[key] = next;
      }
      return Object.keys(result).length > 0 ? result : undefined;
    }
    return node === base ? undefined : node;
  };

  const diff = walk(copy, locale);
  return (diff && typeof diff === "object" ? diff : {}) as Record<string, unknown>;
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
