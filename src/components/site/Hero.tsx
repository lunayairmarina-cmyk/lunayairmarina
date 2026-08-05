import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";
import heroImageFallback from "@/assets/hero-yacht.jpg";
import { resolvePublicMediaSrc } from "@/lib/media";

const HERO_MP4_FALLBACK = "/videos/lunayair.mp4";

export function Hero() {
  const { t, language } = useLanguage();
  const site = useOptionalSiteContent();
  const homepage = site?.bundle?.homepage;
  const heroImage = resolvePublicMediaSrc(homepage?.heroImage, heroImageFallback);
  // Prefer CMS video, but migrate away from the old default hero.mp4.
  const heroVideo =
    homepage?.heroVideo && homepage.heroVideo !== "/videos/hero.mp4"
      ? homepage.heroVideo
      : HERO_MP4_FALLBACK;
  const eyebrow = homepage ? localizeValue(homepage.heroEyebrow, language) : t("hero.eyebrow");
  const title = homepage ? localizeValue(homepage.heroTitle, language) : t("hero.title");
  const subtitle = homepage
    ? localizeValue(homepage.heroDescription, language)
    : t("hero.subtitle");
  const primary = homepage ? localizeValue(homepage.primaryCTA, language) : t("hero.primary");
  const secondary = homepage
    ? localizeValue(homepage.secondaryCTA, language)
    : t("hero.secondary");
  const scroll = homepage ? localizeValue(homepage.scrollLabel, language) : t("hero.scroll");

  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(true);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean(
      (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData,
    );

    if (reduceMotion || saveData) {
      setShouldLoadVideo(false);
    }
  }, []);

  useEffect(() => {
    if (!shouldLoadVideo) return;
    const video = videoRef.current;
    if (!video) return;

    const onCanPlay = () => {
      void video.play().catch(() => undefined);
      setReady(true);
    };

    video.addEventListener("canplay", onCanPlay);
    video.load();
    if (video.readyState >= 3) onCanPlay();

    return () => video.removeEventListener("canplay", onCanPlay);
  }, [shouldLoadVideo, heroVideo]);

  return (
    <section className="relative flex min-h-[calc(100svh-4rem-env(safe-area-inset-top))] w-full items-center justify-center overflow-hidden max-sm:items-end max-sm:pb-16">
      <div className="absolute inset-0 bg-navy">
        <img
          src={heroImage}
          alt=""
          aria-hidden
          width={1920}
          height={1088}
          fetchPriority="high"
          decoding="async"
          className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}
        />
        {shouldLoadVideo ? (
          <video
            ref={videoRef}
            className={`absolute inset-0 size-full object-cover object-center transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
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

      <div className="container-luxe relative z-10 flex w-full flex-col items-center px-1 py-8 text-center sm:py-10">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.8 }}
          className="eyebrow"
        >
          {eyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="type-display-xl mt-4 text-balance text-white uppercase sm:mt-6"
        >
          {t("brand.name")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.85 }}
          className="type-body mt-4 max-w-2xl text-white/90 sm:mt-7"
        >
          {title}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.8 }}
          className="type-body-sm mt-2 max-w-xl text-white/70 sm:mt-3"
        >
          {subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:mt-12 sm:max-w-none sm:flex-row sm:justify-center"
        >
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
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute inset-x-0 bottom-4 z-10 hidden flex-col items-center gap-2 sm:bottom-7 sm:flex"
      >
        <span className="text-[0.6rem] tracking-[0.3em] text-white/55 uppercase">{scroll}</span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-gold"
        >
          <ChevronDown className="size-5" strokeWidth={1.5} />
        </motion.span>
      </motion.div>
    </section>
  );
}
