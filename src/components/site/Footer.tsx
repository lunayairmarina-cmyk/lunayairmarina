import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Instagram, Linkedin, type LucideProps } from "lucide-react";
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
  if (!value) return false;
  const lower = value.toLowerCase().replace(/\/$/, "");
  if (lower === "https://facebook.com" || lower === "https://www.facebook.com") return false;
  if (lower === "https://youtube.com" || lower === "https://www.youtube.com") return false;
  return true;
}

export function Footer() {
  const { t, isRTL } = useLanguage();
  const settings = useCompanySettings();
  const CtaArrow = isRTL ? ArrowLeft : ArrowRight;
  const socials = [
    { icon: Instagram, href: settings.socialLinks.instagram, label: "Instagram" },
    { icon: TikTokIcon, href: settings.socialLinks.tiktok, label: "TikTok" },
    { icon: XIcon, href: settings.socialLinks.x, label: "X" },
    { icon: Linkedin, href: settings.socialLinks.linkedin, label: "LinkedIn" },
  ].filter((social) => isUsableSocialUrl(social.href));

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
            <Logo tone="light" align="center" className="mx-auto h-24 w-44 sm:h-28 sm:w-52" />
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

        <div className="border-t border-white/10 py-5 text-center text-[0.7rem] text-white/45">
          <p>
            <Link
              to="/admin/login"
              className="text-inherit no-underline hover:text-white/45"
              aria-label="Admin"
            >
              ©
            </Link>{" "}
            {new Date().getFullYear()} {t("brand.name")}. {t("footer.rights")}
          </p>
          <p className="mt-2 text-sm text-white/70">
            {t("footer.credit")}{" "}
            <a
              href="https://www.top1markting.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#e8c56a] underline-offset-2 transition-colors hover:text-[#f0d78a] hover:underline"
            >
              {t("footer.creditAgency")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
