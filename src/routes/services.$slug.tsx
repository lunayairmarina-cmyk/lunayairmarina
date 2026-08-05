import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/shared/Reveal";
import { useLanguage } from "@/lib/i18n";
import { getServiceBySlug, isServiceSlug } from "@/data/services";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { buildServiceSeoHead } from "@/services/seoService";
import { resolvePublicMediaSrc } from "@/lib/media";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => {
    if (!isServiceSlug(params.slug)) throw notFound();
    const service = getServiceBySlug(params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ params }) => buildServiceSeoHead(params.slug),
  component: ServiceDetailPage,
});

interface ServiceDetailCopy {
  title: string;
  intro: string;
  summary: string;
  meta: {
    investmentLabel: string;
    investmentValue: string;
    galleryLabel: string;
    galleryValue: string;
    benefitsLabel: string;
    benefitsValue: string;
    categoryLabel: string;
    categoryValue: string;
  };
  startCta: string;
  exploreCta: string;
  detailEyebrow: string;
  detailTitle: string;
  detailBody: string;
  benefitsEyebrow: string;
  benefitsLead: string;
  benefits: string[];
  valueEyebrow: string;
  valueTitle: string;
  valueLead: string;
  values: { title: string; description: string }[];
  galleryEyebrow: string;
  galleryTitle: string;
  galleryLead: string;
  gallery: Record<string, string>;
}

function ServiceDetailPage() {
  const service = Route.useLoaderData();
  const { slug } = Route.useParams();
  const { t, tv } = useLanguage();
  const remote = useOptionalSiteContent()?.bundle?.services?.find((item) => item.slug === slug);
  const coverImage = resolvePublicMediaSrc(remote?.image || service.coverImage, service.coverImage);
  const galleryItems =
    remote?.gallery && remote.gallery.length > 0
      ? remote.gallery.map((item, index) => ({
          src: resolvePublicMediaSrc(item.src, service.coverImage),
          captionKey: `g${index + 1}`,
        }))
      : service.gallery;
  const copy = tv<ServiceDetailCopy | undefined>(`services.details.${slug}`);

  if (!copy?.meta || !Array.isArray(copy.benefits) || !Array.isArray(copy.values)) {
    return (
      <SiteLayout>
        <div className="container-luxe flex min-h-[50vh] flex-col items-center justify-center py-24 text-center">
          <h1 className="font-display text-3xl text-navy">{t("services.title")}</h1>
          <Link to="/services" className="mt-6 text-sm tracking-[0.16em] text-gold uppercase">
            {t("services.back")}
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const metaRows = [
    [copy.meta.investmentLabel, copy.meta.investmentValue],
    [copy.meta.galleryLabel, copy.meta.galleryValue],
    [copy.meta.benefitsLabel, copy.meta.benefitsValue],
    [copy.meta.categoryLabel, copy.meta.categoryValue],
  ] as const;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pb-24">
        <div className="absolute inset-0">
          <img src={coverImage} alt="" className="size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/25 to-transparent" />
        </div>

        <div className="container-luxe relative z-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <Reveal>
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-[0.65rem] tracking-[0.2em] text-gold uppercase transition-colors hover:text-gold-soft"
            >
              <ArrowRight className="size-3.5 rotate-180 rtl:rotate-0" strokeWidth={1.5} />
              {t("services.back")}
            </Link>
            <h1 className="mt-5 max-w-3xl font-display text-3xl leading-tight text-white sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
              {copy.intro}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:text-base">
              {copy.summary}
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/contact"
                className="border border-gold bg-gold px-7 py-3.5 text-center text-[0.7rem] tracking-[0.2em] text-navy uppercase transition hover:bg-transparent hover:text-gold"
              >
                {copy.startCta}
              </Link>
              <a
                href="#details"
                className="border border-white/40 px-7 py-3.5 text-center text-[0.7rem] tracking-[0.2em] text-white uppercase transition hover:border-white hover:bg-white/10"
              >
                {copy.exploreCta}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="border border-white/15 bg-white/5 p-6 backdrop-blur-md sm:p-8">
              <dl className="space-y-5">
                {metaRows.map(([label, value]) => (
                  <div key={label} className="flex items-end justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <dt className="text-[0.65rem] tracking-[0.18em] text-white/50 uppercase">{label}</dt>
                    <dd className="text-sm font-medium text-gold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Detailed description + benefits */}
      <section id="details" className="bg-background py-24 lg:py-32">
        <div className="container-luxe grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{copy.detailEyebrow}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-4xl">{copy.detailTitle}</h2>
            <span className="gold-rule mt-6" />
            <p className="mt-8 text-base leading-relaxed text-navy/80 sm:text-lg">{copy.detailBody}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{copy.benefitsEyebrow}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-4xl">{copy.benefitsLead}</h2>
            <ul className="mt-8 space-y-5">
              {copy.benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 border-s-2 border-gold/50 ps-4 text-sm leading-relaxed text-navy/75 sm:text-base">
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={2} />
                  {benefit}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* Added value */}
      <section className="bg-sand py-24 lg:py-32">
        <div className="container-luxe">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{copy.valueEyebrow}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{copy.valueTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{copy.valueLead}</p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {copy.values.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.08} className="border border-navy/10 bg-background p-8">
                <span className="font-display text-3xl text-gold">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="mt-5 text-xl text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="bg-background py-24 lg:py-32">
        <div className="container-luxe">
          <Reveal className="max-w-2xl">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{copy.galleryEyebrow}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{copy.galleryTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{copy.galleryLead}</p>
          </Reveal>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {galleryItems.map((item, index) => (
              <Reveal key={item.captionKey} delay={index * 0.07}>
                <figure className="group relative overflow-hidden">
                  <img
                    src={item.src}
                    alt={copy.gallery[item.captionKey] ?? copy.title}
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-navy/0 transition-colors duration-500 group-hover:bg-navy/55"
                  />
                  <figcaption className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm leading-relaxed text-white opacity-0 transition-all duration-500 group-hover:opacity-100 sm:text-base">
                    <span className="translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
                      {copy.gallery[item.captionKey] ?? copy.title}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#061525] py-20 lg:py-24">
        <div className="container-luxe flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <h2 className="font-display text-3xl text-white sm:text-4xl">{copy.startCta}</h2>
            <p className="mt-3 max-w-xl text-white/65">{copy.summary}</p>
          </div>
          <Link
            to="/contact"
            className="inline-flex items-center gap-3 border border-gold bg-gold px-8 py-4 text-[0.7rem] tracking-[0.2em] text-navy uppercase transition hover:bg-transparent hover:text-gold"
          >
            {copy.startCta}
            <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
