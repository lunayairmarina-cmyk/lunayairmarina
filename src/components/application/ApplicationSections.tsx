import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  CheckCircle2,
  Cpu,
  Droplets,
  FileText,
  History,
  Info,
  ListChecks,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Reveal } from "@/components/shared/Reveal";
import { PhoneFrame, TankRing } from "@/components/application/PhoneFrame";
import {
  appFeatureCards,
  appOverviewCards,
  checklistGroups,
  galleryScreens,
  tankLevels,
  upcomingServices,
} from "@/data/application";
import aboutMarina from "@/assets/about-marina.jpg";
import { cn } from "@/lib/utils";

const overviewIcons = {
  Droplets,
  ListChecks,
  ShieldCheck,
  Cpu,
  FileText,
  Users,
  Wrench,
  History,
  Info,
} as const;

const featureIcons = [
  Bell,
  ShieldCheck,
  Wrench,
  Users,
  FileText,
  CheckCircle2,
  Droplets,
  History,
  FileText,
  Wrench,
  Cpu,
  History,
];

function DashboardScreen() {
  const { t, language } = useLanguage();
  const tiles =
    language === "ar"
      ? ["٧٥٪ ديزل", "٩٢٪ مياه", "الطاقم جاهز", "٢ تنبيه"]
      : ["75% Diesel", "92% Water", "Crew OK", "2 Alerts"];
  return (
    <div className="flex h-full flex-col px-4 pb-5 pt-10 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[0.6rem] tracking-[0.2em] text-gold uppercase">{t("application.tanks.brand")}</p>
          <p className="mt-1 text-lg font-medium">
            {language === "ar" ? "لوحة التحكم" : "Dashboard"}
          </p>
        </div>
        <Bell className="size-4 text-white/70" />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {tiles.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/5 p-3 text-[0.7rem] text-white/80 backdrop-blur"
          >
            {item}
          </div>
        ))}
      </div>
      <div className="mt-4 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
        <p className="text-[0.65rem] tracking-[0.16em] text-white/50 uppercase">
          {language === "ar" ? "الخدمة التالية" : "Next service"}
        </p>
        <p className="mt-2 text-sm">
          {language === "ar" ? "خدمة المحرك · ١٤ أغسطس" : "Engine Service · Aug 14"}
        </p>
        <div className="mt-4 h-24 rounded-xl bg-gradient-to-br from-gold/30 to-sky-500/20" />
      </div>
    </div>
  );
}

function OverviewCard({
  card,
  index,
}: {
  card: (typeof appOverviewCards)[number];
  index: number;
}) {
  const { t } = useLanguage();
  const Icon = overviewIcons[card.icon as keyof typeof overviewIcons];
  return (
    <Reveal delay={index * 0.04}>
      <motion.div
        whileHover={{ y: -4 }}
        className="rounded-2xl border border-white/12 bg-white/[0.07] p-5 text-white backdrop-blur-md transition hover:border-gold/35 hover:bg-white/10"
      >
        <Icon className="size-5 text-gold" strokeWidth={1.4} />
        <p className="mt-3 text-sm font-medium leading-snug">
          {t(`application.overview.cards.${card.key}`)}
        </p>
      </motion.div>
    </Reveal>
  );
}

function TanksScreen() {
  const { t } = useLanguage();
  return (
    <div className="flex h-full flex-col px-4 pb-5 pt-10 text-white">
      <p className="text-[0.6rem] tracking-[0.2em] text-gold uppercase">{t("application.tanks.brand")}</p>
      <h3 className="mt-1 text-lg">{t("application.tanks.screenTitle")}</h3>
      <p className="mt-1 text-[0.7rem] text-white/50">{t("application.tanks.updated")}</p>
      <div className="mt-6 grid grid-cols-2 gap-5">
        {tankLevels.map((tank) => (
          <TankRing
            key={tank.id}
            value={tank.value}
            color={tank.color}
            label={t(`application.tanks.${tank.key}`)}
          />
        ))}
      </div>
    </div>
  );
}

