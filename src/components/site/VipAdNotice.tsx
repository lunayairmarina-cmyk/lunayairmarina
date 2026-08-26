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
    const now = Date.now();

    // After dismiss/show, stay quiet for the full interval — don't rotate into another VIP immediately.
    if (
      !isVipPreview() &&
      previous &&
      now - previous.shownAt < INTERVAL_MS &&
      (previous.dismissed || previous.shownAt > 0)
    ) {
      const keep =
        liveVip.find((item) => item.id === previous.adId) ?? liveVip[0];
      setAd(keep);
      setOpen(false);
      return;
    }

    let selected = liveVip[0]!;

    // With 2+ VIP ads, advance to the next one after the last shown id (only when interval elapsed).
    if (liveVip.length > 1 && previous?.adId) {
      const lastIndex = liveVip.findIndex((item) => item.id === previous.adId);
      if (lastIndex >= 0) {
        selected = liveVip[(lastIndex + 1) % liveVip.length]!;
      }
    }

    setAd(selected);

    if (isVipPreview()) {
      setOpen(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      writeState({ adId: selected.id, shownAt: Date.now(), dismissed: false });
    }, 30_000);

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
          initial={{ opacity: 0, y: 28, x: isRTL ? -10 : 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, x: isRTL ? -8 : 8, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "fixed z-40 overflow-hidden rounded-2xl border border-gold/25 bg-[#fbfaf7]/98 backdrop-blur-sm",
            "w-[min(calc(100vw-5.5rem),19rem)] sm:w-[min(22rem,calc(100vw-3rem))]",
            isRTL
              ? "bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-3 sm:left-6"
              : "bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-3 sm:right-6",
            "shadow-[0_18px_48px_rgba(11,31,51,0.22)]",
          )}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"
          />

          <div className="flex items-start gap-2.5 p-3 sm:gap-3 sm:p-3.5">
            <div className="relative shrink-0">
              {ad.logo ? (
                <ResolvedImage
                  src={ad.logo}
                  alt=""
                  className="size-11 rounded-xl border border-white bg-white object-contain p-1 shadow-[0_8px_22px_rgba(11,31,51,0.12)] ring-1 ring-gold/35"
                  loading="lazy"
                />
              ) : (
                <span className="grid size-11 place-items-center rounded-xl border border-white bg-navy font-display text-xs tracking-[0.08em] text-gold shadow-[0_8px_22px_rgba(11,31,51,0.12)] ring-1 ring-gold/35">
                  {initials || "VIP"}
                </span>
              )}
              <span className="absolute -top-1 -end-1 inline-flex items-center gap-1 rounded-full bg-navy px-1.5 py-0.5 text-[0.5rem] tracking-[0.12em] text-gold uppercase shadow-sm">
                <Crown className="size-2.5 text-gold" strokeWidth={1.8} aria-hidden />
                VIP
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {category ? (
                    <p className="mb-0.5 truncate text-[0.52rem] tracking-[0.14em] text-gold/90 uppercase">
                      {category}
                    </p>
                  ) : null}
                  <h2 className="font-display text-[0.98rem] leading-snug text-navy">
                    {companyName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label={t("common.close")}
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-navy/10 bg-white text-navy/70 transition hover:border-gold/40 hover:text-gold"
                >
                  <X className="size-3.5" strokeWidth={1.7} />
                </button>
              </div>

              {description ? (
                <p className="mt-1 text-[0.74rem] leading-relaxed text-navy/60">
                  {description}
                </p>
              ) : null}

              <div className="mt-2 flex items-center gap-2">
                {websiteUrl ? (
                  <a
                    href={websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={dismiss}
                    className="group inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gold bg-gold px-3 py-2 text-[0.58rem] tracking-[0.12em] text-navy uppercase transition hover:border-navy hover:bg-navy hover:text-navy-foreground"
                  >
                    {ctaLabel}
                    <Arrow
                      className="size-3 opacity-70 transition group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                      strokeWidth={1.8}
                      aria-hidden
                    />
                  </a>
                ) : null}
                <Link
                  to="/advertising"
                  onClick={dismiss}
                  className="inline-flex shrink-0 items-center justify-center gap-1 text-[0.55rem] tracking-[0.12em] text-navy/55 uppercase transition hover:text-navy"
                >
                  {t("advertising.stripCta")}
                  <span aria-hidden className="text-gold/80">
                    {isRTL ? "←" : "→"}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
