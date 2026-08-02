import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Quote } from "lucide-react";
import "swiper/css";
import "swiper/css/pagination";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";

interface TestimonialItem {
  name: string;
  position: string;
  review: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

export function Testimonials() {
  const { t, tv, dir, language } = useLanguage();
  const site = useOptionalSiteContent();
  const remote = site?.bundle?.testimonials ?? [];
  const items: TestimonialItem[] =
    remote.length > 0
      ? remote.map((item) => ({
          name: item.clientName,
          position: localizeValue(item.role, language),
          review: localizeValue(item.text, language),
        }))
      : (tv<TestimonialItem[]>("testimonials.items") ?? []);
  const [mounted, setMounted] = useState(false);
  const maxSlidesPerView = 3;
  const canLoop = items.length > maxSlidesPerView;

  useEffect(() => setMounted(true), []);

  return (
    <section className="relative overflow-hidden border-y border-gold/15 bg-gradient-to-br from-[#061321] via-navy to-ocean py-24 lg:py-32">
      <div className="container-luxe">
        <SectionHeading
          eyebrow={t("testimonials.eyebrow")}
          title={t("testimonials.title")}
          tone="dark"
        />

        <div className="mt-16">
          {mounted ? (
            <Swiper
              key={dir}
              dir={dir}
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={28}
              slidesPerView={1}
              loop={canLoop}
              autoplay={{ delay: 5200, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              breakpoints={{ 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } }}
              className="!pb-14"
            >
              {items.map((item) => (
                <SwiperSlide key={item.name} className="h-auto">
                  <TestimonialCard item={item} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {items.slice(0, 3).map((item) => (
                <TestimonialCard key={item.name} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .swiper-pagination-bullet { background: var(--gold); opacity: 0.3; }
        .swiper-pagination-bullet-active { opacity: 1; width: 22px; border-radius: 4px; }
      `}</style>
    </section>
  );
}

function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <figure className="glass-card flex h-full min-h-[280px] flex-col gap-6 rounded-lg p-8">
      <Quote className="size-7 text-gold/70" strokeWidth={1.2} />
      <blockquote className="flex-1 text-sm leading-relaxed text-navy-foreground/75">
        “{item.review}”
      </blockquote>
      <figcaption className="flex items-center gap-4 border-t border-navy-foreground/10 pt-5">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gold/15 text-sm text-gold">
          {initials(item.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-navy-foreground">{item.name}</span>
          <span className="block truncate text-xs text-navy-foreground/50">{item.position}</span>
        </span>
      </figcaption>
    </figure>
  );
}
