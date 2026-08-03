import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Facebook, Instagram, Linkedin, Lock, Youtube } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Logo } from "@/components/shared/Logo";
import { useCompanySettings } from "@/hooks/useCompanySettings";

const quickLinks = [
  { to: "/", key: "nav.home" },
  { to: "/services", key: "nav.services" },
  { to: "/about", key: "nav.about" },
  { to: "/blog", key: "nav.blog" },
  { to: "/application", key: "nav.application" },
  { to: "/contact", key: "nav.cta" },
] as const;

export function Footer() {
  const { t, isRTL } = useLanguage();
  const settings = useCompanySettings();
  const CtaArrow = isRTL ? ArrowLeft : ArrowRight;
  const socials = [
    { icon: Instagram, href: settings.socialLinks.instagram, label: "Instagram" },
    { icon: Linkedin, href: settings.socialLinks.linkedin, label: "LinkedIn" },
    { icon: Facebook, href: settings.socialLinks.facebook, label: "Facebook" },
    { icon: Youtube, href: settings.socialLinks.youtube, label: "YouTube" },
  ];

  return (
    <footer className="relative overflow-hidden bg-[#050d18] text-navy-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <div className="container-luxe relative">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center py-14 text-center sm:py-16">
          <Link
            to="/"
            aria-label={t("brand.name")}
            className="inline-flex items-center justify-center"
          >
            <Logo tone="light" align="center" className="mx-auto h-20 w-40 sm:h-24 sm:w-48" />
          </Link>

          <span className="mt-5 block h-px w-14 bg-gold/70" aria-hidden />

          <p className="mx-auto mt-6 max-w-xl text-center text-sm leading-7 text-white/60 sm:text-base">
            {t("footer.description")}
          </p>

          <Link
            to="/contact"
            className="group mt-7 inline-flex items-center justify-center gap-3 rounded-full border border-gold/55 px-7 py-3 text-sm text-white transition-all duration-300 hover:border-gold hover:bg-gold hover:text-navy"
          >
            {t("footer.contact")}
            <CtaArrow
              className="size-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              strokeWidth={1.6}
            />
          </Link>

          <nav
            aria-label={t("footer.links")}
            className="mt-8 flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs tracking-[0.08em] text-white/50"
          >
            {quickLinks.map((link) => (
              <Link key={link.to} to={link.to} className="transition-colors hover:text-gold">
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="mt-7 flex w-full flex-wrap items-center justify-center gap-3">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                title={social.label}
                className="group grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.03] text-white/65 transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold"
              >
                <social.icon
                  className="size-4 transition-transform duration-300 group-hover:scale-110"
                  strokeWidth={1.7}
                />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 border-t border-white/10 py-5 text-center text-[0.7rem] text-white/35">
          <p>
            © {new Date().getFullYear()} {t("brand.name")}. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a
              href={`mailto:${settings.email}`}
              className="transition-colors hover:text-gold"
              dir="ltr"
            >
              {settings.email}
            </a>
            <a
              href={`tel:${settings.phone.replace(/\s/g, "")}`}
              className="transition-colors hover:text-gold"
              dir="ltr"
            >
              {settings.phoneDisplay ?? settings.phone}
            </a>
            <Link
              to="/admin/login"
              className="inline-flex items-center gap-1.5 tracking-[0.14em] uppercase transition-colors hover:text-gold"
            >
              <Lock className="size-3" strokeWidth={1.5} />
              {t("footer.admin")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
