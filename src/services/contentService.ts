import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { deepMergeCopy, emptyCmsStore, loadCmsStore, saveCmsStore } from "@/lib/cms-store";
import type {
  AboutContent,
  BlogContent,
  FaqContent,
  FleetItem,
  GalleryContent,
  HomepageContent,
  LocationContent,
  ServiceContent,
  SiteBundle,
  SiteSettings,
  TeamMember,
  TestimonialContent,
  TrustContent,
  WhyContent,
} from "@/types/content";

const CACHE_KEY = "lunayairmarina.content.bundle.v1";
const CACHE_TTL_MS = 1000 * 60 * 10;

let memoryCache: SiteBundle | null = null;
let inflight: Promise<SiteBundle> | null = null;

function readSessionCache(): SiteBundle | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteBundle;
    if (!parsed?.fetchedAt) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(bundle: SiteBundle) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
  } catch {
    // Ignore quota / private mode failures.
  }
}

async function getSingleton<T>(path: string, id: string): Promise<(T & { id: string }) | null> {
  const snap = await getDoc(doc(getDb(), path, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as T) };
}

async function getCollectionOrdered<T>(name: string, orderField = "order"): Promise<T[]> {
  try {
    const q = query(collection(getDb(), name), orderBy(orderField, "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);
  } catch {
    const snap = await getDocs(collection(getDb(), name));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as object) }) as T);
  }
}

function stripId<T extends object>(value: T & { id?: string }): T {
  const { id: _id, ...rest } = value as T & { id?: string };
  return rest as T;
}

function emptyBundle(): SiteBundle {
  return {
    settings: null,
    homepage: null,
    about: null,
    why: null,
    trust: null,
    services: [],
    fleet: [],
    team: [],
    testimonials: [],
    locations: [],
    blog: [],
    gallery: [],
    faq: [],
    copy: null,
    fetchedAt: Date.now(),
  };
}

async function hydrateLocalCmsFromCloud() {
  try {
    const local = loadCmsStore();
    const isEmpty =
      !local.settings &&
      !local.homepage &&
      !local.copy &&
      local.services.length === 0 &&
      local.blog.length === 0 &&
      local.gallery.length === 0;
    if (!isEmpty) return;

    const snap = await getDoc(doc(getDb(), "cms", "v1"));
    if (!snap.exists()) return;
    const remote = snap.data() as Partial<ReturnType<typeof loadCmsStore>>;
    saveCmsStore({
      ...emptyCmsStore(),
      ...remote,
      services: remote.services ?? [],
      gallery: remote.gallery ?? [],
      testimonials: remote.testimonials ?? [],
      faq: remote.faq ?? [],
      blog: remote.blog ?? [],
      team: remote.team ?? [],
      fleet: remote.fleet ?? [],
      messages: remote.messages ?? [],
      seo: remote.seo ?? {},
      serviceSeo: remote.serviceSeo ?? {},
      pageHeaders: remote.pageHeaders ?? {},
      firebaseSync: "synced",
      updatedAt: remote.updatedAt || new Date().toISOString(),
    });
  } catch {
    // Ignore hydrate failures.
  }
}

function bundleFromCmsMirror(remote: Partial<ReturnType<typeof loadCmsStore>>): SiteBundle {
  return {
    settings: remote.settings ?? null,
    homepage: remote.homepage ?? null,
    about: remote.about ?? null,
    why: remote.why ?? null,
    trust: remote.trust ?? null,
    services: remote.services ?? [],
    fleet: remote.fleet ?? [],
    team: remote.team ?? [],
    testimonials: remote.testimonials ?? [],
    locations: [],
    blog: [...(remote.blog ?? [])].sort((a, b) => String(b.date).localeCompare(String(a.date))),
    gallery: remote.gallery ?? [],
    faq: remote.faq ?? [],
    copy: remote.copy ?? null,
    fetchedAt: Date.now(),
  };
}

