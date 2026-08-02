import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ModalField } from "@/components/admin/Modal";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";
import {
  defaultSettingsFromMock,
  describeSaveResult,
  saveSettings,
} from "@/services/adminCmsService";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — lunayairmarina Admin" },
      { name: "description", content: "Manage company details and social links." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { t, language } = useLanguage();
  const initial = useMemo(() => {
    const cms = loadCmsStore();
    return {
      settings: cms.settings ?? defaultSettingsFromMock(),
      logoUrl: cms.logoUrl ?? "",
    };
  }, []);

  const [settings, setSettings] = useState(initial.settings);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const result = await saveSettings(settings, logoUrl || undefined);
    setStatus(
      describeSaveResult(result, {
        synced: t("admin.cms.savedSynced"),
        local: t("admin.cms.savedLocal"),
      }),
    );
    setBusy(false);
  };

  return (
    <AdminLayout title={t("admin.settings.title")}>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg text-navy">{t("admin.settings.general")}</h2>
          <div className="mt-6">
            <MediaUploader
              label={t("admin.settings.logo")}
              value={logoUrl}
              pathPrefix="images/brand"
              onChange={setLogoUrl}
            />
          </div>
          <div className="mt-6 flex flex-col gap-5">
            <ModalField
              label={t("admin.settings.companyName")}
              value={settings.companyName}
              onChange={(value) => setSettings({ ...settings, companyName: value })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ModalField
                label={t("admin.settings.phone")}
                value={settings.phoneDisplay}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    phoneDisplay: value,
                    phone: value.replace(/\s/g, ""),
                  })
                }
              />
              <ModalField
                label="WhatsApp"
                value={settings.whatsapp}
                onChange={(value) => setSettings({ ...settings, whatsapp: value })}
              />
            </div>
            <ModalField
              label={t("admin.settings.email")}
              value={settings.email}
              onChange={(value) => setSettings({ ...settings, email: value })}
            />
            <ModalField
              textarea
              label={t("admin.settings.address")}
              value={settings.address[language]}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  address: { ...settings.address, [language]: value },
                })
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg text-navy">{t("admin.settings.social")}</h2>
          <div className="mt-6 flex flex-col gap-5">
            <ModalField
              label="Instagram"
              value={settings.socialLinks.instagram}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, instagram: value },
                })
              }
            />
            <ModalField
              label="LinkedIn"
              value={settings.socialLinks.linkedin}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, linkedin: value },
                })
              }
            />
            <ModalField
              label="Facebook"
              value={settings.socialLinks.facebook}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, facebook: value },
                })
              }
            />
            <ModalField
              label="YouTube"
              value={settings.socialLinks.youtube}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, youtube: value },
                })
              }
            />
          </div>
        </section>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-full bg-navy px-6 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90 disabled:opacity-60"
        >
          {t("admin.content.save")}
        </button>
        {status ? <span className="text-xs text-navy/60">{status}</span> : null}
      </div>
    </AdminLayout>
  );
}
