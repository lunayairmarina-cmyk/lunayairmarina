import { useState, type FormEvent } from "react";
import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { Logo } from "@/components/shared/Logo";
import adminBg from "@/assets/admin/admin-login-bg.jpg";

export const Route = createLazyFileRoute("/admin/login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { t } = useLanguage();
  const { login, authError } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email, password);
    setBusy(false);
    if (result.ok) {
      navigate({ to: "/admin/dashboard" });
      return;
    }
    const key = result.error || authError || "admin.loginFailed";
    setError(key.startsWith("admin.") ? t(key) : key);
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-x-clip px-4 py-12 sm:px-5 sm:py-16">
      <div className="absolute inset-0">
        <img src={adminBg} alt="" aria-hidden className="size-full object-cover" />
        <div className="absolute inset-0 bg-navy/85" />
      </div>

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] inset-inline-end-4 z-10 sm:inset-inline-end-6">
        <LanguageSwitcher tone="light" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="glass-card relative z-10 w-full max-w-md rounded-xl p-6 sm:p-10"
      >
        <div className="flex justify-center">
          <Logo tone="light" align="center" className="h-28 w-36 sm:h-40 sm:w-48" />
        </div>

        <h1 className="mt-8 text-center text-2xl text-navy-foreground">{t("admin.portal")}</h1>
        <p className="mt-2 text-center text-xs tracking-[0.18em] text-gold uppercase">
          {t("brand.name")}
        </p>
        <p className="mt-2 text-center text-xs tracking-[0.18em] text-navy-foreground/50 uppercase">
          {t("admin.portalSubtitle")}
        </p>

        <form onSubmit={(event) => void handleSubmit(event)} className="mt-9 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-[0.6rem] tracking-[0.22em] text-navy-foreground/50 uppercase">
              {t("admin.email")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              className="border-b border-navy-foreground/20 bg-transparent py-3 text-sm text-navy-foreground outline-none transition-colors focus:border-gold"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-[0.6rem] tracking-[0.22em] text-navy-foreground/50 uppercase">
              {t("admin.password")}
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="border-b border-navy-foreground/20 bg-transparent py-3 text-sm text-navy-foreground outline-none transition-colors focus:border-gold"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <motion.button
            type="submit"
            disabled={busy}
            whileTap={{ scale: 0.98 }}
            className="mt-2 border border-gold bg-gold px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy uppercase transition-all duration-500 hover:bg-transparent hover:text-gold disabled:opacity-60"
          >
            {busy ? t("common.loading") : t("admin.login")}
          </motion.button>
        </form>

        <Link
          to="/"
          className="mt-8 flex items-center justify-center gap-2 text-[0.65rem] tracking-[0.2em] text-navy-foreground/45 uppercase transition-colors hover:text-gold"
        >
          <ArrowLeft className="size-3.5 rtl:rotate-180" strokeWidth={1.5} />
          {t("admin.backToSite")}
        </Link>
      </motion.div>
    </div>
  );
}
