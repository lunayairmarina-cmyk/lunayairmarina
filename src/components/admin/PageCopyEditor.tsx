import { useMemo, useState } from "react";
import { getCopyPath, loadCmsStore, setCopyPath } from "@/lib/cms-store";
import { describeSaveResult, saveCopyBundle } from "@/services/adminCmsService";
import { useLanguage } from "@/lib/i18n";
import enLocale from "@/locales/en.json";
import arLocale from "@/locales/ar.json";
import { cn } from "@/lib/utils";

type Field = { path: string; label: string; textarea?: boolean };
type Section = { id: string; labelKey: string; fields: Field[] };

const SECTIONS: Section[] = [
  {
    id: "brand",
    labelKey: "admin.pages.sections.brand",
    fields: [
      { path: "brand.name", label: "Brand name" },
      { path: "brand.tagline", label: "Tagline" },
    ],
  },
  {
    id: "nav",
    labelKey: "admin.pages.sections.nav",
    fields: [
      { path: "nav.home", label: "Home" },
      { path: "nav.about", label: "About" },
      { path: "nav.services", label: "Services" },
      { path: "nav.blog", label: "Blog" },
      { path: "nav.application", label: "Application" },
      { path: "nav.gallery", label: "Gallery" },
      { path: "nav.contact", label: "Contact" },
      { path: "nav.cta", label: "CTA" },
    ],
  },
  {
    id: "hero",
    labelKey: "admin.pages.sections.hero",
    fields: [
      { path: "hero.eyebrow", label: "Eyebrow" },
      { path: "hero.title", label: "Title", textarea: true },
      { path: "hero.subtitle", label: "Subtitle", textarea: true },
      { path: "hero.primary", label: "Primary CTA" },
      { path: "hero.secondary", label: "Secondary CTA" },
      { path: "hero.scroll", label: "Scroll label" },
    ],
  },
  {
    id: "about",
    labelKey: "admin.pages.sections.about",
    fields: [
      { path: "about.eyebrow", label: "Eyebrow" },
      { path: "about.title", label: "Title", textarea: true },
      { path: "about.lead", label: "Lead", textarea: true },
      { path: "about.body", label: "Body", textarea: true },
      { path: "about.cta", label: "CTA" },
      { path: "about.pageTitle", label: "About page title", textarea: true },
      { path: "about.pageSubtitle", label: "About page subtitle", textarea: true },
      { path: "about.story.eyebrow", label: "Story eyebrow" },
      { path: "about.story.title", label: "Story title", textarea: true },
      { path: "about.story.body", label: "Story body", textarea: true },
      { path: "about.mission.eyebrow", label: "Mission eyebrow" },
      { path: "about.mission.body", label: "Mission body", textarea: true },
      { path: "about.vision.eyebrow", label: "Vision eyebrow" },
      { path: "about.vision.body", label: "Vision body", textarea: true },
      { path: "about.valuesTitle", label: "Values title", textarea: true },
      { path: "about.valuesLead", label: "Values lead", textarea: true },
      { path: "about.clients.eyebrow", label: "Clients eyebrow" },
      { path: "about.clients.title", label: "Clients title", textarea: true },
      { path: "about.clients.body", label: "Clients body", textarea: true },
      { path: "about.clients.quote", label: "Clients quote", textarea: true },
      { path: "about.ctaBand.eyebrow", label: "CTA band eyebrow" },
      { path: "about.ctaBand.title", label: "CTA band title", textarea: true },
      { path: "about.ctaBand.body", label: "CTA band body", textarea: true },
      { path: "about.ctaBand.button", label: "CTA band button" },
    ],
  },
  {
    id: "services",
    labelKey: "admin.pages.sections.services",
    fields: [
      { path: "services.eyebrow", label: "Eyebrow" },
      { path: "services.title", label: "Title", textarea: true },
      { path: "services.subtitle", label: "Subtitle", textarea: true },
      { path: "services.viewAll", label: "View all" },
      { path: "services.cta", label: "CTA" },
    ],
  },
  {
    id: "why",
    labelKey: "admin.pages.sections.why",
    fields: [
      { path: "why.eyebrow", label: "Eyebrow" },
      { path: "why.title", label: "Title", textarea: true },
    ],
  },
  {
    id: "trust",
    labelKey: "admin.pages.sections.trust",
    fields: [
      { path: "trust.eyebrow", label: "Eyebrow" },
      { path: "trust.title", label: "Title", textarea: true },
      { path: "trust.lead", label: "Lead", textarea: true },
      { path: "trust.cta", label: "CTA" },
    ],
  },
  {
    id: "gallery",
    labelKey: "admin.pages.sections.gallery",
    fields: [
      { path: "gallery.eyebrow", label: "Eyebrow" },
      { path: "gallery.title", label: "Title", textarea: true },
      { path: "gallery.subtitle", label: "Subtitle", textarea: true },
      { path: "gallery.viewAll", label: "View all" },
    ],
  },
  {
    id: "fleet",
    labelKey: "admin.pages.sections.fleet",
    fields: [
      { path: "fleet.eyebrow", label: "Eyebrow" },
      { path: "fleet.title", label: "Title", textarea: true },
      { path: "fleet.subtitle", label: "Subtitle", textarea: true },
      { path: "fleet.viewAll", label: "View all" },
    ],
  },
  {
    id: "testimonials",
    labelKey: "admin.pages.sections.testimonials",
    fields: [
      { path: "testimonials.eyebrow", label: "Eyebrow" },
      { path: "testimonials.title", label: "Title", textarea: true },
      { path: "testimonials.subtitle", label: "Subtitle", textarea: true },
    ],
  },
  {
    id: "faq",
    labelKey: "admin.pages.sections.faq",
    fields: [
      { path: "faq.eyebrow", label: "Eyebrow" },
      { path: "faq.title", label: "Title", textarea: true },
      { path: "faq.subtitle", label: "Subtitle", textarea: true },
    ],
  },
  {
    id: "blog",
    labelKey: "admin.pages.sections.blog",
    fields: [
      { path: "blog.eyebrow", label: "Eyebrow" },
      { path: "blog.title", label: "Title", textarea: true },
      { path: "blog.subtitle", label: "Subtitle", textarea: true },
      { path: "blog.viewAll", label: "View all" },
      { path: "blog.readMore", label: "Read more" },
      { path: "blog.empty", label: "Empty state" },
    ],
  },
  {
    id: "contact",
    labelKey: "admin.pages.sections.contact",
    fields: [
      { path: "contact.eyebrow", label: "Eyebrow" },
      { path: "contact.title", label: "Title", textarea: true },
      { path: "contact.subtitle", label: "Subtitle", textarea: true },
      { path: "contact.info.title", label: "Info title" },
      { path: "contact.info.subtitle", label: "Info subtitle", textarea: true },
      { path: "contact.formSection.title", label: "Form title", textarea: true },
      { path: "contact.pathways.title", label: "Pathways title", textarea: true },
      { path: "contact.pathways.visit.title", label: "Pathway visit title" },
      { path: "contact.pathways.visit.body", label: "Pathway visit body", textarea: true },
      { path: "contact.pathways.visit.cta", label: "Pathway visit CTA" },
      { path: "contact.pathways.emergency.title", label: "Pathway emergency title" },
      { path: "contact.pathways.emergency.body", label: "Pathway emergency body", textarea: true },
      { path: "contact.pathways.emergency.cta", label: "Pathway emergency CTA" },
      { path: "contact.pathways.charter.title", label: "Pathway charter title" },
      { path: "contact.pathways.charter.body", label: "Pathway charter body", textarea: true },
      { path: "contact.pathways.charter.cta", label: "Pathway charter CTA" },
      { path: "contact.lounge.eyebrow", label: "Lounge eyebrow" },
      { path: "contact.lounge.title", label: "Lounge title", textarea: true },
      { path: "contact.lounge.body", label: "Lounge body", textarea: true },
    ],
  },
  {
    id: "whatsapp",
    labelKey: "admin.pages.sections.whatsapp",
    fields: [
      { path: "whatsapp.label", label: "Label" },
      { path: "whatsapp.prefill", label: "Prefill message", textarea: true },
    ],
  },
  {
    id: "application",
    labelKey: "admin.pages.sections.application",
    fields: [
      { path: "application.hero.eyebrow", label: "Hero eyebrow" },
      { path: "application.hero.title", label: "Hero title", textarea: true },
      { path: "application.hero.description", label: "Hero description", textarea: true },
      { path: "application.hero.ask", label: "Ask CTA" },
      { path: "application.hero.appStore", label: "App Store label" },
      { path: "application.hero.googlePlay", label: "Google Play label" },
      { path: "application.overview.eyebrow", label: "Overview eyebrow" },
      { path: "application.overview.title", label: "Overview title", textarea: true },
      { path: "application.tanks.eyebrow", label: "Tanks eyebrow" },
      { path: "application.tanks.title", label: "Tanks title", textarea: true },
      { path: "application.tanks.description", label: "Tanks description", textarea: true },
      { path: "application.checklist.eyebrow", label: "Checklist eyebrow" },
      { path: "application.checklist.title", label: "Checklist title", textarea: true },
      { path: "application.checklist.description", label: "Checklist description", textarea: true },
      { path: "application.services.eyebrow", label: "Services eyebrow" },
      { path: "application.services.title", label: "Services title", textarea: true },
      { path: "application.services.description", label: "Services description", textarea: true },
    ],
  },
  {
    id: "footer",
    labelKey: "admin.pages.sections.footer",
    fields: [
      { path: "footer.description", label: "Description", textarea: true },
      { path: "footer.services", label: "Services heading" },
      { path: "footer.links", label: "Links heading" },
      { path: "footer.contact", label: "Contact heading" },
      { path: "footer.rights", label: "Rights" },
      { path: "footer.admin", label: "Admin link label" },
    ],
  },
];

