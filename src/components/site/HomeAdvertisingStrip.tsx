import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import { listTickerAdvertisements } from "@/lib/advertisements";
import { cn } from "@/lib/utils";

/** Slim text-only ad ticker — used at the bottom of the homepage hero. */
export function HomeAdvertisingStrip({ className }: { className?: string }) {
  const { language, t, isRTL } = useLanguage();
  const ads = listTickerAdvertisements(
    useOptionalSiteContent()?.bundle?.advertisements ?? [],
  );
  if (ads.length === 0) return null;

  const lines = ads.map((ad) => {
    const companyName = localizeOrFallback(ad.companyName, language, "");
    const description = localizeOrFallback(ad.description, language, "");
    return description ? `${companyName} — ${description}` : companyName;
  });

  const sequence = [...lines, ...lines];

  return (
    <aside
      aria-label={t("advertising.stripLabel")}
      className={cn(
        "border-t border-gold/30 bg-navy/80 text-navy-foreground backdrop-blur-md",
        className,
      )}
    >
      <div className="container-luxe flex min-h-14 items-center gap-3 py-3.5 sm:min-h-16 sm:gap-5 sm:py-4">
        <span className="relative z-[1] shrink-0 bg-transparent pe-1 text-[0.72rem] tracking-[0.2em] text-gold uppercase sm:text-[0.78rem]">
          {t("advertising.stripLabel")}
        </span>
        <span aria-hidden className="hidden h-4 w-px shrink-0 bg-gold/35 sm:block" />

        <div className="ad-ticker min-w-0 flex-1 overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
          <div
            className="ad-ticker-track"
            style={{ animationDuration: `${Math.max(18, lines.length * 14)}s` }}
          >
            {sequence.map((line, index) => (
              <span key={`${line}-${index}`} className="ad-ticker-item">
                <span className="text-base text-white/90 sm:text-lg">{line}</span>
                <span aria-hidden className="ad-ticker-dot" />
              </span>
            ))}
          </div>
        </div>

        <Link
          to="/advertising"
          className="relative z-[1] shrink-0 ps-1 text-[0.72rem] tracking-[0.16em] text-gold uppercase transition hover:text-gold-soft sm:text-[0.78rem]"
        >
          {t("advertising.stripCta")}
        </Link>
      </div>
    </aside>
  );
}
