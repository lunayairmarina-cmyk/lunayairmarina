import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ModalField } from "@/components/admin/Modal";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";
import { saveAbout, saveHomepage, type SaveResult } from "@/services/adminCmsService";
import type { AboutContent, HomepageContent } from "@/types/content";
import heroImage from "@/assets/hero-yacht.jpg";
import aboutImage from "@/assets/about-marina.jpg";

export const Route = createFileRoute("/admin/content")({
  head: () => ({
    meta: [
      { title: "Website Content — lunayairmarina Admin" },
      { name: "description", content: "Edit hero and about section content." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ContentPage,
});

function ContentPage() {
  const { t, language } = useLanguage();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const defaults = useMemo(() => {
    const cms = loadCmsStore();
    const homepage: HomepageContent = cms.homepage ?? {
      heroTitle: { en: t("hero.title"), ar: t("hero.title") },
      heroDescription: { en: t("hero.subtitle"), ar: t("hero.subtitle") },
      heroEyebrow: { en: t("hero.eyebrow"), ar: t("hero.eyebrow") },
      heroVideo: "/videos/lunayair.mp4",
      heroImage,
      primaryCTA: { en: t("hero.primary"), ar: t("hero.primary") },
      secondaryCTA: { en: t("hero.secondary"), ar: t("hero.secondary") },
      scrollLabel: { en: t("hero.scroll"), ar: t("hero.scroll") },
    };
    const about: AboutContent = cms.about ?? {
      title: { en: t("about.title"), ar: t("about.title") },
      description: { en: t("about.lead"), ar: t("about.lead") },
      lead: { en: t("about.lead"), ar: t("about.lead") },
      body: { en: t("about.body"), ar: t("about.body") },
      eyebrow: { en: t("about.eyebrow"), ar: t("about.eyebrow") },
      mission: { en: t("about.mission.body"), ar: t("about.mission.body") },
      vision: { en: t("about.vision.body"), ar: t("about.vision.body") },
      values: [],
      image: aboutImage,
      points: [],
      stats: [
        { value: 42, suffix: "", label: { en: "Yachts", ar: "يخوت" } },
        { value: 78, suffix: "", label: { en: "Partners", ar: "شركاء" } },
        { value: 13, suffix: "", label: { en: "Minutes", ar: "دقائق" } },
      ],
    };
    return { homepage, about };
  }, [t]);

  const [homepage, setHomepage] = useState(defaults.homepage);
  const [about, setAbout] = useState(defaults.about);

  useEffect(() => {
    setHomepage(defaults.homepage);
    setAbout(defaults.about);
  }, [defaults]);

  const setLocalized = <T extends HomepageContent | AboutContent>(
    current: T,
    key: keyof T,
    value: string,
  ): T => {
    const existing = current[key];
    if (existing && typeof existing === "object" && "en" in (existing as object)) {
      const localized = existing as unknown as { en: string; ar: string };
      return {
        ...current,
        [key]: { ...localized, [language]: value },
      };
    }
    return current;
  };

  const save = async () => {
    setBusy(true);
    setStatus(null);
    const results: SaveResult[] = await Promise.all([
      saveHomepage(homepage),
      saveAbout(about),
    ]);
    const synced = results.every((item) => item.ok && item.sync === "synced");
    setStatus(synced ? t("admin.cms.savedSynced") : t("admin.cms.savedLocal"));
    setBusy(false);
  };

  return (
    <AdminLayout title={t("admin.content.title")}>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg text-navy">{t("admin.content.hero")}</h2>
          <div className="mt-6 flex flex-col gap-5">
            <ModalField
              label="Eyebrow"
              value={homepage.heroEyebrow[language]}
              onChange={(value) => setHomepage(setLocalized(homepage, "heroEyebrow", value))}
            />
            <ModalField
              label={t("admin.content.heroTitle")}
              value={homepage.heroTitle[language]}
              onChange={(value) => setHomepage(setLocalized(homepage, "heroTitle", value))}
            />
            <ModalField
              textarea
              label={t("admin.content.heroDescription")}
              value={homepage.heroDescription[language]}
              onChange={(value) => setHomepage(setLocalized(homepage, "heroDescription", value))}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <ModalField
                label={t("admin.content.primaryButton")}
                value={homepage.primaryCTA[language]}
                onChange={(value) => setHomepage(setLocalized(homepage, "primaryCTA", value))}
              />
              <ModalField
                label={t("admin.content.secondaryButton")}
                value={homepage.secondaryCTA[language]}
                onChange={(value) => setHomepage(setLocalized(homepage, "secondaryCTA", value))}
              />
            </div>
            <ModalField
              label="Scroll label"
              value={homepage.scrollLabel[language]}
              onChange={(value) => setHomepage(setLocalized(homepage, "scrollLabel", value))}
            />
            <ModalField
              label="Hero video URL"
              value={homepage.heroVideo}
              onChange={(value) => setHomepage({ ...homepage, heroVideo: value })}
            />
            <MediaUploader
              label={t("admin.content.background")}
              value={homepage.heroImage}
              pathPrefix="images/hero"
              onChange={(url) => setHomepage({ ...homepage, heroImage: url })}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
          <h2 className="font-display text-lg text-navy">{t("admin.content.about")}</h2>
          <div className="mt-6 flex flex-col gap-5">
            <ModalField
              label={t("admin.content.heroTitle")}
              value={about.title[language]}
              onChange={(value) => setAbout(setLocalized(about, "title", value))}
            />
            <ModalField
              textarea
              label={t("admin.content.heroDescription")}
              value={about.lead[language]}
              onChange={(value) =>
                setAbout({
                  ...about,
                  lead: { ...about.lead, [language]: value },
                  description: { ...about.description, [language]: value },
                })
              }
            />
            <ModalField
              textarea
              label="Body"
              value={about.body[language]}
              onChange={(value) => setAbout(setLocalized(about, "body", value))}
            />
            <ModalField
              textarea
              label="Mission"
              value={about.mission[language]}
              onChange={(value) => setAbout(setLocalized(about, "mission", value))}
            />
            <ModalField
              textarea
              label="Vision"
              value={about.vision[language]}
              onChange={(value) => setAbout(setLocalized(about, "vision", value))}
            />
            <ModalField
              textarea
              label="Points (one per line)"
              value={about.points.map((point) => point[language] || point.en).join("\n")}
              onChange={(value) => {
                const lines = value
                  .split("\n")
                  .map((line) => line.trim())
                  .filter(Boolean);
                setAbout({
                  ...about,
                  points: lines.map((line, index) => {
                    const existing = about.points[index];
                    return existing
                      ? { ...existing, [language]: line }
                      : { en: line, ar: line };
                  }),
                });
              }}
            />
            <MediaUploader
              label={t("admin.table.image")}
              value={about.image}
              pathPrefix="images/about"
              onChange={(url) => setAbout({ ...about, image: url })}
            />
            <p className="text-[0.6rem] tracking-[0.22em] text-navy/40 uppercase">
              {t("admin.content.statistics")}
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {about.stats.map((stat, index) => (
                <div key={index} className="space-y-3">
                  <ModalField
                    label={`Value 0${index + 1}`}
                    value={String(stat.value)}
                    onChange={(value) => {
                      const stats = [...about.stats];
                      stats[index] = { ...stat, value: Number(value) || 0 };
                      setAbout({ ...about, stats });
                    }}
                  />
                  <ModalField
                    label={`Label 0${index + 1}`}
                    value={stat.label[language]}
                    onChange={(value) => {
                      const stats = [...about.stats];
                      stats[index] = {
                        ...stat,
                        label: { ...stat.label, [language]: value },
                      };
                      setAbout({ ...about, stats });
                    }}
                  />
                </div>
              ))}
            </div>
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
