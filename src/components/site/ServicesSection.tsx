import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Anchor, ArrowRight, Ship, UsersRound, Waves } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { staggerContainer, staggerItem } from "@/components/shared/Reveal";
import { SERVICE_SLUGS, type ServiceSlug } from "@/data/services";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";

interface ServiceItem {
  title: string;
  description: string;
  features: string[];
  slug?: string;
}

const icons = [Ship, Anchor, Waves, UsersRound];

function resolveSlug(item: ServiceItem, index: number): ServiceSlug {
  const candidate = item.slug ?? SERVICE_SLUGS[index];
  return (SERVICE_SLUGS.includes(candidate as ServiceSlug)
    ? candidate
    : SERVICE_SLUGS[index]) as ServiceSlug;
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
      ? remote.map((item) => ({
          title: localizeValue(item.title, language),
          description: localizeValue(item.description, language),
          features: item.features.map((f) => localizeValue(f, language)),
          slug: item.slug,
        }))
      : (tv<ServiceItem[]>("services.items") ?? []);
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
            {items.map((item, index) => {
              const slug = resolveSlug(item, index);
              return (
                <motion.li key={slug} variants={staggerItem}>
                  <Link
                    to="/services/$slug"
                    params={{ slug }}
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
              );
            })}
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
    <section className="bg-background py-24 lg:py-32">
      <div className="container-luxe">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid gap-8 sm:grid-cols-2"
        >
          {items.map((item, index) => {
            const Icon = icons[index % icons.length];
            const slug = resolveSlug(item, index);
            return (
              <motion.div key={slug} variants={staggerItem}>
                <Link
                  to="/services/$slug"
                  params={{ slug }}
                  className="group flex h-full flex-col border-b border-navy/10 pb-10 transition-colors hover:border-gold/50"
                >
                  <span className="grid size-11 place-items-center border border-gold/50 text-gold transition-colors duration-500 group-hover:bg-gold group-hover:text-navy">
                    <Icon className="size-5" strokeWidth={1.35} />
                  </span>

                  <h3 className="mt-8 font-display text-2xl text-navy transition-colors group-hover:text-gold sm:text-[1.65rem]">
                    {item.title}
                  </h3>
                  <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.description}
                  </p>

                  <ul className="mt-7 space-y-3">
                    {item.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-navy/70">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <span className="mt-8 inline-flex items-center gap-2 text-[0.7rem] tracking-[0.2em] text-navy uppercase transition-colors group-hover:text-gold">
                    {t("services.cta")}
                    <ArrowRight
                      className="size-3.5 transition-transform duration-500 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      strokeWidth={1.5}
                    />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
