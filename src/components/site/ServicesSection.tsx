import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { staggerContainer, staggerItem } from "@/components/shared/Reveal";
import { getServiceBySlug } from "@/data/services";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import type { ServiceContent } from "@/types/content";

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  features: string[];
  slug: string;
  image?: string;
}

function isPublishedService(item: ServiceContent) {
  const status = (item.details as { status?: string } | undefined)?.status;
  return status !== "draft";
}

export function ServicesSection({
  variant = "home",
  detailed = false,
}: {
  variant?: "home" | "page";
  detailed?: boolean;
}) {
  const { t, tv, language } = useLanguage();
  const remote = useOptionalSiteContent()?.bundle?.services ?? [];
  const items: ServiceItem[] =
    remote.length > 0
      ? remote
          .filter(isPublishedService)
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item) => ({
            id: item.id,
            title: localizeValue(item.title, language),
            description: localizeValue(item.description, language),
            features: item.features.map((f) => localizeValue(f, language)),
            slug: item.slug,
            image: item.image,
          }))
      : (tv<Array<{ title: string; description: string; features: string[]; slug?: string }>>(
          "services.items",
        ) ?? []).map((item, index) => ({
          id: item.slug ?? `locale-${index}`,
          title: item.title,
          description: item.description,
          features: item.features,
          slug: item.slug ?? `service-${index + 1}`,
          image: undefined,
        }));
  const isPage = variant === "page" || detailed;

  if (!isPage) {
    return (
      <section className="border-y border-gold/15 bg-gradient-to-br from-[#061321] via-navy to-ocean py-24 lg:py-32">
        <div className="container-luxe">
          <SectionHeading
            eyebrow={t("services.eyebrow")}
            title={t("services.title")}
            subtitle={t("services.subtitle")}
            tone="dark"
            align="start"
          />

          <motion.ol
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="mt-14 divide-y divide-navy-foreground/10 border-y border-navy-foreground/10"
          >
            {items.map((item, index) => (
              <motion.li key={item.id || item.slug} variants={staggerItem}>
                <Link
                  to="/services/$slug"
                  params={{ slug: item.slug }}
                  className="group grid gap-4 py-8 sm:grid-cols-[5rem_1fr_auto] sm:items-center sm:gap-8"
                >
                  <span className="font-display text-3xl text-gold/80 transition-colors group-hover:text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl text-navy-foreground sm:text-2xl">{item.title}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-foreground/60 sm:text-base">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight
                    className="hidden size-5 text-gold/50 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-gold sm:block rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    strokeWidth={1.4}
                  />
                </Link>
              </motion.li>
            ))}
          </motion.ol>

          <div className="mt-12">
            <Link
              to="/services"
              className="inline-flex border border-gold bg-gold px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy uppercase transition-all duration-500 hover:bg-transparent hover:text-gold"
            >
              {t("services.viewAll")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="container-luxe">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:gap-8"
        >
          {items.map((item, index) => {
            const staticCover = getServiceBySlug(item.slug)?.coverImage;
            const cover = item.image || staticCover;

            return (
              <motion.article
                key={item.id || item.slug}
                variants={staggerItem}
                className="group flex flex-col overflow-hidden border border-navy/12 bg-[#fbfaf8] transition-colors duration-500 hover:border-gold/45"
              >
                <Link
                  to="/services/$slug"
                  params={{ slug: item.slug }}
                  className="relative block aspect-[16/10] overflow-hidden bg-navy"
                >
                  {cover ? (
                    <ResolvedImage
                      src={cover}
                      fallback={staticCover}
                      alt=""
                      className="absolute inset-0 size-full object-cover object-[center_45%]"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-transparent" />
                  <span className="absolute bottom-3 start-3 font-display text-2xl tracking-[0.08em] text-white/90 sm:text-3xl">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </Link>

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="type-display-s text-navy transition-colors group-hover:text-gold">
                    {item.title}
                  </h3>
                  <p className="type-body-sm mt-3 line-clamp-3 text-muted-foreground">
                    {item.description}
                  </p>

                  <ul className="mt-5 space-y-2.5 border-t border-navy/8 pt-5">
                    {item.features.slice(0, 3).map((feature) => (
                      <li key={feature} className="type-body-sm flex items-start gap-2.5 text-navy/70">
                        <span className="mt-1.5 size-1.5 shrink-0 bg-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/services/$slug"
                    params={{ slug: item.slug }}
                    className="type-cta mt-7 inline-flex w-fit items-center gap-2 border-b border-navy/15 pb-1.5 text-navy transition-colors hover:border-gold hover:text-gold"
                  >
                    {t("services.cta")}
                    <ArrowRight
                      className="size-3.5 transition-transform duration-500 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      strokeWidth={1.5}
                    />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
