import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { staggerContainer, staggerItem } from "@/components/shared/Reveal";
import { useOptionalSiteContent } from "@/providers/SiteContentProvider";
import { ContentSkeleton } from "@/components/shared/ContentState";
import { galleryImages, type GalleryImage } from "@/data/mock";
import { resolvePublicMediaSrc } from "@/lib/media";

const spanClass: Record<GalleryImage["span"], string> = {
  tall: "sm:row-span-2",
  wide: "sm:col-span-2",
  normal: "",
};

export function GallerySection({ limit }: { limit?: number }) {
  const { t, language } = useLanguage();
  const site = useOptionalSiteContent();
  const [active, setActive] = useState<GalleryImage | null>(null);
  const remote = site?.bundle?.gallery ?? [];
  // Prefer curated local gallery (src + caption) so CMS legacy labels
  // like "Main salon" on the aerial fleet shot never show mismatched.
  const source: GalleryImage[] =
    remote.length > 0
      ? remote.map((item) => {
          const local = galleryImages.find((g) => g.id === item.id);
          return {
            id: item.id,
            src: local?.src ?? resolvePublicMediaSrc(item.src),
            caption: local?.caption ?? item.caption,
            span: local?.span ?? item.span,
            objectPosition: local?.objectPosition ?? "50% 45%",
          };
        })
      : galleryImages;

  // Drop duplicate image sources so the grid never shows the same photo twice.
  const seen = new Set<string>();
  const unique = source.filter((item) => {
    const key = item.src.split("?")[0] ?? item.src;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const items = limit ? unique.slice(0, limit) : unique;

  if (site?.status === "loading" && remote.length === 0 && galleryImages.length === 0) {
    return (
      <section className="bg-[#f3efe7] py-24 lg:py-32">
        <div className="container-luxe">
          <ContentSkeleton rows={4} />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#f3efe7] py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={t("gallery.eyebrow")}
          title={t("gallery.title")}
          subtitle={t("gallery.subtitle")}
          align="start"
          className="max-w-xl"
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid grid-cols-1 grid-flow-dense gap-3 sm:grid-cols-2 sm:auto-rows-[220px] sm:gap-4 lg:grid-cols-3 lg:auto-rows-[260px]"
        >
          {items.map((image) => (
            <motion.button
              key={image.id}
              variants={staggerItem}
              type="button"
              onClick={() => setActive(image)}
              className={cn(
                "group relative aspect-4/3 overflow-hidden text-start focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none sm:aspect-auto sm:min-h-0",
                spanClass[image.span],
              )}
            >
              <img
                src={image.src}
                alt={image.caption[language]}
                loading="lazy"
                className="size-full object-cover"
                style={{ objectPosition: image.objectPosition ?? "50% 45%" }}
              />
              <span className="absolute inset-0 bg-navy/15 transition-colors duration-500 sm:bg-navy/0 sm:group-hover:bg-navy/45" />
              <span className="absolute inset-0 flex items-end justify-center p-4 sm:items-center sm:p-6">
                <span className="text-center text-xs tracking-[0.18em] text-white uppercase opacity-100 transition-all duration-500 sm:translate-y-2 sm:text-sm sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:text-base">
                  {image.caption[language]}
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[100] grid place-items-center bg-navy/92 p-4 backdrop-blur-sm sm:p-6"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label={t("gallery.close")}
              className="absolute top-4 inset-inline-end-4 grid size-11 place-items-center rounded-full border border-navy-foreground/20 text-navy-foreground transition-colors hover:border-gold hover:text-gold sm:top-6 sm:inset-inline-end-6"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
            <motion.figure
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-5xl max-h-[85vh]"
            >
              <img
                src={active.src}
                alt={active.caption[language]}
                className="mx-auto max-h-[70vh] w-full max-w-full object-contain sm:max-h-[75vh]"
              />
              <figcaption className="mt-4 text-center text-sm tracking-[0.16em] text-navy-foreground/70 uppercase">
                {active.caption[language]}
              </figcaption>
            </motion.figure>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
