import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Instagram, Linkedin, Menu, X, type LucideProps } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/services", key: "nav.services" },
  { to: "/about", key: "nav.about" },
  { to: "/blog", key: "nav.blog" },
  { to: "/application", key: "nav.application" },
  { to: "/advertising", key: "nav.advertising" },
  { to: "/contact", key: "nav.cta" },
] as const;

function TikTokIcon({ className, strokeWidth = 1.7, ...props }: LucideProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );
}

function XIcon({ className, ...props }: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function isUsableSocialUrl(href?: string) {
  const value = href?.trim() ?? "";
  return Boolean(value);
}

export function Navbar() {
  const { t, isRTL } = useLanguage();
  const settings = useCompanySettings();
  const [open, setOpen] = useState(false);

  const socials = [
    { icon: Instagram, href: settings.socialLinks.instagram, label: "Instagram" },
    { icon: TikTokIcon, href: settings.socialLinks.tiktok, label: "TikTok" },
    { icon: XIcon, href: settings.socialLinks.x, label: "X" },
    { icon: Linkedin, href: settings.socialLinks.linkedin, label: "LinkedIn" },
  ].filter((social) => isUsableSocialUrl(social.href));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[calc(5rem+env(safe-area-inset-top))] overflow-visible border-b border-navy/10 bg-white pt-[env(safe-area-inset-top)] shadow-card">
        <div className="container-luxe flex h-full items-center justify-between gap-2 sm:gap-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
          <Link
            to="/"
            className="min-w-0 shrink-0 max-w-[58%] sm:max-w-none lg:justify-self-start"
            aria-label={t("brand.name")}
          >
            <Logo tone="dark" className="h-11 w-[6.75rem] max-w-full sm:h-12 sm:w-28 lg:h-[4.25rem] lg:w-44" />
          </Link>

          {/* Symmetric center column — desktop only. */}
          <nav aria-label="Primary" className="hidden min-w-0 justify-self-center lg:block">
            <div
              className={cn(
                "flex max-w-[min(100vw-22rem,52rem)] flex-wrap items-center justify-center gap-x-4 gap-y-1 xl:gap-x-6",
                isRTL && "tracking-normal",
              )}
            >
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={{ exact: link.to === "/" }}
                  className={cn(
                    "nav-link shrink-0 whitespace-nowrap text-navy/75 transition-colors hover:text-navy",
                    isRTL && "tracking-[0.04em]",
                  )}
                >
                  {t(link.key)}
                </Link>
              ))}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:justify-self-end">
            <LanguageSwitcher tone="dark" />
            <Link
              to="/contact"
              className="type-cta hidden border border-navy bg-navy px-5 py-2.5 text-navy-foreground transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy lg:inline-flex"
            >
              {t("nav.contactUs")}
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-10 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/5 sm:size-11 lg:hidden"
            >
              <Menu className="size-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-hidden lg:hidden"
          >
            <div className="absolute inset-0 bg-[#061525]" />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,169,106,0.18),transparent_50%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/35 to-transparent"
            />

            <div className="relative z-10 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-white/10 px-4 pt-[env(safe-area-inset-top)] sm:px-6">
              <Link to="/" onClick={() => setOpen(false)} aria-label={t("brand.name")}>
                <Logo tone="light" className="h-12 w-28 max-w-full sm:h-16 sm:w-40" />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-gold/50 hover:text-gold"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6">
              <p className="mt-8 text-[0.65rem] tracking-[0.28em] text-gold uppercase">
                {t("brand.name")}
              </p>

              <nav className="mt-6 flex flex-col gap-1">
                {links.map((link, index) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: isRTL ? -18 : 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.06 * index + 0.08,
                      duration: 0.45,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: link.to === "/" }}
                      className="group flex items-center gap-4 border-b border-white/8 py-4 transition-colors"
                    >
                      <span className="text-[0.7rem] tracking-[0.18em] text-gold/70">
                        0{index + 1}
                      </span>
                      <span className="flex-1 text-start font-display text-[1.45rem] leading-snug text-white transition-colors group-hover:text-gold sm:text-3xl">
                        {t(link.key)}
                      </span>
                      <span
                        aria-hidden
                        className="h-px w-0 bg-gold/70 transition-all duration-300 group-hover:w-8"
                      />
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
                className="mt-8"
              >
                <Link
                  to="/contact"
                  onClick={() => setOpen(false)}
                  className="block w-full border border-gold bg-gold px-5 py-4 text-center text-[0.72rem] tracking-[0.18em] text-navy uppercase transition hover:bg-transparent hover:text-gold"
                >
                  {t("nav.contactUs")}
                </Link>
              </motion.div>

              {socials.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55, duration: 0.45 }}
                  className="mt-auto flex items-center justify-center gap-3 pt-10 pb-4"
                >
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={social.label}
                      className="grid size-11 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-white/70 transition hover:border-gold hover:bg-gold hover:text-navy"
                    >
                      <social.icon className="size-4" strokeWidth={1.6} />
                    </a>
                  ))}
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
