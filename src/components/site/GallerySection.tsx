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
  const source: GalleryImage[] =
    remote.length > 0
      ? remote.map((item) => ({
          id: item.id,
          src: resolvePublicMediaSrc(item.src),
          caption: item.caption,
          span: item.span,
        }))
      : galleryImages;
  const items = limit ? source.slice(0, limit) : source;

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
                className="size-full object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-navy/0 transition-colors duration-500 group-hover:bg-navy/55" />
              <span className="absolute inset-0 flex items-center justify-center p-6">
                <span className="translate-y-2 text-center text-sm tracking-[0.18em] text-white uppercase opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:text-base">
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
            className="fixed inset-0 z-70 grid place-items-center bg-navy/92 p-6 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setActive(null)}
              aria-label={t("gallery.close")}
              className="absolute top-6 inset-inline-end-6 grid size-11 place-items-center rounded-full border border-navy-foreground/20 text-navy-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
            <motion.figure
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[85vh] max-w-5xl"
            >
              <img
                src={active.src}
                alt={active.caption[language]}
                className="max-h-[75vh] w-auto object-contain"
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
