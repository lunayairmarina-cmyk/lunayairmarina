import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { TeamSection } from "@/components/site/TeamSection";
import { FleetSection } from "@/components/site/FleetSection";
import { Reveal } from "@/components/shared/Reveal";
import { Counter } from "@/components/shared/Counter";
import { useLanguage } from "@/lib/i18n";
import { buildSeoHead } from "@/services/seoService";
import { usePageHeaderImage } from "@/hooks/usePageHeaderImage";
import aboutHeader from "@/assets/gallery-2.jpg";
import aboutImage from "@/assets/about-marina.jpg";

export const Route = createFileRoute("/about")({
  head: () => buildSeoHead("about", "/about"),
  component: AboutPage,
});

interface Stat {
  value: number;
  suffix: string;
  label: string;
}

interface ValueItem {
  title: string;
  description: string;
}

function AboutPage() {
  const { t, tv } = useLanguage();
  const headerImage = usePageHeaderImage("about", aboutHeader);
  const stats = tv<Stat[]>("about.stats") ?? [];
  const values = tv<ValueItem[]>("about.values") ?? [];

  return (
    <SiteLayout transparentNav>
      <PageHeader
        eyebrow={t("about.eyebrow")}
        title={t("about.pageTitle")}
        subtitle={t("about.pageSubtitle")}
        image={headerImage}
        crumb={t("nav.about")}
      />

      {/* Stats strip */}
      <section className="border-b border-border bg-background">
        <div className="container-luxe grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rtl:divide-x-reverse">
          {stats.map((stat, index) => (
            <Reveal
              key={stat.label}
              delay={index * 0.08}
              className="px-2 py-12 text-center sm:px-8 sm:py-14 sm:text-start"
            >
              <p className="font-display text-5xl text-navy lg:text-6xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p className="mx-auto mt-4 max-w-[16rem] text-sm leading-relaxed text-muted-foreground sm:mx-0">
                {stat.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Story — asymmetric */}
      <section className="bg-background py-24 lg:py-32">
        <div className="container-luxe grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-24">
          <Reveal direction="left" className="relative lg:-ms-4">
            <img
              src={aboutImage}
              alt=""
              loading="lazy"
              width={1200}
              height={1400}
              className="aspect-[4/5] w-full object-cover lg:aspect-[5/6]"
            />
            <div className="absolute bottom-0 inset-inline-start-0 border border-gold/40 bg-navy px-7 py-6 text-white sm:inset-inline-start-6 sm:bottom-6">
              <p className="text-[0.65rem] tracking-[0.22em] text-gold uppercase">
                {t("about.since.label")}
              </p>
              <p className="mt-1 font-display text-4xl">{t("about.since.year")}</p>
              <p className="mt-1 text-xs text-white/60">{t("about.since.caption")}</p>
            </div>
          </Reveal>

          <Reveal direction="right">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("about.story.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-navy sm:text-4xl lg:text-[2.75rem]">
              {t("about.story.title")}
            </h2>
            <span className="mt-6 block h-px w-14 bg-gold" />
            <p className="mt-8 text-base leading-relaxed text-navy/75 sm:text-lg">
              {t("about.story.body")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="bg-sand py-24 lg:py-28">
        <div className="container-luxe grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="border-s-2 border-gold ps-8 sm:ps-10">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("about.mission.eyebrow")}
            </p>
            <p className="mt-5 font-display text-2xl leading-snug text-navy sm:text-3xl">
              {t("about.mission.body")}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="border-s-2 border-navy/25 ps-8 sm:ps-10">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("about.vision.eyebrow")}
            </p>
            <p className="mt-5 font-display text-2xl leading-snug text-navy sm:text-3xl">
              {t("about.vision.body")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-background py-24 lg:py-32">
        <div className="container-luxe">
          <Reveal className="max-w-2xl">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("about.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{t("about.valuesTitle")}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("about.valuesLead")}
            </p>
          </Reveal>

          <div className="mt-16 grid gap-x-12 gap-y-14 sm:grid-cols-2">
            {values.map((value, index) => (
              <Reveal key={value.title} delay={index * 0.06} className="flex gap-4">
                <span className="mt-1 text-lg text-gold" aria-hidden>
                  ✦
                </span>
                <div>
                  <h3 className="text-xl text-navy sm:text-2xl">{value.title}</h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {value.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Clients */}
      <section className="relative overflow-hidden bg-[#050d18] py-24 lg:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,169,106,0.12),transparent_55%)]"
        />
        <div className="container-luxe relative max-w-3xl text-center text-white">
          <Reveal>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("about.clients.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl">{t("about.clients.title")}</h2>
            <p className="mt-6 text-base leading-relaxed text-white/65 sm:text-lg">
              {t("about.clients.body")}
            </p>
            <p className="mt-12 font-display text-2xl text-gold sm:text-3xl">
              “{t("about.clients.quote")}”
            </p>
          </Reveal>
        </div>
      </section>

      <TeamSection />
      <FleetSection />
      <WhyChooseUs />

      {/* CTA */}
      <section className="relative overflow-hidden bg-sand py-24 lg:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(200,169,106,0.16),transparent_50%)]"
        />
        <div className="container-luxe relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-end">
          <Reveal>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("about.ctaBand.eyebrow")}
            </p>
            <h2 className="mt-4 max-w-xl font-display text-3xl text-navy sm:text-5xl">
              {t("about.ctaBand.title")}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
              {t("about.ctaBand.body")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              to="/contact"
              className="inline-flex items-center gap-3 border border-navy bg-navy px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy-foreground uppercase transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy"
            >
              {t("about.ctaBand.button")}
              <span aria-hidden>➝</span>
            </Link>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
