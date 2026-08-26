import { createFileRoute } from "@tanstack/react-router";
import { Crown, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import {
  getAdvertisementPackage,
  listVisibleAdvertisements,
  normalizeAdvertisementWebsiteUrl,
} from "@/lib/advertisements";
import { buildSeoHead } from "@/services/seoService";
import { usePageHeaderImage } from "@/hooks/usePageHeaderImage";
import type { AdvertisementContent, AdvertisementPackage } from "@/types/content";
import advertisingHeader from "@/assets/headers/header-advertising.webp";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const Route = createFileRoute("/advertising")({
  head: () => buildSeoHead("advertising", "/advertising"),
  component: AdvertisingPage,
});

function trackAdClick(ad: AdvertisementContent) {
  try {
    const gtag = (
      window as Window & {
        gtag?: (...args: unknown[]) => void;
      }
    ).gtag;
    gtag?.("event", "ad_click", {
      event_category: "advertising",
      ad_id: ad.id,
      company_name: ad.companyName.en || ad.companyName.ar,
      outbound_url: ad.websiteUrl,
      ad_package: getAdvertisementPackage(ad),
    });
  } catch {
    // Analytics is best-effort only.
  }
}

function VipAdvertisementCard({
  ad,
}: {
  ad: AdvertisementContent;
}) {
  const { language, t } = useLanguage();
  const companyName = localizeOrFallback(ad.companyName, language, "");
  const description = localizeOrFallback(ad.description, language, "");
  const category = localizeOrFallback(ad.category, language, "");
  const ctaLabel = localizeOrFallback(ad.ctaLabel, language, t("advertising.visitWebsite"));
  const websiteUrl = normalizeAdvertisementWebsiteUrl(ad.websiteUrl);
  const initials = companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <article className="ad-featured group relative flex h-full flex-col overflow-hidden rounded-xl border border-gold/50 bg-gradient-to-br from-[#fffdf8] via-white to-[#f7f1e4] shadow-[0_14px_36px_rgba(11,31,51,0.08)]">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 z-[2] h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"
      />

      {/* Media: contain so logos/photos don't get cropped into a giant mess */}
      <div className="relative z-[1] aspect-[2/1] overflow-hidden bg-[linear-gradient(165deg,var(--navy),color-mix(in_oklab,var(--navy)_78%,var(--ocean)))] sm:aspect-[16/10]">
        {ad.image ? (
          <ResolvedImage
            src={ad.image}
            alt={companyName}
            className="h-full w-full object-contain object-center p-3 sm:p-6"
            loading="lazy"
          />
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
        />
        <span className="ad-featured-badge absolute start-3 top-3 z-[3] inline-flex items-center gap-1.5 rounded-full border border-gold/55 bg-navy/80 px-2.5 py-1 text-[0.55rem] tracking-[0.14em] text-gold uppercase backdrop-blur-md">
          <Crown className="size-3 text-gold" strokeWidth={1.75} aria-hidden />
          {t("advertising.package.vip")}
        </span>
      </div>

      <div className="relative z-[1] flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-center gap-3">
          {ad.logo ? (
            <ResolvedImage
              src={ad.logo}
              alt=""
              className="size-11 shrink-0 rounded-full border border-gold/45 object-cover ring-2 ring-gold/20 sm:size-12"
              loading="lazy"
            />
          ) : (
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/15 text-[0.7rem] tracking-[0.12em] text-navy sm:size-12">
              {initials || "VIP"}
            </span>
          )}
          <div className="min-w-0">
            {category ? (
              <p className="text-[0.55rem] tracking-[0.16em] text-gold uppercase">{category}</p>
            ) : null}
            <h2 className="truncate font-display text-xl leading-snug text-navy sm:text-[1.4rem]">
              {companyName || t("advertising.package.vip")}
            </h2>
          </div>
        </div>

        {description ? (
          <p className="mt-3 line-clamp-3 flex-1 text-[0.9rem] leading-relaxed text-navy/60">
            {description}
          </p>
        ) : null}

        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAdClick({ ...ad, websiteUrl })}
            className="mt-4 inline-flex w-full max-w-full items-center justify-center gap-2 border border-gold bg-gold px-4 py-2.5 text-[0.62rem] tracking-[0.14em] text-navy uppercase transition hover:border-navy hover:bg-navy hover:text-navy-foreground sm:w-fit"
          >
            {ctaLabel}
            <span aria-hidden>→</span>
          </a>
        ) : null}
      </div>
    </article>
  );
}

