import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  /** Current page label for breadcrumb after Home */
  crumb?: string;
  compact?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  crumb,
  compact = false,
}: PageHeaderProps) {
  const { t } = useLanguage();

  return (
    <section
      className={cn(
        "relative flex items-end overflow-hidden pt-32",
        compact
          ? "min-h-[46vh] pb-14 sm:min-h-[50vh] sm:pb-16"
          : "min-h-[58vh] pb-20 sm:min-h-[64vh] sm:pb-24",
      )}
    >
      <div className="absolute inset-0">
        <img src={image} alt="" aria-hidden className="animate-slow-zoom size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d18] via-navy/55 to-navy/30" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(200,169,106,0.16),transparent_45%)]"
        />
      </div>

      <div className="container-luxe relative z-10 max-w-3xl">
        {crumb ? (
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-[0.65rem] tracking-[0.2em] text-white/50 uppercase"
          >
            <Link to="/" className="transition-colors hover:text-gold">
              {t("nav.home")}
            </Link>
            <span aria-hidden className="text-gold/60">
              /
            </span>
            <span className="text-gold">{crumb}</span>
          </motion.nav>
        ) : null}

        {eyebrow ? (
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="block text-[0.7rem] tracking-[0.28em] text-gold uppercase"
          >
            {eyebrow}
          </motion.span>
        ) : null}

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mt-4 font-display whitespace-pre-line text-4xl leading-[1.1] text-balance text-white sm:text-5xl lg:text-6xl"
        >
          {title}
        </motion.h1>

        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.45, duration: 0.7 }}
          className="mt-6 block h-px w-16 origin-start bg-gold"
        />

        {subtitle ? (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg"
          >
            {subtitle}
          </motion.p>
        ) : null}
      </div>
    </section>
  );
}
