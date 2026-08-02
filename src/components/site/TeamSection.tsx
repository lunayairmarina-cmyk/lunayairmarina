import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";
import { resolvePublicMediaSrc } from "@/lib/media";

export function TeamSection() {
  const { language } = useLanguage();
  const team = useOptionalSiteContent()?.bundle?.team ?? [];
  if (!team.length) return null;

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={language === "ar" ? "الفريق" : "Our Team"}
          title={language === "ar" ? "فريق الإدارة" : "Management Team"}
          align="start"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <Reveal key={member.id} delay={index * 0.05} className="border border-navy/10 bg-white p-6">
              {member.image ? (
                <img
                  src={resolvePublicMediaSrc(member.image)}
                  alt={localizeValue(member.name, language)}
                  className="aspect-[4/5] w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="grid aspect-[4/5] place-items-center bg-navy/5 text-2xl text-navy">
                  {localizeValue(member.name, language).slice(0, 2).toUpperCase()}
                </div>
              )}
              <h3 className="mt-5 font-display text-xl text-navy">
                {localizeValue(member.name, language)}
              </h3>
              <p className="mt-1 text-xs tracking-[0.16em] text-gold uppercase">
                {localizeValue(member.position, language)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {localizeValue(member.bio, language)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
