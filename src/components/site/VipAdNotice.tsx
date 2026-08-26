import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Crown, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import {
  listVipNoticeAdvertisements,
  normalizeAdvertisementWebsiteUrl,
} from "@/lib/advertisements";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import type { AdvertisementContent } from "@/types/content";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "lunayairmarina.ad-vip-notice";
const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

type NoticeState = {
  adId: string;
  shownAt: number;
  dismissed: boolean;
};

function readState(): NoticeState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NoticeState;
  } catch {
    return null;
  }
}

function writeState(state: NoticeState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function isVipPreview() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("vipPreview") === "1";
}

/** VIP package corner notice — rotates VIP ads; shows about every 30 minutes (or always with ?vipPreview=1). */
export function VipAdNotice() {
  const { language, t, isRTL } = useLanguage();
  const bundleAds = useOptionalSiteContent()?.bundle?.advertisements ?? [];
  const liveVip = useMemo(() => listVipNoticeAdvertisements(bundleAds), [bundleAds]);
  const vipSignature = liveVip.map((item) => item.id).join("|");
  const [ad, setAd] = useState<AdvertisementContent | undefined>(undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (liveVip.length === 0) {
      setAd(undefined);
      setOpen(false);
      return;
    }

    const previous = readState();
    let selected = liveVip[0]!;

    // With 2+ VIP ads, advance to the next one after the last shown id.
    if (liveVip.length > 1 && previous?.adId) {
      const lastIndex = liveVip.findIndex((item) => item.id === previous.adId);
      if (lastIndex >= 0) {
        selected = liveVip[(lastIndex + 1) % liveVip.length]!;
      }
    }

    // If the chosen ad was shown/dismissed in this cycle, try another VIP once.
    const now = Date.now();
    const selectedRecent =
      previous?.adId === selected.id && now - previous.shownAt < INTERVAL_MS;
    if (selectedRecent && liveVip.length > 1) {
      const alt = liveVip.find((item) => item.id !== selected.id);
      if (alt) {
        const altRecent = previous?.adId === alt.id && now - previous.shownAt < INTERVAL_MS;
        if (!altRecent) selected = alt;
      }
    }

    setAd(selected);

    if (isVipPreview()) {
      setOpen(true);
      return;
    }

    const stillRecent =
      previous?.adId === selected.id && now - previous.shownAt < INTERVAL_MS;
    if (stillRecent) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      writeState({ adId: selected.id, shownAt: Date.now(), dismissed: false });
    }, 1500);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when VIP set changes
  }, [vipSignature]);

  const dismiss = () => {
    setOpen(false);
    if (ad && !isVipPreview()) {
      writeState({ adId: ad.id, shownAt: Date.now(), dismissed: true });
    }
  };

  if (!ad) return null;

  const companyName = localizeOrFallback(ad.companyName, language, "");
  const description = localizeOrFallback(ad.description, language, "");
  const category = localizeOrFallback(ad.category, language, "");
  const ctaLabel = localizeOrFallback(ad.ctaLabel, language, t("advertising.visitWebsite"));
  const websiteUrl = normalizeAdvertisementWebsiteUrl(ad.websiteUrl);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          role="dialog"
          aria-label={t("advertising.vipNotice")}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed end-4 z-40 w-[min(100%-2rem,22rem)] overflow-hidden rounded-2xl",
            "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] sm:end-6 sm:bottom-[calc(6.25rem+env(safe-area-inset-bottom))]",
            "border border-gold/25 bg-[#fbfaf7]",
            "shadow-[0_22px_60px_rgba(11,31,51,0.28)]",
          )}
        >
          {/* Soft gold accent edge */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 z-[3] h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"
          />

          <div className="relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,color-mix(in_oklab,var(--ocean)_35%,transparent),transparent_55%),linear-gradient(160deg,var(--navy),color-mix(in_oklab,var(--navy)_82%,var(--ocean)))]"
            />

            {ad.image ? (
              <ResolvedImage
                src={ad.image}
                alt=""
                className="relative z-[1] aspect-[16/9] w-full object-cover object-center opacity-95"
                loading="lazy"
              />
            ) : (
              <div className="relative z-[1] aspect-[16/9] w-full" />
            )}

            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-t from-[#fbfaf7] via-navy/25 to-navy/40"
            />

            <div className="absolute inset-x-0 top-0 z-[4] flex items-start justify-between p-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-navy/75 px-2.5 py-1 text-[0.58rem] tracking-[0.14em] text-gold uppercase shadow-sm backdrop-blur-md">
                <Crown className="size-3 text-gold" strokeWidth={1.75} aria-hidden />
                {t("advertising.vipNotice")}
              </span>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t("common.close")}
                className="grid size-8 place-items-center rounded-full border border-white/15 bg-navy/55 text-white/90 shadow-sm backdrop-blur-md transition hover:border-gold/45 hover:bg-navy/75 hover:text-gold"
              >
                <X className="size-3.5" strokeWidth={1.7} />
              </button>
            </div>
          </div>

          <div className="relative -mt-7 px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
            <div className="mb-3.5 flex items-end gap-3">
              <div className="relative shrink-0">
                {ad.logo ? (
                  <ResolvedImage
                    src={ad.logo}
                    alt=""
                    className="size-14 rounded-2xl border border-white object-cover shadow-[0_10px_28px_rgba(11,31,51,0.22)] ring-1 ring-gold/35"
                    loading="lazy"
                  />
                ) : (
                  <span className="grid size-14 place-items-center rounded-2xl border border-white bg-navy font-display text-sm tracking-[0.08em] text-gold shadow-[0_10px_28px_rgba(11,31,51,0.22)] ring-1 ring-gold/35">
                    {initials || "VIP"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-0.5">
                {category ? (
                  <p className="mb-1 text-[0.58rem] tracking-[0.16em] text-gold/90 uppercase">
                    {category}
                  </p>
                ) : null}
                <h2 className="truncate font-display text-[1.35rem] leading-tight text-navy">
                  {companyName}
                </h2>
              </div>
            </div>

            {description ? (
              <p className="line-clamp-3 text-[0.92rem] leading-relaxed text-navy/58">
                {description}
              </p>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold bg-gold px-4 py-3 text-[0.68rem] tracking-[0.14em] text-navy uppercase transition hover:-translate-y-0.5 hover:border-navy hover:bg-navy hover:text-navy-foreground"
                >
                  {ctaLabel}
                  <Arrow
                    className="size-3.5 opacity-70 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </a>
              ) : null}
              <Link
                to="/advertising"
                onClick={dismiss}
                className="inline-flex w-full items-center justify-center gap-1.5 py-1.5 text-[0.62rem] tracking-[0.14em] text-navy/50 uppercase transition hover:text-navy"
              >
                {t("advertising.stripCta")}
                <span aria-hidden className="text-gold/80">
                  {isRTL ? "←" : "→"}
                </span>
              </Link>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
