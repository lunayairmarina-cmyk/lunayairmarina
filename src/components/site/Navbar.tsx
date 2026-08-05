import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Logo } from "@/components/shared/Logo";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

const links = [
  { to: "/", key: "nav.home" },
  { to: "/services", key: "nav.services" },
  { to: "/about", key: "nav.about" },
  { to: "/blog", key: "nav.blog" },
  { to: "/application", key: "nav.application" },
  { to: "/contact", key: "nav.cta" },
] as const;

export function Navbar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 h-[calc(4rem+env(safe-area-inset-top))] overflow-visible border-b border-navy/10 bg-white pt-[env(safe-area-inset-top)] shadow-card"
      >
        <div className="container-luxe grid h-full grid-cols-[1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <Link to="/" className="relative z-10 min-w-0 max-w-[58%] justify-self-start sm:max-w-none" aria-label={t("brand.name")}>
            <Logo tone="dark" className="h-9 w-24 sm:h-12 sm:w-36" />
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                className="nav-link text-navy/75 transition-colors hover:text-navy"
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center justify-end gap-3 lg:flex">
            <LanguageSwitcher tone="dark" />
            <Link
              to="/contact"
              className="type-cta border border-navy bg-navy px-5 py-2.5 text-navy-foreground transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy"
            >
              {t("nav.contactUs")}
            </Link>
          </div>

          <div className="flex items-center justify-self-end gap-1.5 lg:hidden">
            <LanguageSwitcher tone="dark" />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              className="grid size-11 place-items-center rounded-lg text-navy transition-colors hover:bg-navy/5"
            >
              <Menu className="size-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] overflow-y-auto bg-white pt-[env(safe-area-inset-top)] lg:hidden"
          >
            <div className="container-luxe flex h-16 items-center justify-between border-b border-navy/10">
              <Logo tone="dark" className="h-9 w-24 sm:h-10 sm:w-28" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid size-11 place-items-center rounded-lg text-navy"
              >
                <X className="size-6" strokeWidth={1.5} />
              </button>
            </div>

            <nav className="container-luxe mt-6 flex flex-col gap-1 pb-6 sm:mt-8 sm:gap-2 sm:pb-8">
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
                    className="block py-2.5 font-display text-[1.35rem] leading-snug text-navy transition-colors hover:text-gold sm:py-3 sm:text-3xl"
                  >
                    {t(link.key)}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="container-luxe mt-2 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:mt-4 sm:pb-10">
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="type-cta block w-full border border-navy bg-navy px-5 py-3.5 text-center text-navy-foreground"
              >
                {t("nav.contactUs")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
