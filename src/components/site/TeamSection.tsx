import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Reveal } from "@/components/shared/Reveal";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import type { LocalizedString } from "@/types/content";

/** Names may be Latin in both languages — prefer active lang, then the other side. */
function localizeName(
  value: LocalizedString | string | undefined,
  language: "en" | "ar",
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language]?.trim() || value.en?.trim() || value.ar?.trim() || "";
}

export function TeamSection() {
  const { language } = useLanguage();
  const team = useOptionalSiteContent()?.bundle?.team ?? [];
  if (!team.length) return null;

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={language === "ar" ? "الفريق" : "Our Team"}
          title={language === "ar" ? "فريق الإدارة" : "Management Team"}
          align="start"
        />
        <div className="mt-10 grid gap-6 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {team.map((member, index) => {
            const name = localizeName(member.name, language);
            const position = localizeName(member.position, language);
            const bio = localizeName(member.bio, language);
            return (
              <Reveal
                key={member.id}
                delay={index * 0.05}
                className="border border-navy/10 bg-white p-6"
              >
                {member.image ? (
                  <ResolvedImage
                    src={member.image}
                    alt={name}
                    className="aspect-[4/5] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="grid aspect-[4/5] place-items-center bg-navy/5 text-2xl text-navy">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <h3 className="mt-5 font-display text-xl text-navy">{name}</h3>
                <p className="mt-1 text-xs tracking-[0.16em] text-gold uppercase">{position}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{bio}</p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
