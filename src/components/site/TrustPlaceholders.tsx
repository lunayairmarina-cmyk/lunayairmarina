import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n";
import { Reveal } from "@/components/shared/Reveal";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";

/**
 * Lightweight trust placeholders for future content:
 * case studies, certifications, licenses, team members.
 */
export function TrustPlaceholders() {
  const { t, tv, language } = useLanguage();
  const trust = useOptionalSiteContent()?.bundle?.trust;
  const localeSlots = tv<{ title: string; body: string }[]>("trust.slots") ?? [];
  const slots = trust
    ? trust.slots.map((slot, index) => ({
        title: localizeOrFallback(slot.title, language, localeSlots[index]?.title ?? ""),
        body: localizeOrFallback(slot.body, language, localeSlots[index]?.body ?? ""),
      }))
    : localeSlots;
  const eyebrow = trust
    ? localizeOrFallback(trust.eyebrow, language, t("trust.eyebrow"))
    : t("trust.eyebrow");
  const title = trust
    ? localizeOrFallback(trust.title, language, t("trust.title"))
    : t("trust.title");
  const lead = trust ? localizeOrFallback(trust.lead, language, t("trust.lead")) : t("trust.lead");
  const cta = trust ? localizeOrFallback(trust.cta, language, t("trust.cta")) : t("trust.cta");

  return (
    <section className="border-y border-border bg-background py-16 lg:py-20">
      <div className="container-luxe">
        <Reveal className="max-w-2xl">
          <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{eyebrow}</p>
          <h2 className="mt-4 font-display text-3xl text-navy sm:text-4xl">{title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{lead}</p>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {slots.map((slot, index) => (
            <Reveal
              key={`${slot.title}-${index}`}
              delay={index * 0.05}
              className="border border-navy/10 p-6"
            >
              <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">{slot.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{slot.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-10">
          <Link
            to="/contact"
            className="inline-flex border border-navy bg-navy px-7 py-3.5 text-[0.7rem] tracking-[0.2em] text-navy-foreground uppercase transition-colors hover:border-gold hover:bg-gold hover:text-navy"
          >
            {cta}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
