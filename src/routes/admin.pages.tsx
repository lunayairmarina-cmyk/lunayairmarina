import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageCopyEditor } from "@/components/admin/PageCopyEditor";
import { useLanguage } from "@/lib/i18n";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({
  head: () => ({
    meta: [
      { title: "Pages & Copy — lunayairmarina Admin" },
      { name: "description", content: "Edit bilingual page copy across the site." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPagesPage,
});

function AdminPagesPage() {
  const { t } = useLanguage();
  const { can } = useAdminAuth();

  if (!can("pages")) {
    return (
      <AdminLayout title={t("admin.nav.pages")}>
        <div className="rounded-2xl border border-navy/8 bg-white p-10 text-center shadow-sm">
          <Shield className="mx-auto size-8 text-gold" strokeWidth={1.4} />
          <p className="mt-4 text-navy">{t("admin.users.noAccess")}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t("admin.nav.pages")}>
      <p className="mb-6 max-w-2xl text-sm text-navy/55">{t("admin.pages.subtitle")}</p>
      <PageCopyEditor />
    </AdminLayout>
  );
}
