import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLanguage } from "@/lib/i18n";
import { galleryImages } from "@/data/mock";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveGallery, uploadMediaFile } from "@/services/adminCmsService";
import type { GalleryContent } from "@/types/content";

export const Route = createFileRoute("/admin/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — lunayairmarina Admin" },
      { name: "description", content: "Manage gallery images." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminGalleryPage,
});

function AdminGalleryPage() {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = useMemo<GalleryContent[]>(() => {
    const cms = loadCmsStore();
    if (cms.gallery.length) return cms.gallery;
    return galleryImages.map((item, index) => ({
      id: item.id,
      src: item.src,
      caption: item.caption,
      span: item.span,
      order: index + 1,
    }));
  }, []);
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState<string | null>(null);

  const persist = async (next: GalleryContent[]) => {
    setItems(next);
    const result = await saveGallery(next);
    setStatus(
      describeSaveResult(result, {
        synced: t("admin.cms.savedSynced"),
        local: t("admin.cms.savedLocal"),
      }),
    );
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    const url = await uploadMediaFile(file, "images/gallery");
    const item: GalleryContent = {
      id: `g${Date.now()}`,
      src: url,
      caption: { en: file.name, ar: file.name },
      span: "normal",
      order: items.length + 1,
    };
    await persist([...items, item]);
  };

  return (
    <AdminLayout title={t("admin.nav.gallery")}>
      <div className="mb-6 flex items-center justify-between gap-3">
        {status ? <span className="text-xs text-navy/55">{status}</span> : <span />}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90"
        >
          <Upload className="size-4" strokeWidth={1.5} />
          {t("admin.actions.upload")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void onUpload(event.target.files?.[0])}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((image, index) => (
          <motion.figure
            key={image.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            className="group relative overflow-hidden rounded-2xl border border-navy/8 bg-white shadow-sm"
          >
            <img
              src={image.src}
              alt={image.caption[language]}
              loading="lazy"
              className="aspect-4/3 w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <figcaption className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-navy/70">
              <span className="truncate">{image.caption[language]}</span>
              <button
                type="button"
                aria-label={t("admin.actions.delete")}
                onClick={() => void persist(items.filter((item) => item.id !== image.id))}
                className="shrink-0 text-red-500 transition-colors hover:text-red-600"
              >
                <Trash2 className="size-4" strokeWidth={1.5} />
              </button>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </AdminLayout>
  );
}
