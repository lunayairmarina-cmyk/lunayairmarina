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
import servicesHeader from "@/assets/yacht-2.jpg";

export const Route = createFileRoute("/services/")({
  head: () => buildSeoHead("services", "/services"),
  component: ServicesPage,
});

function ServicesPage() {
  const { t } = useLanguage();
  const headerImage = usePageHeaderImage("services", servicesHeader);
  return (
    <SiteLayout transparentNav>
      <PageHeader
        eyebrow={t("services.eyebrow")}
        title={t("services.title")}
        subtitle={t("services.subtitle")}
        image={headerImage}
        crumb={t("nav.services")}
      />
      <ServicesSection variant="page" />
      <WhyChooseUs />
      <FaqSection />

      {/* Light CTA instead of full contact form */}
      <section className="border-t border-border bg-background py-20 lg:py-24">
        <div className="container-luxe flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <Reveal>
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("contact.eyebrow")}</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl text-navy sm:text-4xl">
              {t("about.ctaBand.title")}
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <Link
              to="/contact"
              className="inline-flex border border-navy bg-navy px-8 py-4 text-[0.7rem] tracking-[0.2em] text-navy-foreground uppercase transition hover:border-gold hover:bg-gold hover:text-navy"
            >
              {t("about.ctaBand.button")}
            </Link>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}
