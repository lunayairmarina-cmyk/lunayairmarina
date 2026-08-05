import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ApplicationSections } from "@/components/application/ApplicationSections";
import { buildSeoHead } from "@/services/seoService";

export const Route = createFileRoute("/application")({
  head: () => {
    const seo = buildSeoHead("application", "/application");
    return {
      ...seo,
      meta: [...seo.meta, { name: "robots", content: "index,follow" }],
    };
  },
  component: ApplicationPage,
});

function ApplicationPage() {
  return (
    <SiteLayout>
      <ApplicationSections />
    </SiteLayout>
  );
}