function AdvertisementCard({
  ad,
  size,
}: {
  ad: AdvertisementContent;
  size: Exclude<AdvertisementPackage, "vip">;
}) {
  const { language, t } = useLanguage();
  const isFeatured = size === "featured";
  const companyName = localizeOrFallback(ad.companyName, language, "");
  const description = localizeOrFallback(ad.description, language, "");
  const category = localizeOrFallback(ad.category, language, "");
  const ctaLabel = localizeOrFallback(ad.ctaLabel, language, t("advertising.visitWebsite"));
  const websiteUrl = normalizeAdvertisementWebsiteUrl(ad.websiteUrl);

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden border bg-white transition",
        isFeatured
          ? "border-gold/35 hover:border-gold/55 hover:shadow-card"
          : "border-navy/10 hover:border-gold/30 hover:shadow-card",
      )}
    >
      <div className="relative z-[1]">
        {ad.image ? (
          <ResolvedImage
            src={ad.image}
            alt={companyName}
            className={cn("w-full object-cover", isFeatured ? "aspect-[16/10]" : "aspect-[16/11]")}
            loading="lazy"
          />
        ) : (
          <div className={cn(isFeatured ? "aspect-[16/10]" : "aspect-[16/11]", "bg-navy/5")} />
        )}
        {isFeatured ? (
          <span className="absolute start-2.5 top-2.5 z-[3] inline-flex items-center gap-1 border border-gold/55 bg-navy/85 px-2 py-0.5 text-[0.52rem] tracking-[0.14em] text-gold uppercase backdrop-blur-sm">
            <Sparkles className="size-2.5 text-gold" strokeWidth={1.75} aria-hidden />
            {t("advertising.package.featured")}
          </span>
        ) : null}
      </div>

      <div
        className={cn("relative z-[1] flex flex-1 flex-col", isFeatured ? "p-3.5 sm:p-4" : "p-4")}
      >
        <div className="flex items-center gap-2.5">
          {ad.logo ? (
            <ResolvedImage
              src={ad.logo}
              alt=""
              className={cn(
                "rounded-full border object-cover",
                isFeatured ? "size-8 border-gold/30" : "size-8 border-navy/10",
              )}
              loading="lazy"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-navy/5 text-[0.6rem] tracking-[0.1em] text-navy">
              {companyName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            {category ? (
              <p className="text-[0.58rem] tracking-[0.14em] text-gold uppercase">{category}</p>
            ) : null}
            <h2
              className={cn(
                "truncate font-display text-navy",
                isFeatured ? "text-base sm:text-lg" : "text-base",
              )}
            >
              {companyName}
            </h2>
          </div>
        </div>

        <p
          className={cn(
            "mt-2.5 flex-1 leading-relaxed text-muted-foreground",
            isFeatured ? "line-clamp-2 text-[0.8125rem]" : "mt-3 line-clamp-2 text-sm",
          )}
        >
          {description}
        </p>

        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackAdClick({ ...ad, websiteUrl })}
            className={cn(
              "mt-3.5 inline-flex w-full max-w-full items-center justify-center border px-3.5 py-2 text-[0.58rem] tracking-[0.16em] uppercase transition sm:w-fit sm:py-1.5",
              isFeatured
                ? "border-gold bg-gold text-navy hover:border-navy hover:bg-navy hover:text-navy-foreground"
                : "mt-4 border-navy bg-navy px-4 py-2 text-[0.62rem] text-navy-foreground hover:border-gold hover:bg-gold hover:text-navy",
            )}
          >
            {ctaLabel}
          </a>
        ) : null}
      </div>
    </article>
  );
}

