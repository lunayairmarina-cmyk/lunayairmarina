import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  Anchor,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  FileText,
  LifeBuoy,
  Ship,
  UserRound,
  Users,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Reveal } from "@/components/shared/Reveal";
import { PhoneFrame, PhoneScreenshot } from "@/components/application/PhoneFrame";
import {
  appFeaturedScreens,
  appOverviewCards,
  featureSlides,
  galleryScreens,
} from "@/data/application";
import aboutMarina from "@/assets/about/yacht_side_transom_landscape.png";
import { cn } from "@/lib/utils";
import { mediaDirectionClass } from "@/lib/media-direction";

const overviewIcons = {
  Ship,
  CalendarDays,
  Anchor,
  Compass,
  FileText,
  Users,
  LifeBuoy,
  Crown,
  UserRound,
} as const;

const overviewStagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const overviewItem = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

function OverviewFeature({ card }: { card: (typeof appOverviewCards)[number] }) {
  const { t } = useLanguage();
  const Icon = overviewIcons[card.icon as keyof typeof overviewIcons];
  return (
    <motion.li
      variants={overviewItem}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      className="flex items-center gap-3 text-white"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/35 bg-gold/10 text-gold shadow-[0_0_20px_-8px_rgba(200,169,106,0.55)]">
        {Icon ? <Icon className="size-4" strokeWidth={1.5} /> : null}
      </span>
      <span className="text-sm font-medium leading-snug text-white/90">
        {t(`application.overview.cards.${card.key}`)}
      </span>
    </motion.li>
  );
}

function FeaturesCarousel() {
  const { t, isRTL } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = featureSlides.length;
  const slide = featureSlides[index]!;

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, 3500);
    return () => window.clearInterval(id);
  }, [paused, total]);

  const go = (next: number) => {
    setIndex((next + total) % total);
  };

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div
      className="mx-auto mt-14 max-w-5xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative flex items-center justify-center gap-2 sm:gap-5">
        <button
          type="button"
          aria-label={t("application.features.prev")}
          onClick={() => go(index - 1)}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition hover:border-gold hover:text-gold"
        >
          <PrevIcon className="size-5" strokeWidth={1.5} />
        </button>

        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="grid items-center gap-8 md:grid-cols-[auto_1fr] md:gap-12"
            >
              <div className="mx-auto w-full max-w-[260px] sm:max-w-[280px]">
                <PhoneFrame className="w-full">
                  <PhoneScreenshot
                    src={slide.src}
                    alt={t(`application.features.items.${slide.key}.title`)}
                  />
                </PhoneFrame>
              </div>
              <div className="text-center md:text-start">
                <p className="text-[0.65rem] tracking-[0.2em] text-gold uppercase">
                  {index + 1} / {total}
                </p>
                <h3 className="mt-3 font-display text-2xl text-navy sm:text-3xl lg:text-4xl">
                  {t(`application.features.items.${slide.key}.title`)}
                </h3>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base md:mx-0">
                  {t(`application.features.items.${slide.key}.description`)}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <button
          type="button"
          aria-label={t("application.features.next")}
          onClick={() => go(index + 1)}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-navy/15 bg-white text-navy shadow-sm transition hover:border-gold hover:text-gold"
        >
          <NextIcon className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        {featureSlides.map((item, dotIndex) => (
          <button
            key={item.key + item.src}
            type="button"
            aria-label={t(`application.features.items.${item.key}.title`)}
            aria-current={dotIndex === index}
            onClick={() => setIndex(dotIndex)}
            className={cn(
              "h-2 rounded-full transition-all",
              dotIndex === index ? "w-8 bg-gold" : "w-2 bg-navy/20 hover:bg-navy/40",
            )}
          />
        ))}
      </div>
    </div>
  );
}

