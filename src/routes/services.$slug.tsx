import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/shared/Reveal";
import { useLanguage } from "@/lib/i18n";
import { getServiceBySlug, type ServiceDefinition } from "@/data/services";
import { localizeOrFallback, useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { buildServiceSeoHead } from "@/services/seoService";
import { useResolvedMediaSrc } from "@/hooks/useResolvedMediaSrc";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import type { ServiceContent } from "@/types/content";

export const Route = createFileRoute("/services/$slug")({
  loader: ({ params }) => ({
    slug: params.slug,
    staticDef: getServiceBySlug(params.slug),
  }),
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

function isPublished(remote?: ServiceContent) {
  if (!remote) return true;
  return (remote.details as { status?: string } | undefined)?.status !== "draft";
}

function buildCopyFromCms(
  remote: ServiceContent,
  language: "en" | "ar",
  t: (key: string) => string,
  localeFallback?: { title?: string; description?: string; features?: string[] },
): ServiceDetailCopy {
  const title = localizeOrFallback(remote.title, language, localeFallback?.title ?? "");
  const description = localizeOrFallback(
    remote.description,
    language,
    localeFallback?.description ?? "",
  );
  const features = remote.features
    .map((feature, index) =>
      localizeOrFallback(feature, language, localeFallback?.features?.[index] ?? ""),
    )
    .filter(Boolean);
  const benefits = features.length > 0 ? features : [description].filter(Boolean);

  return {
    title,
    intro: description,
    summary: description,
    meta: {
      investmentLabel: language === "ar" ? "الاستثمار" : "Investment",
      investmentValue: "—",
      galleryLabel: language === "ar" ? "المعرض" : "Gallery",
      galleryValue: String(remote.gallery?.length || 1),
      benefitsLabel: language === "ar" ? "المزايا" : "Benefits",
      benefitsValue: String(benefits.length),
      categoryLabel: language === "ar" ? "التصنيف" : "Category",
      categoryValue: language === "ar" ? "خدمة" : "Service",
    },
    startCta: t("services.cta"),
    exploreCta: language === "ar" ? "استكشف التفاصيل" : "Explore details",
    detailEyebrow: language === "ar" ? "التفاصيل" : "Details",
    detailTitle: title,
    detailBody: description,
    benefitsEyebrow: language === "ar" ? "المزايا" : "Benefits",
    benefitsLead: language === "ar" ? "ماذا تحصل عليه" : "What you get",
    benefits,
    valueEyebrow: language === "ar" ? "القيمة" : "Value",
    valueTitle: title,
    valueLead: description,
    values: benefits.slice(0, 3).map((item) => ({
      title: item,
      description: "",
    })),
    galleryEyebrow: language === "ar" ? "المعرض" : "Gallery",
    galleryTitle: language === "ar" ? "لمحات من الخدمة" : "Service glimpses",
    galleryLead: description,
    gallery: {},
  };
}

function ServiceDetailPage() {
  const { slug, staticDef } = Route.useLoaderData() as {
    slug: string;
    staticDef: ServiceDefinition | null;
  };
  const { t, tv, language } = useLanguage();
  const remote = useOptionalSiteContent()?.bundle?.services?.find((item) => item.slug === slug);
  const published = isPublished(remote);

  const fallbackCover = staticDef?.coverImage || remote?.image || "";
  const coverImage = useResolvedMediaSrc(remote?.image || staticDef?.coverImage, fallbackCover);
  const galleryItems =
    remote?.gallery && remote.gallery.length > 0
      ? remote.gallery.map((item, index) => ({
          src: item.src,
          captionKey: `g${index + 1}`,
        }))
      : (staticDef?.gallery ??
        (remote?.image
          ? [{ src: remote.image, captionKey: "g1" }]
          : fallbackCover
            ? [{ src: fallbackCover, captionKey: "g1" }]
            : []));

  const localeCopy = tv<ServiceDetailCopy | undefined>(`services.details.${slug}`);
  const localeListItem = (
    tv<Array<{ title: string; description: string; features: string[]; slug?: string }>>(
      "services.items",
    ) ?? []
  ).find((item) => item.slug === slug);
  const copy =
    localeCopy?.meta && Array.isArray(localeCopy.benefits) && Array.isArray(localeCopy.values)
      ? localeCopy
      : remote
        ? buildCopyFromCms(remote, language, t, localeListItem)
        : undefined;

  if ((!remote && !staticDef) || (remote && !published && !staticDef) || !copy) {
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
      <section className="relative overflow-hidden pt-12 pb-16 lg:pb-24">
        <div className="absolute inset-0">
          {coverImage ? (
            <img src={coverImage} alt="" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-navy" />
          )}
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
                  <div
                    key={label}
                    className="flex items-end justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"
                  >
                    <dt className="text-[0.65rem] tracking-[0.18em] text-white/50 uppercase">
                      {label}
                    </dt>
                    <dd className="text-sm font-medium text-gold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="details" className="bg-background py-24 lg:py-32">
        <div className="container-luxe grid gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {copy.detailEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-4xl">{copy.detailTitle}</h2>
            <span className="gold-rule mt-6" />
            <p className="mt-8 text-base leading-relaxed text-navy/80 sm:text-lg">
              {copy.detailBody}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {copy.benefitsEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-4xl">
              {copy.benefitsLead}
            </h2>
            <ul className="mt-8 space-y-5">
              {copy.benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-3 border-s-2 border-gold/50 ps-4 text-sm leading-relaxed text-navy/75 sm:text-base"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={2} />
                  {benefit}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section className="bg-sand py-24 lg:py-32">
        <div className="container-luxe">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {copy.valueEyebrow}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{copy.valueTitle}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{copy.valueLead}</p>
          </Reveal>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {copy.values.map((item, index) => (
              <Reveal
                key={item.title}
                delay={index * 0.08}
                className="border border-navy/10 bg-background p-8"
              >
                <span className="font-display text-3xl text-gold">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-5 text-xl text-navy">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {galleryItems.length > 0 ? (
        <section className="bg-background py-24 lg:py-32">
          <div className="container-luxe">
            <Reveal className="max-w-2xl">
              <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
                {copy.galleryEyebrow}
              </p>
              <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">
                {copy.galleryTitle}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                {copy.galleryLead}
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {galleryItems.map((item, index) => (
                <Reveal key={item.captionKey} delay={index * 0.07}>
                  <figure className="group relative overflow-hidden">
                    <ResolvedImage
                      src={item.src}
                      fallback={fallbackCover}
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
      ) : null}

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
