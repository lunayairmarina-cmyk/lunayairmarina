import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SeoForm } from "@/components/admin/SeoForm";
import { useLanguage } from "@/lib/i18n";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({
    meta: [
      { title: "SEO — lunayairmarina Admin" },
      { name: "description", content: "Manage SEO titles, descriptions and OG images." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSeoPage,
});

function AdminSeoPage() {
  const { t } = useLanguage();
  const { can } = useAdminAuth();

  if (!can("seo")) {
    return (
      <AdminLayout title={t("admin.nav.seo")}>
        <div className="rounded-2xl border border-navy/8 bg-white p-10 text-center shadow-sm">
          <Shield className="mx-auto size-8 text-gold" strokeWidth={1.4} />
          <p className="mt-4 text-navy">{t("admin.users.noAccess")}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t("admin.nav.seo")}>
      <p className="mb-6 max-w-2xl text-sm text-navy/55">{t("admin.seo.subtitle")}</p>
      <SeoForm />
    </AdminLayout>
  );
}
