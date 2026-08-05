import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";
import { resolvePublicMediaSrc } from "@/lib/media";

const HERO_MP4_FALLBACK = "/videos/lunayair.mp4";
/** Stable public URL — matches homepage `<link rel="preload">` for LCP. */
const HERO_POSTER_FALLBACK = "/images/hero/hero-main.webp";

export function Hero() {
  const { t, language } = useLanguage();
  const site = useOptionalSiteContent();
  const homepage = site?.bundle?.homepage;
  const heroImage = resolvePublicMediaSrc(homepage?.heroImage, HERO_POSTER_FALLBACK);
  const heroVideo =
    homepage?.heroVideo && homepage.heroVideo !== "/videos/hero.mp4"
      ? homepage.heroVideo
      : HERO_MP4_FALLBACK;
  const eyebrow = homepage
    ? localizeOrFallback(homepage.heroEyebrow, language, t("hero.eyebrow"))
    : t("hero.eyebrow");
  const title = homepage
    ? localizeOrFallback(homepage.heroTitle, language, t("hero.title"))
    : t("hero.title");
  const subtitle = homepage
    ? localizeOrFallback(homepage.heroDescription, language, t("hero.subtitle"))
    : t("hero.subtitle");
  const primary = homepage
    ? localizeOrFallback(homepage.primaryCTA, language, t("hero.primary"))
    : t("hero.primary");
  const secondary = homepage
    ? localizeOrFallback(homepage.secondaryCTA, language, t("hero.secondary"))
    : t("hero.secondary");
  const scroll = homepage
    ? localizeOrFallback(homepage.scrollLabel, language, t("hero.scroll"))
    : t("hero.scroll");

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // Poster-first: delay the ~28MB MP4 until after first paint, then actually fetch+play.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const saveData = Boolean(connection?.saveData);
    const slowNet = connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g";

    if (reduceMotion || saveData || slowNet) return;

    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      const id = window.setTimeout(() => setShouldLoadVideo(true), 900);
      return () => window.clearTimeout(id);
    }

    let idleId: number | undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        const start = () => setShouldLoadVideo(true);
        // Short idle window so video still starts soon after LCP poster paints.
        if (typeof window.requestIdleCallback === "function") {
          idleId = window.requestIdleCallback(start, { timeout: 1200 });
        } else {
          idleId = window.setTimeout(start, 700);
        }
      },
      { rootMargin: "0px", threshold: 0.15 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (idleId == null) return;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idleId);
      else window.clearTimeout(idleId);
    };
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo) return;

    let cancelled = false;
    let video: HTMLVideoElement | null = null;

    const markReady = () => {
      if (!cancelled) setVideoReady(true);
    };

    const tryPlay = () => {
      if (!video || cancelled) return;
      void video
        .play()
        .then(markReady)
        .catch(() => undefined);
    };

    const start = () => {
      video = videoRef.current;
      if (!video) return false;
      video.addEventListener("playing", markReady);
      video.addEventListener("canplay", tryPlay);
      // Kick fetch even if preload was none; with preload=auto this still helps.
      video.load();
      tryPlay();
      return true;
    };

    // Ref is set after commit; retry once on next frame if needed.
    if (!start()) {
      const raf = requestAnimationFrame(() => {
        start();
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    return () => {
      cancelled = true;
      if (!video) return;
      video.removeEventListener("playing", markReady);
      video.removeEventListener("canplay", tryPlay);
    };
  }, [shouldLoadVideo, heroVideo]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[calc(100svh-4rem-env(safe-area-inset-top))] w-full items-center justify-center overflow-hidden max-sm:items-end max-sm:pb-16"
    >
      <div className="absolute inset-0 bg-navy">
        {/* LCP poster — always visible immediately */}
        <img
          src={heroImage}
          alt=""
          aria-hidden
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ${
            videoReady ? "opacity-0" : "opacity-100"
          }`}
        />
        {shouldLoadVideo ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            poster={heroImage}
            aria-hidden
            src={heroVideo}
          />
        ) : null}
        <div className="absolute inset-0 bg-navy/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent sm:from-navy/55 sm:via-transparent" />
      </div>

      {/* Visible immediately — Motion only does a soft lift after paint (no opacity:0 gate). */}
      <div className="container-luxe relative z-10 flex w-full flex-col items-center px-1 py-8 text-center sm:py-10">
        <motion.span
          initial={false}
          animate={{ y: 0 }}
          className="eyebrow"
        >
          {eyebrow}
        </motion.span>

        <motion.h1
          initial={false}
          animate={{ y: 0 }}
          className="font-display type-display-xl mt-4 text-balance text-white uppercase sm:mt-6"
        >
          {t("brand.name")}
        </motion.h1>

        <p className="type-body mt-4 max-w-2xl text-white/90 sm:mt-7">{title}</p>
        <p className="type-body-sm mt-2 max-w-xl text-white/70 sm:mt-3">{subtitle}</p>

        <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-12 sm:max-w-none sm:flex-row sm:justify-center">
          <Link
            to="/contact"
            className="type-cta border border-gold bg-gold px-6 py-3.5 text-center text-navy transition-all duration-500 hover:bg-transparent hover:text-gold sm:px-8 sm:py-4"
          >
            {primary}
          </Link>
          <Link
            to="/services"
            className="type-cta border border-white/50 px-6 py-3.5 text-center text-white transition-all duration-500 hover:border-white hover:bg-white/10 sm:px-8 sm:py-4"
          >
            {secondary}
          </Link>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 z-10 hidden flex-col items-center gap-2 sm:bottom-7 sm:flex">
        <span className="text-[0.6rem] tracking-[0.3em] text-white/55 uppercase">{scroll}</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-gold"
        >
          <ChevronDown className="size-5" strokeWidth={1.5} />
        </motion.span>
      </div>
    </section>
  );
}
