import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";
import { resolvePublicMediaSrc } from "@/lib/media";

export function FleetSection({ limit }: { limit?: number }) {
  const { t, language } = useLanguage();
  const fleet = useOptionalSiteContent()?.bundle?.fleet ?? [];
  const items = typeof limit === "number" ? fleet.slice(0, limit) : fleet;
  if (!items.length) return null;

  return (
    <section className="bg-[#f3efe7] py-16 sm:py-20 lg:py-24">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={t("fleet.eyebrow")}
          title={t("fleet.title")}
          subtitle={t("fleet.subtitle")}
          align="start"
        />
        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {items.map((yacht, index) => (
            <Reveal key={yacht.id} delay={index * 0.05} className="overflow-hidden border border-navy/10 bg-white">
              <img
                src={resolvePublicMediaSrc(yacht.image)}
                alt={yacht.yachtName}
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
              <div className="p-5">
                <h3 className="font-display text-xl text-navy">{yacht.yachtName}</h3>
                <p className="mt-1 text-xs tracking-[0.16em] text-gold uppercase">
                  {localizeValue(yacht.yachtType, language)} · {yacht.yachtLength}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {localizeValue(yacht.description, language)}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