function ChecklistScreen() {
  const { t } = useLanguage();
  return (
    <div className="h-full overflow-hidden px-4 pb-4 pt-10 text-white">
      <p className="text-[0.6rem] tracking-[0.2em] text-gold uppercase">Checklist</p>
      <div className="mt-4 space-y-4 overflow-y-auto pb-4">
        {checklistGroups.map((group) => (
          <div key={group.id}>
            <p className="text-[0.65rem] tracking-[0.16em] text-white/45 uppercase">
              {t(`application.checklist.groups.${group.key}`)}
            </p>
            <ul className="mt-2 space-y-2">
              {group.items.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/85"
                >
                  <CheckCircle2 className="size-3.5 text-emerald-400" />
                  {t(`application.checklist.items.${item}`)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesScreen() {
  const { t } = useLanguage();
  const tone = {
    completed: "bg-emerald-400/20 text-emerald-300",
    upcoming: "bg-amber-400/20 text-amber-300",
    overdue: "bg-rose-400/20 text-rose-300",
  } as const;

  return (
    <div className="flex h-full flex-col px-4 pb-5 pt-10 text-white">
      <p className="text-[0.6rem] tracking-[0.2em] text-gold uppercase">Services</p>
      <h3 className="mt-1 text-lg">{t("application.services.title")}</h3>
      <div className="mt-5 space-y-2 overflow-y-auto">
        {upcomingServices.map((service) => (
          <div
            key={service.id}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3"
          >
            <div>
              <p className="text-sm">{t(`application.services.items.${service.key}`)}</p>
              <p className="mt-1 text-[0.7rem] text-white/45">
                {t(`application.services.dates.${service.dateKey}`)}
              </p>
            </div>
            <span className={cn("rounded-full px-2.5 py-1 text-[0.6rem] uppercase", tone[service.status])}>
              {t(`application.services.status.${service.status}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApplicationSections() {
  const { t, isRTL } = useLanguage();

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden pt-12 pb-16">
        <div className="absolute inset-0">
          <img src={aboutMarina} alt="" aria-hidden className="size-full object-cover scale-110 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#03111f]/95 via-[#07263a]/80 to-[#0a3a4a]/70" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(200,169,106,0.18),transparent_40%)]" />
        </div>
        {[...Array(12)].map((_, index) => (
          <motion.span
            key={index}
            aria-hidden
            className="absolute size-1 rounded-full bg-white/40"
            style={{
              left: `${8 + index * 7}%`,
              top: `${12 + ((index * 17) % 70)}%`,
            }}
            animate={{ y: [0, -18, 0], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 4 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}

        <div className="container-luxe relative z-10 grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-xl text-white">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[0.7rem] tracking-[0.28em] text-gold uppercase"
            >
              {t("application.hero.eyebrow")}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-5 whitespace-pre-line font-display text-4xl leading-[1.1] sm:text-5xl lg:text-6xl"
            >
              {isRTL ? t("application.hero.titleAr") : t("application.hero.title")}
            </motion.h1>
            {isRTL ? (
              <p className="mt-4 text-lg text-white/75">{t("application.hero.subtitleAr")}</p>
            ) : null}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg"
            >
              {t("application.hero.description")}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            >
              <Link
                to="/contact"
                className="border border-gold bg-gold px-6 py-3.5 text-center text-[0.7rem] tracking-[0.18em] text-navy uppercase transition hover:bg-transparent hover:text-gold"
              >
                {t("application.hero.ask")}
              </Link>
              <a
                href="#download"
                className="border border-white/35 px-6 py-3.5 text-center text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:border-white hover:bg-white/10"
              >
                {t("application.hero.appStore")}
              </a>
              <a
                href="#download"
                className="border border-white/35 px-6 py-3.5 text-center text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:border-white hover:bg-white/10"
              >
                {t("application.hero.googlePlay")}
              </a>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: [0, -12, 0] }}
            transition={{
              opacity: { duration: 0.8 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="relative flex justify-center"
          >
            <PhoneFrame>
              <DashboardScreen />
            </PhoneFrame>
          </motion.div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="relative overflow-hidden bg-[#061525] py-24 lg:py-32">
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

          {/* Mobile: phone then cards */}
          <div className="mt-14 flex flex-col items-center gap-10 lg:hidden">
            <Reveal>
              <PhoneFrame>
                <DashboardScreen />
              </PhoneFrame>
            </Reveal>
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
              {appOverviewCards.map((card, index) => (
                <OverviewCard key={card.id} card={card} index={index} />
              ))}
            </div>
          </div>

          {/* Desktop: cards flank the phone — no overlap */}
          <div className="mt-16 hidden items-center gap-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-10 xl:gap-14">
            <div className="flex flex-col gap-4">
              {appOverviewCards.slice(0, 4).map((card, index) => (
                <OverviewCard key={card.id} card={card} index={index} />
              ))}
            </div>

            <Reveal className="relative z-10 flex justify-center px-2">
              <PhoneFrame>
                <DashboardScreen />
              </PhoneFrame>
            </Reveal>

            <div className="flex flex-col gap-4">
              {appOverviewCards.slice(4).map((card, index) => (
                <OverviewCard key={card.id} card={card} index={index + 4} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TANKS */}
      <section className="bg-background py-24 lg:py-32">
        <div className="container-luxe grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="left" className="flex justify-center">
            <PhoneFrame>
              <TanksScreen />
            </PhoneFrame>
          </Reveal>
          <Reveal direction="right">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("application.tanks.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{t("application.tanks.title")}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("application.tanks.description")}
            </p>
            {isRTL ? null : (
              <>
                <p className="mt-6 font-display text-2xl text-navy/80">{t("application.tanks.titleAr")}</p>
                <p className="mt-3 max-w-xl font-arabic text-muted-foreground">{t("application.tanks.descriptionAr")}</p>
              </>
            )}
          </Reveal>
        </div>
      </section>

      {/* CHECKLIST */}
      <section className="bg-sand py-24 lg:py-32">
        <div className="container-luxe grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="left" className="order-2 lg:order-1">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("application.checklist.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{t("application.checklist.title")}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("application.checklist.description")}
            </p>
            {!isRTL ? (
              <>
                <p className="mt-6 font-display text-2xl text-navy/80">{t("application.checklist.titleAr")}</p>
                <p className="mt-3 max-w-xl font-arabic text-muted-foreground">{t("application.checklist.descriptionAr")}</p>
              </>
            ) : null}
          </Reveal>
          <Reveal direction="right" className="order-1 flex justify-center lg:order-2">
            <PhoneFrame>
              <ChecklistScreen />
            </PhoneFrame>
          </Reveal>
        </div>
      </section>

      {/* SERVICES */}
      <section className="bg-[#071a2b] py-24 lg:py-32">
        <div className="container-luxe grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="left" className="flex justify-center">
            <PhoneFrame>
              <ServicesScreen />
            </PhoneFrame>
          </Reveal>
          <Reveal direction="right" className="text-white">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("application.services.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl sm:text-5xl">{t("application.services.title")}</h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t("application.services.description")}
            </p>
            {!isRTL ? (
              <>
                <p className="mt-6 font-display text-2xl text-white/85">{t("application.services.titleAr")}</p>
                <p className="mt-3 max-w-xl font-arabic text-white/60">{t("application.services.descriptionAr")}</p>
              </>
            ) : null}
            <div className="mt-8 flex flex-wrap gap-3 text-[0.65rem] tracking-[0.14em] uppercase">
              <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-emerald-300">{t("application.services.status.completed")}</span>
              <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-amber-300">{t("application.services.status.upcoming")}</span>
              <span className="rounded-full bg-rose-400/15 px-3 py-1.5 text-rose-300">{t("application.services.status.overdue")}</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="bg-background py-24 lg:py-32">
        <div className="container-luxe">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("application.features.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl text-navy sm:text-5xl">{t("application.features.title")}</h2>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {appFeatureCards.map((key, index) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <Reveal key={key} delay={(index % 4) * 0.05}>
                  <motion.article
                    whileHover={{ y: -8 }}
                    className="h-full rounded-2xl border border-navy/10 bg-sand/70 p-6 transition hover:border-gold/40 hover:bg-white hover:shadow-card"
                  >
                    <Icon className="size-6 text-gold" strokeWidth={1.35} />
                    <h3 className="mt-5 text-lg text-navy">{t(`application.features.items.${key}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {t(`application.features.items.${key}.description`)}
                    </p>
                  </motion.article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section className="overflow-hidden bg-[#050f1c] py-24 lg:py-32">
        <div className="container-luxe">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">{t("application.gallery.eyebrow")}</p>
            <h2 className="mt-4 font-display text-3xl text-white sm:text-5xl">{t("application.gallery.title")}</h2>
          </Reveal>
          <div className="mt-16 flex flex-wrap items-end justify-center gap-6 lg:gap-8">
            {galleryScreens.map((screen, index) => (
              <Reveal key={screen} delay={index * 0.06}>
                <motion.div
                  animate={{ y: [0, index % 2 === 0 ? -12 : 12, 0] }}
                  transition={{ duration: 5 + index * 0.2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-[180px] sm:w-[200px]"
                >
                  <PhoneFrame className="w-full" glow={false}>
                    {screen === "tanks" ? (
                      <TanksScreen />
                    ) : screen === "checklist" ? (
                      <ChecklistScreen />
                    ) : screen === "services" ? (
                      <ServicesScreen />
                    ) : (
                      <DashboardScreen />
                    )}
                  </PhoneFrame>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="relative overflow-hidden py-28 lg:py-36">
        <div className="absolute inset-0">
          <img src={aboutMarina} alt="" aria-hidden className="size-full object-cover" />
          <div className="absolute inset-0 bg-navy/80" />
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
            {!isRTL ? (
              <>
                <p className="mt-6 font-display text-2xl text-gold">{t("application.download.titleAr")}</p>
                <p className="mt-2 font-arabic text-white/65">{t("application.download.descriptionAr")}</p>
              </>
            ) : null}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#"
                className="min-w-[220px] border border-gold bg-gold px-6 py-4 text-[0.7rem] tracking-[0.18em] text-navy uppercase transition hover:bg-transparent hover:text-gold"
              >
                {t("application.download.appStore")}
              </a>
              <a
                href="#"
                className="min-w-[220px] border border-white/40 px-6 py-4 text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:border-white hover:bg-white/10"
              >
                {t("application.download.googlePlay")}
              </a>
              <Link
                to="/contact"
                className="min-w-[220px] border border-white/40 px-6 py-4 text-[0.7rem] tracking-[0.18em] text-white uppercase transition hover:border-gold hover:text-gold"
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
