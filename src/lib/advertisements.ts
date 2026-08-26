import type {
  AdvertisementContent,
  AdvertisementPackage,
  AdvertisementStatus,
} from "@/types/content";

/** Derived display status for admin tables and badges. */
export type AdvertisementEffectiveStatus = "draft" | "scheduled" | "active" | "expired" | "paused";

const PACKAGE_RANK: Record<AdvertisementPackage, number> = {
  vip: 3,
  featured: 2,
  standard: 1,
};

function parseDayBoundary(isoDate: string, endOfDay: boolean): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || !month || !day) return null;
  if (endOfDay) return new Date(year, month - 1, day, 23, 59, 59, 999);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function normalizeAdvertisementStatus(value: unknown): AdvertisementStatus {
  if (value === "draft" || value === "paused" || value === "active") return value;
  return "draft";
}

export function normalizeAdvertisementPackage(
  value: unknown,
  featuredFallback?: boolean,
): AdvertisementPackage {
  if (value === "vip" || value === "featured" || value === "standard") return value;
  if (featuredFallback) return "featured";
  return "standard";
}

export function getAdvertisementPackage(
  ad: Pick<AdvertisementContent, "package" | "featured">,
): AdvertisementPackage {
  return normalizeAdvertisementPackage(ad.package, Boolean(ad.featured));
}

export function getAdvertisementEffectiveStatus(
  ad: Pick<AdvertisementContent, "status" | "startDate" | "endDate">,
  now = new Date(),
): AdvertisementEffectiveStatus {
  const status = normalizeAdvertisementStatus(ad.status);
  if (status === "draft") return "draft";
  if (status === "paused") return "paused";

  const start = parseDayBoundary(ad.startDate, false);
  const end = parseDayBoundary(ad.endDate, true);
  if (!start || !end) return "draft";
  if (now < start) return "scheduled";
  if (now > end) return "expired";
  return "active";
}

/** Public page visibility: active window + manual status active. */
export function isAdvertisementVisiblePublic(ad: AdvertisementContent, now = new Date()): boolean {
  return getAdvertisementEffectiveStatus(ad, now) === "active";
}

export function sortAdvertisementsForPublic(ads: AdvertisementContent[]): AdvertisementContent[] {
  return [...ads].sort((a, b) => {
    const packageDelta =
      PACKAGE_RANK[getAdvertisementPackage(b)] - PACKAGE_RANK[getAdvertisementPackage(a)];
    if (packageDelta !== 0) return packageDelta;
    return (
      (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER)
    );
  });
}

export function listVisibleAdvertisements(
  ads: AdvertisementContent[],
  now = new Date(),
): AdvertisementContent[] {
  return sortAdvertisementsForPublic(ads.filter((ad) => isAdvertisementVisiblePublic(ad, now)));
}

/** Featured + VIP appear in the homepage hero ticker. */
export function listTickerAdvertisements(
  ads: AdvertisementContent[],
  now = new Date(),
): AdvertisementContent[] {
  return listVisibleAdvertisements(ads, now).filter((ad) => {
    const pkg = getAdvertisementPackage(ad);
    return pkg === "featured" || pkg === "vip";
  });
}

/** VIP side notice (corner message). */
export function listVipNoticeAdvertisements(
  ads: AdvertisementContent[],
  now = new Date(),
): AdvertisementContent[] {
  return listVisibleAdvertisements(ads, now).filter((ad) => getAdvertisementPackage(ad) === "vip");
}

export function isVipAdvertisement(ad: AdvertisementContent): boolean {
  return getAdvertisementPackage(ad) === "vip";
}

export function isFeaturedOrVipAdvertisement(ad: AdvertisementContent): boolean {
  const pkg = getAdvertisementPackage(ad);
  return pkg === "featured" || pkg === "vip";
}

/** Local calendar day as `YYYY-MM-DD` (avoids UTC off-by-one from toISOString). */
export function localIsoDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Allow only http(s) outbound links for public CTAs. */
export function normalizeAdvertisementWebsiteUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^(javascript|data|vbscript):/i.test(value)) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (/^\/\//.test(value)) return `https:${value}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(value)) {
    return `https://${value}`;
  }
  return "";
}
