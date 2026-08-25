import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Crown, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import {
  listVipNoticeAdvertisements,
  normalizeAdvertisementWebsiteUrl,
} from "@/lib/advertisements";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import type { AdvertisementContent } from "@/types/content";

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

/** VIP package corner notice — shows about every 30 minutes (or always with ?vipPreview=1). */
export function VipAdNotice() {
  const { language, t, isRTL } = useLanguage();
  const bundleAds = useOptionalSiteContent()?.bundle?.advertisements ?? [];
  const liveVip = listVipNoticeAdvertisements(bundleAds);
  const ad = useMemo<AdvertisementContent | undefined>(() => {
    if (liveVip[0]) return liveVip[0];
    return undefined;
  }, [liveVip]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ad) {
      setOpen(false);
      return;
    }

    if (isVipPreview()) {
      setOpen(true);
      return;
    }

    const now = Date.now();
    const previous = readState();
    const sameAd = previous?.adId === ad.id;
    const recentlyShown = sameAd && now - previous.shownAt < INTERVAL_MS;
    const dismissedThisCycle = sameAd && previous.dismissed && recentlyShown;

    if (dismissedThisCycle || recentlyShown) {
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setOpen(true);
      writeState({ adId: ad.id, shownAt: Date.now(), dismissed: false });
    }, 1500);

    return () => window.clearTimeout(timer);
  }, [ad]);

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
  const ctaLabel = localizeOrFallback(
    ad.ctaLabel,
    language,
    t("advertising.visitWebsite"),
  );
  const websiteUrl = normalizeAdvertisementWebsiteUrl(ad.websiteUrl);

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          role="dialog"
          aria-label={t("advertising.vipNotice")}
          initial={{ opacity: 0, y: 28, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed end-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-40 w-[min(100%-2rem,21.5rem)] overflow-hidden border border-gold/35 bg-[#fbfaf7] shadow-[0_18px_50px_rgba(11,31,51,0.28)] sm:end-6 sm:bottom-[calc(6.25rem+env(safe-area-inset-bottom))]"
        >
          <div className="relative">
            {ad.image ? (
              <ResolvedImage
                src={ad.image}
                alt=""
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="aspect-[16/10] bg-navy" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/75 via-navy/10 to-transparent" />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
              <span className="inline-flex items-center gap-1.5 border border-gold/50 bg-navy/80 px-2.5 py-1 text-[0.58rem] tracking-[0.16em] text-gold uppercase backdrop-blur-sm">
                <Crown className="size-3" strokeWidth={1.75} aria-hidden />
                {t("advertising.vipNotice")}
              </span>
              <button
                type="button"
                onClick={dismiss}
                aria-label={t("common.close")}
                className="grid size-8 place-items-center border border-white/20 bg-navy/70 text-white/85 backdrop-blur-sm transition hover:border-gold/50 hover:text-gold"
              >
                <X className="size-3.5" strokeWidth={1.6} />
              </button>
            </div>

            {ad.logo ? (
              <div className="absolute bottom-3 start-3">
                <ResolvedImage
                  src={ad.logo}
                  alt=""
                  className="size-11 rounded-full border border-gold/40 object-cover shadow-md ring-2 ring-navy/30"
                  loading="lazy"
                />
              </div>
            ) : null}
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            {category ? (
              <p className="text-[0.58rem] tracking-[0.18em] text-gold uppercase">{category}</p>
            ) : null}
            <h2 className="font-display text-[1.35rem] leading-snug text-navy">{companyName}</h2>
            {description ? (
              <p className="line-clamp-3 text-sm leading-relaxed text-navy/60">
                {description}
              </p>
            ) : null}

            <div className="flex flex-col gap-2.5 pt-1">
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismiss}
                  className="inline-flex w-full items-center justify-center border border-gold bg-gold px-4 py-3 text-[0.65rem] tracking-[0.16em] text-navy uppercase transition hover:border-navy hover:bg-navy hover:text-navy-foreground"
                >
                  {ctaLabel}
                </a>
              ) : null}
              <Link
                to="/advertising"
                onClick={dismiss}
                className="inline-flex w-full items-center justify-center gap-2 py-1 text-[0.62rem] tracking-[0.16em] text-navy/55 uppercase transition hover:text-navy"
              >
                {t("advertising.stripCta")}
                <span aria-hidden>{isRTL ? "←" : "→"}</span>
              </Link>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
