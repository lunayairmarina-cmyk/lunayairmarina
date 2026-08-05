import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Reveal } from "@/components/shared/Reveal";
import { Counter } from "@/components/shared/Counter";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import aboutImageFallback from "@/assets/about/about-marina.jpg";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export function AboutSection({ variant = "home" }: { variant?: "home" | "page" }) {
  const { t, tv, language } = useLanguage();
  const about = useOptionalSiteContent()?.bundle?.about;
  const aboutImage = about?.image || aboutImageFallback;
  const eyebrow = about
    ? localizeOrFallback(about.eyebrow, language, t("about.eyebrow"))
    : t("about.eyebrow");
  const title = about
    ? localizeOrFallback(about.title, language, t("about.title"))
    : t("about.title");
  const lead = about
    ? localizeOrFallback(about.lead || about.description, language, t("about.lead"))
    : t("about.lead");
  const body = about
    ? localizeOrFallback(about.body, language, t("about.body"))
    : t("about.body");
  const cta = t("about.cta");
  const points = about
    ? about.points
        .map((p) => localizeOrFallback(p, language, ""))
        .filter(Boolean)
    : (tv<string[]>("about.points") ?? []);
  const stats = about
    ? about.stats.map((s) => ({
        value: s.value,
        suffix: s.suffix,
        label: localizeOrFallback(s.label, language, ""),
      }))
    : (tv<Stat[]>("about.stats") ?? []);

  if (variant === "home") {
    return (
      <section className="border-b border-gold/10 bg-[#fbfaf7] py-24 lg:py-32">
        <div className="container-luxe grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal direction="left">
            <div className="relative overflow-hidden">
              <img
                src={aboutImage}
                alt="Luxury yacht berthed at a marina at dusk"
                loading="lazy"
                width={1200}
                height={900}
                className="aspect-[5/4] w-full object-cover"
              />
            </div>
          </Reveal>

          <div className="flex flex-col">
            <Reveal direction="right">
              <span className="eyebrow">{eyebrow}</span>
              <h2 className="type-display-m mt-3 text-balance text-navy sm:mt-4">
                {title}
              </h2>
              <span className="gold-rule mt-5 sm:mt-6" />
              <p className="type-body mt-5 text-navy/80 sm:mt-6">{lead}</p>
              <p className="type-body-sm mt-3 text-muted-foreground sm:mt-4">{body}</p>
              <Link
                to="/about"
                className="type-cta mt-8 inline-flex w-fit border border-navy bg-navy px-7 py-3.5 text-navy-foreground transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy sm:mt-10 sm:px-8 sm:py-4"
              >
                {cta}
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-24 lg:py-32">
      <div className="container-luxe">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal direction="left">
            <img
              src={aboutImage}
              alt="Luxury yacht berthed at a marina at dusk"
              loading="lazy"
              width={1200}
              height={1400}
              className="aspect-[4/5] w-full object-cover"
            />
          </Reveal>

          <div className="flex flex-col justify-center gap-8">
            <Reveal direction="right">
              <span className="eyebrow">{eyebrow}</span>
              <h2 className="type-display-m mt-3 text-balance text-navy sm:mt-4">
                {title}
              </h2>
              <span className="gold-rule mt-5 sm:mt-6" />
            </Reveal>

            <Reveal direction="right" delay={0.1}>
              <p className="type-body text-navy/80">{lead}</p>
              <p className="type-body-sm mt-4 text-muted-foreground sm:mt-5">{body}</p>
            </Reveal>

            <Reveal direction="right" delay={0.2}>
              <ul className="grid gap-4 sm:grid-cols-2">
                {points.map((point) => (
                  <li key={point} className="type-body-sm flex items-start gap-3 border-s-2 border-gold/50 ps-4 text-navy/75">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={2} />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-12 grid grid-cols-1 gap-8 border-t border-border pt-10 sm:mt-16 sm:grid-cols-3 sm:pt-12">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-start">
                <p className="type-display-l text-navy">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="type-meta mt-3 text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
