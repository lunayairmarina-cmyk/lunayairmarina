import { collection, doc, getDocs, setDoc, writeBatch } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  CMS_UPDATED_EVENT,
  deepMergeCopy,
  loadCmsStore,
  patchCmsStore,
  type CmsMessage,
  type CmsStore,
  type FirebaseSyncStatus,
  type PageHeaderId,
  type SeoPageId,
  type SeoPageMeta,
} from "@/lib/cms-store";
import { clearContentCache } from "@/services/contentService";
import type {
  AboutContent,
  BlogContent,
  FaqContent,
  FleetItem,
  GalleryContent,
  HomepageContent,
  ServiceContent,
  SiteSettings,
  TeamMember,
  TestimonialContent,
  TrustContent,
  WhyContent,
} from "@/types/content";
import { companyInfo } from "@/data/mock";

export type SaveResult = { ok: true; sync: FirebaseSyncStatus } | { ok: false; error: string };

export function describeSaveResult(
  result: SaveResult,
  labels: { synced: string; local: string },
) {
  return result.ok && result.sync === "synced" ? labels.synced : labels.local;
}

function notifySiteReload() {
  clearContentCache();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CMS_UPDATED_EVENT));
  }
}

async function mirrorFullCmsStore() {
  const store = loadCmsStore();
  await setDoc(
    doc(getDb(), "cms", "v1"),
    {
      ...store,
      // Avoid oversized recursive nesting issues; store as plain object.
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}

async function tryFirebaseWrite(task: () => Promise<void>): Promise<FirebaseSyncStatus> {
  try {
    await task();
    try {
      await mirrorFullCmsStore();
    } catch {
      // Collection write succeeded; mirror is best-effort.
    }
    return "synced";
  } catch {
    return "local";
  }
}

export async function saveSettings(settings: SiteSettings, logoUrl?: string): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "settings", "general"), settings, { merge: true });
  });
  patchCmsStore({ settings, logoUrl: logoUrl ?? loadCmsStore().logoUrl, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveHomepage(homepage: HomepageContent): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "homepage", "main"), homepage, { merge: true });
  });
  patchCmsStore({ homepage, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveAbout(about: AboutContent): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "about", "main"), about, { merge: true });
  });
  patchCmsStore({ about, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveCopyBundle(copy: {
  en: Record<string, unknown>;
  ar: Record<string, unknown>;
}): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "copy", "en"), copy.en, { merge: true });
    await setDoc(doc(getDb(), "copy", "ar"), copy.ar, { merge: true });
  });
  patchCmsStore({ copy, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function patchCopySection(
  language: "en" | "ar",
  section: string,
  value: Record<string, unknown>,
): Promise<SaveResult> {
  const store = loadCmsStore();
  const en = store.copy?.en ?? {};
  const ar = store.copy?.ar ?? {};
  const next = {
    en: language === "en" ? deepMergeCopy(en, { [section]: value }) : en,
    ar: language === "ar" ? deepMergeCopy(ar, { [section]: value }) : ar,
  };
  return saveCopyBundle(next);
}

export async function saveWhy(why: WhyContent): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "why", "main"), why, { merge: true });
  });
  patchCmsStore({ why, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveTrust(trust: TrustContent): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "trust", "main"), trust, { merge: true });
  });
  patchCmsStore({ trust, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveTeam(team: TeamMember[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    team.forEach((member) => {
      const { id, ...data } = member;
      batch.set(doc(getDb(), "team", id), data, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ team, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveFleet(fleet: FleetItem[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    fleet.forEach((item) => {
      const { id, ...data } = item;
      batch.set(doc(getDb(), "fleet", id), data, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ fleet, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveServices(services: ServiceContent[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    services.forEach((service) => {
      const { id, ...data } = service;
      batch.set(doc(getDb(), "services", id || service.slug), data, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ services, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveGallery(gallery: GalleryContent[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    gallery.forEach((item) => {
      const { id, ...data } = item;
      batch.set(doc(getDb(), "gallery", id), data, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ gallery, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveTestimonials(testimonials: TestimonialContent[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    testimonials.forEach((item) => {
      const { id, ...data } = item;
      batch.set(doc(getDb(), "testimonials", id), data, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ testimonials, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveFaq(faq: FaqContent[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    faq.forEach((item) => {
      const { id, ...data } = item;
      batch.set(doc(getDb(), "faq", id), data, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ faq, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveBlogPosts(blog: BlogContent[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    blog.forEach((post) => {
      batch.set(doc(getDb(), "blog", post.slug || post.id), post, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ blog, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveSeoPage(pageId: SeoPageId, meta: SeoPageMeta): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "seo", pageId), meta, { merge: true });
  });
  const seo = { ...loadCmsStore().seo, [pageId]: meta };
  patchCmsStore({ seo, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveServiceSeo(slug: string, meta: SeoPageMeta): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "seo", `service_${slug}`), meta, { merge: true });
  });
  const serviceSeo = { ...loadCmsStore().serviceSeo, [slug]: meta };
  patchCmsStore({ serviceSeo, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function savePageHeader(
  pageId: PageHeaderId,
  imageUrl: string,
): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    await setDoc(doc(getDb(), "pageHeaders", pageId), { imageUrl }, { merge: true });
  });
  const pageHeaders = { ...loadCmsStore().pageHeaders, [pageId]: imageUrl };
  patchCmsStore({ pageHeaders, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveAllPageHeaders(
  pageHeaders: Partial<Record<PageHeaderId, string>>,
): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    Object.entries(pageHeaders).forEach(([id, imageUrl]) => {
      if (imageUrl) batch.set(doc(getDb(), "pageHeaders", id), { imageUrl }, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ pageHeaders, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveAllSeo(seo: Partial<Record<SeoPageId, SeoPageMeta>>): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    Object.entries(seo).forEach(([id, meta]) => {
      if (meta) batch.set(doc(getDb(), "seo", id), meta, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ seo, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function saveMessages(messages: CmsMessage[]): Promise<SaveResult> {
  const sync = await tryFirebaseWrite(async () => {
    const batch = writeBatch(getDb());
    messages.forEach((msg) => {
      batch.set(doc(getDb(), "messages", msg.id), msg, { merge: true });
    });
    await batch.commit();
  });
  patchCmsStore({ messages, firebaseSync: sync });
  notifySiteReload();
  return { ok: true, sync };
}

export async function ingestContactLead(input: {
  name: string;
  email: string;
  phone: string;
  message: string;
  yachtType?: string;
  yachtLength?: string;
  yachtLocation?: string;
  serviceNeeded?: string;
}): Promise<CmsMessage> {
  const lead: CmsMessage = {
    id: `lead-${Date.now()}`,
    name: input.name.trim().slice(0, 120),
    email: input.email.trim().slice(0, 200),
    phone: (input.phone ?? "").trim().slice(0, 60),
    message: input.message.trim().slice(0, 5000),
    yachtType: input.yachtType,
    yachtLength: input.yachtLength,
    yachtLocation: input.yachtLocation,
    serviceNeeded: input.serviceNeeded,
    date: new Date().toISOString().slice(0, 10),
    status: "new",
    source: "contact-form",
  };

  const store = loadCmsStore();
  const messages = [lead, ...store.messages].slice(0, 100);
  patchCmsStore({ messages, firebaseSync: "local" });

  await setDoc(doc(getDb(), "messages", lead.id), lead);
  patchCmsStore({ messages, firebaseSync: "synced" });
  return lead;
}

export async function fetchMessagesFromFirebase(): Promise<CmsMessage[]> {
  const snap = await getDocs(collection(getDb(), "messages"));
  const messages = snap.docs
    .map((item) => item.data() as CmsMessage)
    .filter((item) => item?.id && item?.email)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  if (messages.length) {
    patchCmsStore({ messages, firebaseSync: "synced" });
  }
  return messages;
}

const MAX_IMAGE_EDGE = 1400;
const JPEG_QUALITY = 0.72;
const MAX_DATA_URL_CHARS = 700_000; // keep under Firestore ~1MB doc limit

async function fileToCompressedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only images can be uploaded without Firebase Storage.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_DATA_URL_CHARS && quality > 0.4) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error("Image is too large after compression.");
  }
  return dataUrl;
}

/** Compress image on device and store data URL in Firestore `media` (no Storage). */
export async function uploadMediaFile(file: File, pathPrefix = "uploads"): Promise<string> {
  const dataUrl = await fileToCompressedDataUrl(file);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  try {
    await setDoc(doc(getDb(), "media", id), {
      id,
      pathPrefix,
      name: file.name,
      contentType: "image/jpeg",
      dataUrl,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Still return data URL so CMS fields work offline / if rules not published yet.
  }
  return dataUrl;
}

export function defaultSettingsFromMock(): SiteSettings {
  return {
    companyName: "lunayairmarina",
    phone: companyInfo.phone,
    phoneDisplay: companyInfo.phoneDisplay,
    whatsapp: companyInfo.whatsapp,
    email: companyInfo.email,
    address: { en: companyInfo.addressEn, ar: companyInfo.addressAr },
    socialLinks: { ...companyInfo.social },
  };
}