function AdSection({
  title,
  tone = "standard",
  children,
}: {
  title: string;
  /** VIP = gold fill, featured = gold outline, standard = plain */
  tone?: "vip" | "featured" | "standard";
  children: ReactNode;
}) {
  const titleClass =
    tone === "vip"
      ? "inline-block bg-gold px-3.5 py-1.5 font-display text-2xl leading-none text-navy sm:px-4 sm:py-2 sm:text-[1.75rem]"
      : tone === "featured"
        ? "inline-block border border-gold/70 bg-gold/15 px-3 py-1 font-display text-lg leading-none tracking-wide text-navy sm:px-3.5 sm:py-1.5 sm:text-xl"
        : "inline-block border border-navy/15 bg-navy/[0.04] px-3 py-1 font-display text-base leading-none text-navy/75 sm:px-3.5 sm:py-1.5 sm:text-lg";

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <h2 className={titleClass}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function AdvertisingPage() {
  const { t } = useLanguage();
  const headerImage = usePageHeaderImage("advertising", advertisingHeader);
  const ads = listVisibleAdvertisements(useOptionalSiteContent()?.bundle?.advertisements ?? []);
  const vipAds = ads.filter((ad) => getAdvertisementPackage(ad) === "vip");
  const featuredAds = ads.filter((ad) => getAdvertisementPackage(ad) === "featured");
  const standardAds = ads.filter((ad) => getAdvertisementPackage(ad) === "standard");

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("advertising.eyebrow")}
        title={t("advertising.title")}
        subtitle={t("advertising.subtitle")}
        image={headerImage}
      />

      <section className="bg-[#fbfaf7] py-12 sm:py-14 lg:py-16">
        <div className="container-luxe space-y-12 lg:space-y-14">
          {ads.length === 0 ? (
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">{t("advertising.emptyEyebrow")}</p>
              <h2 className="type-display-m mt-4 text-navy">{t("advertising.emptyTitle")}</h2>
              <p className="type-body mt-5 text-muted-foreground">{t("advertising.emptyBody")}</p>
            </Reveal>
          ) : (
            <>
              {vipAds.length > 0 ? (
                <AdSection title={t("advertising.sections.vip")} tone="vip">
                  <div
                    className={cn(
                      "mx-auto grid gap-4 sm:gap-5",
                      vipAds.length === 1
                        ? "max-w-xl grid-cols-1"
                        : "max-w-5xl grid-cols-1 sm:grid-cols-2",
                    )}
                  >
                    {vipAds.map((ad, index) => (
                      <Reveal key={ad.id} delay={index * 0.04} className="min-w-0 h-full">
                        <VipAdvertisementCard ad={ad} />
                      </Reveal>
                    ))}
                  </div>
                </AdSection>
              ) : null}

              {featuredAds.length > 0 ? (
                <AdSection title={t("advertising.sections.featured")} tone="featured">
                  <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-4 sm:gap-5">
                    {featuredAds.map((ad, index) => (
                      <Reveal
                        key={ad.id}
                        delay={index * 0.04}
                        className="w-full min-w-0 sm:w-[calc(50%-0.625rem)]"
                      >
                        <AdvertisementCard ad={ad} size="featured" />
                      </Reveal>
                    ))}
                  </div>
                </AdSection>
              ) : null}

              {standardAds.length > 0 ? (
                <AdSection title={t("advertising.sections.standard")} tone="standard">
                  <div className="mx-auto flex flex-wrap justify-center gap-4">
                    {standardAds.map((ad, index) => (
                      <Reveal
                        key={ad.id}
                        delay={index * 0.04}
                        className="w-full min-w-0 sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.7rem)] lg:max-w-sm"
                      >
                        <AdvertisementCard ad={ad} size="standard" />
                      </Reveal>
                    ))}
                  </div>
                </AdSection>
              ) : null}
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
