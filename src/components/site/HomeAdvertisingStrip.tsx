import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import { listTickerAdvertisements } from "@/lib/advertisements";
import { cn } from "@/lib/utils";

/**
 * Build two identical halves for a seamless `translateX(-50%)` loop.
 * Few short VIP/featured lines must be repeated or the track is narrower
 * than the viewport and the animation jumps / looks broken.
 */
function buildSeamlessTickerItems(
  items: Array<{ id: string; text: string }>,
): Array<{ key: string; text: string }> {
  if (items.length === 0) return [];
  // Aim for ~6+ segments in one half so the strip stays visually full on desktop.
  const repeats = Math.max(3, Math.ceil(6 / items.length));
  const half = Array.from({ length: repeats }, (_, copy) =>
    items.map((item) => ({
      key: `${item.id}-c${copy}`,
      text: item.text,
    })),
  ).flat();
  return [
    ...half.map((item) => ({ ...item, key: `${item.key}-a` })),
    ...half.map((item) => ({ ...item, key: `${item.key}-b` })),
  ];
}

/** Slim text-only ad ticker — used at the bottom of the homepage hero. */
export function HomeAdvertisingStrip({ className }: { className?: string }) {
  const { language, t, isRTL } = useLanguage();
  const ads = listTickerAdvertisements(useOptionalSiteContent()?.bundle?.advertisements ?? []);
  if (ads.length === 0) return null;

  const lines = ads.map((ad) => {
    const companyName = localizeOrFallback(ad.companyName, language, "");
    const description = localizeOrFallback(ad.description, language, "");
    return {
      id: ad.id,
      text: description ? `${companyName} — ${description}` : companyName,
    };
  });

  const sequence = buildSeamlessTickerItems(lines);
  // Slower pace so VIP/featured lines stay readable.
  const durationSec = Math.max(140, lines.length * 72);

  return (
    <aside
      aria-label={t("advertising.stripLabel")}
      className={cn(
        "border-t border-white/20 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-[0_-4px_24px_rgba(185,28,28,0.35)]",
        className,
      )}
    >
      <div className="container-luxe flex min-h-12 items-center gap-2 py-2.5 sm:min-h-16 sm:gap-5 sm:py-4">
        <span className="relative z-[1] hidden shrink-0 bg-transparent pe-1 text-[0.72rem] font-semibold tracking-[0.2em] text-white uppercase sm:inline sm:text-[0.78rem]">
          {t("advertising.stripLabel")}
        </span>
        <span aria-hidden className="hidden h-4 w-px shrink-0 bg-white/35 sm:block" />

        {/*
          Keep the marquee track in LTR so translateX(-50%) stays seamless.
          Arabic/English text direction is set per item (bidirectional content).
        */}
        <div className="ad-ticker min-w-0 flex-1 overflow-hidden" dir="ltr">
          <div className="ad-ticker-track" style={{ animationDuration: `${durationSec}s` }}>
            {sequence.map((item) => (
              <span key={item.key} className="ad-ticker-item">
                <span
                  dir={isRTL ? "rtl" : "ltr"}
                  className="text-[0.9rem] text-white sm:text-lg"
                >
                  {item.text}
                </span>
                <span aria-hidden className="ad-ticker-dot" />
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/advertising"
          className="relative z-[1] shrink-0 ps-1 text-[0.65rem] font-semibold tracking-[0.12em] text-gold uppercase transition hover:text-white sm:text-[0.78rem] sm:tracking-[0.16em]"
        >
          {t("advertising.stripCta")}
        </Link>
      </div>
    </aside>
  );
}
