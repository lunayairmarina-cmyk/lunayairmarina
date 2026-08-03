import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/services", key: "nav.services" },
  { to: "/about", key: "nav.about" },
  { to: "/blog", key: "nav.blog" },
  { to: "/application", key: "nav.application" },
  { to: "/contact", key: "nav.cta" },
] as const;

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overHero = transparent && !scrolled && !open;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-16 overflow-visible transition-[background-color,border-color,box-shadow] duration-300",
          overHero
            ? "border-b border-white/10 bg-transparent"
            : "border-b border-navy/10 bg-white shadow-card",
        )}
      >
        <div className="container-luxe grid h-full grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="relative z-10 min-w-0 justify-self-start" aria-label={t("brand.name")}>
            <Logo tone={overHero ? "light" : "dark"} className="h-10 w-28 sm:h-12 sm:w-36" />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                className={cn(
                  "nav-link transition-colors",
                  overHero ? "text-white/85 hover:text-white" : "text-navy/75 hover:text-navy",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <LanguageSwitcher tone={overHero ? "light" : "dark"} />
            <Link
              to="/contact"
              className={cn(
                "border px-5 py-2.5 text-[0.7rem] tracking-[0.14em] transition-all duration-500",
                overHero
                  ? "border-white/70 bg-white/10 text-white hover:border-gold hover:bg-gold hover:text-navy"
                  : "border-navy bg-navy text-navy-foreground hover:border-gold hover:bg-gold hover:text-navy",
              )}
            >
              {t("nav.contactUs")}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className={cn(
              "grid size-11 place-items-center justify-self-end rounded-lg transition-colors lg:hidden",
              overHero ? "text-white hover:bg-white/10" : "text-navy hover:bg-navy/5",
            )}
          >
            <Menu className="size-6" strokeWidth={1.5} />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-white lg:hidden"
          >
            <div className="container-luxe flex h-16 items-center justify-between border-b border-navy/10">
              <Logo tone="dark" className="h-10 w-28" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-lg text-navy"
              >
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="container-luxe mt-8 flex flex-col gap-2 pb-8">
              {links.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index + 0.1, duration: 0.5 }}
                >
                  <Link
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className="block py-3 font-display text-2xl text-navy transition-colors hover:text-gold sm:text-3xl"
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="container-luxe mt-4 flex flex-col gap-4 pb-10">
              <div className="flex items-center gap-3">
                <LanguageSwitcher tone="dark" />
                <Link
                  to="/contact"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-navy bg-navy px-5 py-3 text-center text-[0.7rem] tracking-[0.14em] text-navy-foreground"
                >
                  {t("nav.contactUs")}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
