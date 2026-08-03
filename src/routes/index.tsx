import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Hero } from "@/components/site/Hero";
import { AboutSection } from "@/components/site/AboutSection";
import { ServicesSection } from "@/components/site/ServicesSection";
import { WhyChooseUs } from "@/components/site/WhyChooseUs";
import { TrustPlaceholders } from "@/components/site/TrustPlaceholders";
import { BlogSection } from "@/components/site/BlogSection";
import { GallerySection } from "@/components/site/GallerySection";
import { Testimonials } from "@/components/site/Testimonials";
import { FaqSection } from "@/components/site/FaqSection";
import { FleetSection } from "@/components/site/FleetSection";
import { TeamSection } from "@/components/site/TeamSection";
import { buildSeoHead } from "@/services/seoService";

export const Route = createFileRoute("/")({
  head: () => buildSeoHead("home", "/"),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteLayout>
      <Hero />
      <AboutSection variant="home" />
      <ServicesSection variant="home" />
      <WhyChooseUs variant="home" />
      <TrustPlaceholders />
      <FleetSection limit={3} />
      <TeamSection />
      <BlogSection limit={3} />
      <GallerySection limit={5} />
      <Testimonials />
      <FaqSection variant="home" />
    </SiteLayout>
  );
}
