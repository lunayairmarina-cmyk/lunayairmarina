import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Reveal } from "@/components/shared/Reveal";
import { Counter } from "@/components/shared/Counter";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";
import aboutImageFallback from "@/assets/about-marina.jpg";

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export function AboutSection({ variant = "home" }: { variant?: "home" | "page" }) {
  const { t, tv, language } = useLanguage();
  const about = useOptionalSiteContent()?.bundle?.about;
  const aboutImage = about?.image || aboutImageFallback;
  const eyebrow = about ? localizeValue(about.eyebrow, language) : t("about.eyebrow");
  const title = about ? localizeValue(about.title, language) : t("about.title");
  const lead = about
    ? localizeValue(about.lead || about.description, language)
    : t("about.lead");
  const body = about ? localizeValue(about.body, language) : t("about.body");
  const cta = t("about.cta");
  const points = about
    ? about.points.map((p) => localizeValue(p, language))
    : (tv<string[]>("about.points") ?? []);
  const stats = about
    ? about.stats.map((s) => ({
        value: s.value,
        suffix: s.suffix,
        label: localizeValue(s.label, language),
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
                className="aspect-[5/4] w-full object-cover transition-transform duration-[1.2s] hover:scale-105"
              />
            </div>
          </Reveal>

          <div className="flex flex-col">
            <Reveal direction="right">
              <span className="eyebrow">{eyebrow}</span>
              <h2 className="mt-4 text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
                {title}
              </h2>
              <span className="gold-rule mt-6" />
              <p className="mt-6 text-lg leading-relaxed text-navy/80">{lead}</p>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
              <Link
                to="/about"
                className="mt-10 inline-flex w-fit border border-navy bg-navy px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy-foreground uppercase transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy"
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
              <h2 className="mt-4 text-3xl leading-tight text-navy sm:text-4xl lg:text-5xl">
                {title}
              </h2>
              <span className="gold-rule mt-6" />
            </Reveal>

            <Reveal direction="right" delay={0.1}>
              <p className="text-lg leading-relaxed text-navy/80">{lead}</p>
              <p className="mt-5 leading-relaxed text-muted-foreground">{body}</p>
            </Reveal>

            <Reveal direction="right" delay={0.2}>
              <ul className="grid gap-4 sm:grid-cols-2">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3 border-s-2 border-gold/50 ps-4 text-sm text-navy/75">
                    <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={2} />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.15}>
          <div className="mt-16 grid grid-cols-1 gap-8 border-t border-border pt-12 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center sm:text-start">
                <p className="font-display text-4xl text-navy sm:text-5xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-3 text-[0.65rem] tracking-[0.22em] text-muted-foreground uppercase">
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