function HeroPhones() {
  const { t } = useLanguage();
  return (
    <div className="relative mx-auto flex w-full max-w-[300px] items-end justify-center pt-6 pb-2 sm:max-w-[320px] sm:pt-8">
      <motion.div
        initial={false}
        animate={{ y: [0, -8, 0] }}
        transition={{
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        className="relative z-10"
      >
        <PhoneFrame className="w-[240px] sm:w-[270px]">
          <PhoneScreenshot
            src={appFeaturedScreens.hero}
            alt={t("application.gallery.labels.home")}
            priority
          />
        </PhoneFrame>
      </motion.div>
    </div>
  );
}

function ComingSoonStores({ className, light = false }: { className?: string; light?: boolean }) {
  const { t } = useLanguage();
  return (
    <div
      className={cn(
        "relative overflow-hidden border px-5 py-4 sm:px-6",
        light ? "border-white/35 bg-[#03111f]/90 text-white" : "border-navy/15 bg-white text-navy",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-start">
          <p
            className={cn(
              "text-[0.62rem] tracking-[0.22em] uppercase",
              light ? "text-gold" : "text-gold",
            )}
          >
            {t("application.comingSoon.eyebrow")}
          </p>
          <p
            className={cn(
              "mt-1.5 text-sm font-medium sm:text-base",
              light ? "text-white" : "text-navy",
            )}
          >
            {t("application.comingSoon.title")}
          </p>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              light ? "text-white/65" : "text-muted-foreground",
            )}
          >
            {t("application.comingSoon.body")}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <span
            className={cn(
              "inline-flex items-center justify-center border px-3 py-2 text-[0.62rem] tracking-[0.14em] uppercase opacity-70",
              light ? "border-white/35 text-white/80" : "border-navy/20 text-navy/70",
            )}
          >
            {t("application.hero.appStore")}
          </span>
          <span
            className={cn(
              "inline-flex items-center justify-center border px-3 py-2 text-[0.62rem] tracking-[0.14em] uppercase opacity-70",
              light ? "border-gold/50 text-gold" : "border-gold/50 text-navy/70",
            )}
          >
            {t("application.hero.googlePlay")}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ApplicationSections() {
  const { t } = useLanguage();

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100svh-5rem)] w-full items-center py-10 sm:py-14 lg:py-12">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={aboutMarina}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            className={cn("size-full object-cover", mediaDirectionClass("rtl"))}
          />
          <div className="absolute inset-0 bg-[#03111f]/35" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#03111f]/88 via-[#03111f]/40 to-transparent rtl:bg-gradient-to-l" />
        </div>

        <div className="container-luxe relative z-10 grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
          <div className="max-w-xl text-white">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.hero.eyebrow")}
            </p>
            <h1 className="mt-5 whitespace-pre-line font-display text-[1.85rem] leading-[1.15] sm:text-5xl lg:text-6xl">
              {t("application.hero.title")}
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/75 sm:text-lg">
              {t("application.hero.description")}
            </p>
            <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:mt-10">
              <ComingSoonStores light />
              <Link
                to="/contact"
                className="border border-white/50 bg-[#03111f]/85 px-6 py-3.5 text-center text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:border-gold hover:bg-gold hover:text-navy"
              >
                {t("application.hero.ask")}
              </Link>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroPhones />
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="relative overflow-hidden bg-[#061525] py-20 lg:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,169,106,0.12),transparent_55%)]"
        />
        <div className="container-luxe relative">
          <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.overview.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-white sm:text-5xl">
              {t("application.overview.title")}
            </h2>
          </Reveal>

          <div className="mt-14 flex flex-col items-center gap-12 lg:mt-16 lg:gap-14">
            <Reveal className="relative z-10">
              <PhoneFrame>
                <PhoneScreenshot
                  src={appFeaturedScreens.overview}
                  alt={t("application.gallery.labels.home")}
                />
              </PhoneFrame>
            </Reveal>

            <motion.ul
              className="grid w-full max-w-4xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 sm:gap-x-10 sm:gap-y-6"
              variants={overviewStagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px", amount: 0.2 }}
            >
              {appOverviewCards.map((card) => (
                <OverviewFeature key={card.id} card={card} />
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* FLEET */}
      <section className="bg-background py-20 lg:py-28">
        <div className="container-luxe grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="left" className="flex justify-center">
            <PhoneFrame>
              <PhoneScreenshot
                src={appFeaturedScreens.fleet}
                alt={t("application.gallery.labels.fleet")}
              />
            </PhoneFrame>
          </Reveal>
          <Reveal direction="right">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.tanks.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">
              {t("application.tanks.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("application.tanks.description")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* SCHEDULE */}
      <section className="bg-sand py-20 lg:py-28">
        <div className="container-luxe grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="left" className="order-2 lg:order-1">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.checklist.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">
              {t("application.checklist.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("application.checklist.description")}
            </p>
          </Reveal>
          <Reveal direction="right" className="order-1 flex justify-center lg:order-2">
            <PhoneFrame>
              <PhoneScreenshot
                src={appFeaturedScreens.schedule}
                alt={t("application.gallery.labels.schedule")}
              />
            </PhoneFrame>
          </Reveal>
        </div>
      </section>

      {/* BOOKINGS */}
      <section className="bg-[#071a2b] py-20 lg:py-28">
        <div className="container-luxe grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal direction="left" className="flex justify-center">
            <PhoneFrame>
              <PhoneScreenshot
                src={appFeaturedScreens.bookings}
                alt={t("application.gallery.labels.bookings")}
              />
            </PhoneFrame>
          </Reveal>
          <Reveal direction="right" className="text-white">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.services.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl">
              {t("application.services.title")}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t("application.services.description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3 text-[0.65rem] tracking-[0.14em] uppercase">
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-300">
                {t("application.services.status.completed")}
              </span>
              <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-amber-300">
                {t("application.services.status.upcoming")}
              </span>
              <span className="rounded-full bg-sky-400/15 px-3 py-1.5 text-sky-300">
                {t("application.gallery.labels.support")}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES CAROUSEL */}
      <section className="bg-background py-20 lg:py-28">
        <div className="container-luxe">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.features.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">
              {t("application.features.title")}
            </h2>
          </Reveal>
          <FeaturesCarousel />
        </div>
      </section>

      {/* GALLERY */}
      <section className="bg-[#050f1c] py-20 lg:py-28">
        <div className="container-luxe">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("application.gallery.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl text-white sm:text-5xl">
              {t("application.gallery.title")}
            </h2>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-8 lg:grid-cols-5 lg:gap-6">
            {galleryScreens.map((screen, index) => (
              <Reveal key={screen.src} delay={Math.min(index, 8) * 0.04}>
                <motion.div whileHover={{ y: -6 }} className="flex flex-col items-center gap-3">
                  <PhoneFrame className="w-full max-w-[180px]" glow={false}>
                    <PhoneScreenshot
                      src={screen.src}
                      alt={t(`application.gallery.labels.${screen.labelKey}`)}
                    />
                  </PhoneFrame>
                  <p className="text-center text-[0.65rem] tracking-[0.16em] text-white/55 uppercase">
                    {t(`application.gallery.labels.${screen.labelKey}`)}
                  </p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0">
          <img
            src={aboutMarina}
            alt=""
            aria-hidden
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
          <div className="absolute inset-0 bg-navy/82" />
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-sky-500/20 to-transparent"
            animate={{ opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
        <div className="container-luxe relative z-10 mx-auto max-w-3xl text-center text-white">
          <Reveal>
            <h2 className="font-display text-4xl sm:text-6xl">{t("application.download.title")}</h2>
            <p className="mt-5 text-lg text-white/75">{t("application.download.description")}</p>
            <div className="mt-10 flex w-full flex-col items-center gap-4">
              <ComingSoonStores light className="w-full max-w-xl text-start" />
              <Link
                to="/contact"
                className="w-full max-w-xl border border-white/50 bg-[#03111f]/85 px-6 py-4 text-center text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:border-gold hover:bg-gold hover:text-navy"
              >
                {t("application.download.contact")}
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