async function fetchBundleFromFirebase(): Promise<SiteBundle> {
  await hydrateLocalCmsFromCloud();
  try {
    const [
      settings,
      homepage,
      about,
      why,
      trust,
      services,
      fleet,
      team,
      testimonials,
      locations,
      blog,
      gallery,
      faq,
      copyEn,
      copyAr,
      cmsMirror,
    ] = await Promise.all([
      getSingleton<SiteSettings>("settings", "general"),
      getSingleton<HomepageContent>("homepage", "main"),
      getSingleton<AboutContent>("about", "main"),
      getSingleton<WhyContent>("why", "main"),
      getSingleton<TrustContent>("trust", "main"),
      getCollectionOrdered<ServiceContent>("services"),
      getCollectionOrdered<FleetItem>("fleet"),
      getCollectionOrdered<TeamMember>("team"),
      getCollectionOrdered<TestimonialContent>("testimonials"),
      getCollectionOrdered<LocationContent>("locations"),
      getCollectionOrdered<BlogContent>("blog", "date"),
      getCollectionOrdered<GalleryContent>("gallery"),
      getCollectionOrdered<FaqContent>("faq"),
      getDoc(doc(getDb(), "copy", "en")),
      getDoc(doc(getDb(), "copy", "ar")),
      getDoc(doc(getDb(), "cms", "v1")),
    ]);

    const copy =
      copyEn.exists() || copyAr.exists()
        ? {
            en: (copyEn.data() as Record<string, unknown>) ?? {},
            ar: (copyAr.data() as Record<string, unknown>) ?? {},
          }
        : null;

    const fromCollections: SiteBundle = {
      settings: settings ? stripId(settings) : null,
      homepage: homepage ? stripId(homepage) : null,
      about: about ? stripId(about) : null,
      why: why ? stripId(why) : null,
      trust: trust ? stripId(trust) : null,
      services,
      fleet,
      team,
      testimonials,
      locations,
      blog: blog.sort((a, b) => String(b.date).localeCompare(String(a.date))),
      gallery,
      faq,
      copy,
      fetchedAt: Date.now(),
    };

    // If individual collections are empty, fall back to cms/v1 mirror.
    const collectionsEmpty =
      !fromCollections.settings &&
      !fromCollections.homepage &&
      fromCollections.services.length === 0 &&
      fromCollections.blog.length === 0 &&
      fromCollections.gallery.length === 0;

    if (collectionsEmpty && cmsMirror.exists()) {
      const mirrored = bundleFromCmsMirror(cmsMirror.data() as Partial<ReturnType<typeof loadCmsStore>>);
      return {
        ...mirrored,
        copy: mirrored.copy ?? fromCollections.copy,
        locations: fromCollections.locations,
        fetchedAt: Date.now(),
      };
    }

    return fromCollections;
  } catch {
    return emptyBundle();
  }
}

/** CMS local store wins over Firebase (Super Admin edits). */
function mergeCmsOverFirebase(remote: SiteBundle): SiteBundle {
  const cms = loadCmsStore();
  const copy =
    cms.copy || remote.copy
      ? {
          en: deepMergeCopy(remote.copy?.en, cms.copy?.en),
          ar: deepMergeCopy(remote.copy?.ar, cms.copy?.ar),
        }
      : null;

  return {
    settings: cms.settings ?? remote.settings,
    homepage: cms.homepage ?? remote.homepage,
    about: cms.about ?? remote.about,
    why: cms.why ?? remote.why,
    trust: cms.trust ?? remote.trust,
    services: cms.services.length > 0 ? cms.services : remote.services,
    fleet: cms.fleet.length > 0 ? cms.fleet : remote.fleet,
    team: cms.team.length > 0 ? cms.team : remote.team,
    testimonials: cms.testimonials.length > 0 ? cms.testimonials : remote.testimonials,
    locations: remote.locations,
    blog: cms.blog.length > 0 ? cms.blog : remote.blog,
    gallery: cms.gallery.length > 0 ? cms.gallery : remote.gallery,
    faq: cms.faq.length > 0 ? cms.faq : remote.faq,
    copy,
    fetchedAt: Date.now(),
  };
}

export async function getSiteContent(options?: {
  force?: boolean;
}): Promise<SiteBundle> {
  if (!options?.force) {
    if (memoryCache) return memoryCache;
    const session = readSessionCache();
    if (session) {
      memoryCache = session;
      return session;
    }
    if (inflight) return inflight;
  }

  inflight = fetchBundleFromFirebase()
    .then((bundle) => {
      const merged = mergeCmsOverFirebase(bundle);
      memoryCache = merged;
      writeSessionCache(merged);
      return merged;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function clearContentCache() {
  memoryCache = null;
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(CACHE_KEY);
  }
}

export function getCachedSiteContent(): SiteBundle | null {
  return memoryCache ?? readSessionCache();
}