function readString(dict: Record<string, unknown>, path: string): string {
  const value = getCopyPath(dict, path);
  return typeof value === "string" ? value : "";
}

export function PageCopyEditor() {
  const { t } = useLanguage();
  const baseCopy = useMemo(() => {
    const cms = loadCmsStore();
    return {
      en: {
        ...(enLocale as Record<string, unknown>),
        ...(cms.copy?.en ?? {}),
      },
      ar: {
        ...(arLocale as Record<string, unknown>),
        ...(cms.copy?.ar ?? {}),
      },
    };
  }, []);

  const [copy, setCopy] = useState(baseCopy);
  const [sectionId, setSectionId] = useState(SECTIONS[0]!.id);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const section = SECTIONS.find((item) => item.id === sectionId) ?? SECTIONS[0]!;
  const visibleSections = SECTIONS.filter((item) => {
    if (!filter.trim()) return true;
    const label = t(item.labelKey).toLowerCase();
    return label.includes(filter.trim().toLowerCase()) || item.id.includes(filter.trim().toLowerCase());
  });

  const setField = (language: "en" | "ar", path: string, value: string) => {
    setCopy((current) => setCopyPath(current, language, path, value));
  };

  const save = async () => {
    setSaving(true);
    const result = await saveCopyBundle(copy);
    setStatus(
      describeSaveResult(result, {
        synced: t("admin.cms.savedSynced"),
        local: t("admin.cms.savedLocal"),
      }),
    );
    setSaving(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="rounded-2xl border border-navy/8 bg-white p-3 shadow-sm">
        <p className="px-2 py-2 text-[0.6rem] tracking-[0.22em] text-navy/45 uppercase">
          {t("admin.pages.sectionsLabel")}
        </p>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder={t("admin.search")}
          className="mb-2 w-full rounded-lg border border-navy/10 bg-[#faf8f4] px-3 py-2 text-xs outline-none focus:border-navy/30"
        />
        <ul className="admin-hide-scrollbar max-h-[70vh] space-y-1 overflow-y-auto">
          {visibleSections.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSectionId(item.id)}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                  sectionId === item.id
                    ? "bg-navy text-white"
                    : "text-navy/65 hover:bg-[#faf8f4] hover:text-navy",
                )}
              >
                {t(item.labelKey)}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl text-navy">{t(section.labelKey)}</h3>
            <p className="mt-1 text-sm text-navy/55">{t("admin.pages.hint")}</p>
          </div>
          <div className="flex items-center gap-3">
            {status ? <span className="text-xs text-navy/55">{status}</span> : null}
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90 disabled:opacity-60"
            >
              {t("admin.content.save")}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {section.fields.map((field) => (
            <div key={field.path} className="grid gap-4 lg:grid-cols-2">
              {(["en", "ar"] as const).map((language) => (
                <label key={language} className="flex flex-col gap-2">
                  <span className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase">
                    {field.label} · {language.toUpperCase()}
                  </span>
                  {field.textarea ? (
                    <textarea
                      rows={3}
                      value={readString(copy[language], field.path)}
                      onChange={(event) => setField(language, field.path, event.target.value)}
                      className="rounded-md border border-navy/10 bg-[#faf8f4] px-4 py-3 text-sm outline-none transition-colors focus:border-navy/30"
                      dir={language === "ar" ? "rtl" : "ltr"}
                    />
                  ) : (
                    <input
                      value={readString(copy[language], field.path)}
                      onChange={(event) => setField(language, field.path, event.target.value)}
                      className="rounded-md border border-navy/10 bg-[#faf8f4] px-4 py-3 text-sm outline-none transition-colors focus:border-navy/30"
                      dir={language === "ar" ? "rtl" : "ltr"}
                    />
                  )}
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
