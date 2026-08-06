import { Link, createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { ServicesSection } from "@/components/site/ServicesSection";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { FaqSection } from "@/components/site/FaqSection";
import { Reveal } from "@/components/shared/Reveal";
import { useLanguage } from "@/lib/i18n";
import { buildSeoHead } from "@/services/seoService";
import { usePageHeaderImage } from "@/hooks/usePageHeaderImage";
import servicesHeader from "@/assets/headers/header-services.jpg";

export const Route = createFileRoute("/services/")({
  head: () => buildSeoHead("services", "/services"),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useLanguage();
  const headerImage = usePageHeaderImage("services", servicesHeader);
  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("services.eyebrow")}
        title={t("services.title")}
        subtitle={t("services.subtitle")}
        image={headerImage}
        imagePosition="50% 45%"
      />
      <ServicesSection variant="page" />
      <WhyChooseUs variant="home" />
      <FaqSection />

      <section className="border-t border-border bg-sand py-16 sm:py-20 lg:py-24">
        <div className="container-luxe flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center lg:gap-12">
          <Reveal>
            <p className="eyebrow">{t("contact.eyebrow")}</p>
            <h2 className="type-display-m mt-3 max-w-xl text-navy sm:mt-3">
              {t("about.ctaBand.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Link
              to="/contact"
              className="type-cta inline-flex shrink-0 border border-navy bg-navy px-7 py-3.5 text-navy-foreground transition hover:border-gold hover:bg-gold hover:text-navy sm:px-8 sm:py-4"
            >
              {t("about.ctaBand.button")}
            </Link>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
