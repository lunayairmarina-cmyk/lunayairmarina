import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { useLanguage } from "@/lib/i18n";
import { useCompanySettings, useCompanyAddress } from "@/hooks/useCompanySettings";
import { ingestContactLead } from "@/services/adminCmsService";
import { buildSeoHead } from "@/services/seoService";
import { usePageHeaderImage } from "@/hooks/usePageHeaderImage";
import { SERVICE_DEFINITIONS } from "@/data/services";
import contactHeader from "@/assets/headers/header-contact.jpg";
import loungeImage from "@/assets/gallery/gallery-03-lounge.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  head: () => buildSeoHead("contact", "/contact"),
  component: ContactPage,
});

interface Pathway {
  title: string;
  body: string;
  cta: string;
}

interface LoungeHour {
  day: string;
  time: string;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  yachtType: string;
  yachtLength: string;
  yachtLocation: string;
  serviceNeeded: string;
  message: string;
}

const emptyForm: FormState = {
  name: "",
  email: "",
  phone: "",
  yachtType: "",
  yachtLength: "",
  yachtLocation: "",
  serviceNeeded: "",
  message: "",
};

function ContactPage() {
  const { t, tv, isRTL, language } = useLanguage();
  const settings = useCompanySettings();
  const address = useCompanyAddress();
  const headerImage = usePageHeaderImage("contact", contactHeader);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const CtaArrow = isRTL ? ArrowLeft : ArrowRight;

  const pathways = useMemo(() => {
    return [
      tv<Pathway>("contact.pathways.visit"),
      tv<Pathway>("contact.pathways.emergency"),
      tv<Pathway>("contact.pathways.charter"),
    ].filter((item): item is Pathway =>
      Boolean(item && typeof item === "object" && "title" in item && item.title),
    );
  }, [tv]);

  const loungeHours = useMemo(() => {
    const hours = tv<LoungeHour[]>("contact.lounge.hours");
    return Array.isArray(hours) ? hours : [];
  }, [tv]);

  const serviceOptions = useMemo(
    () =>
      SERVICE_DEFINITIONS.map((service) => ({
        slug: service.slug,
        label: t(`services.details.${service.slug}.title`),
      })),
    [t],
  );

  const yachtTypeOptions = useMemo(
    () =>
      (["motor", "sailing", "explorer", "superyacht", "catamaran", "other"] as const).map(
        (key) => ({
          key,
          label: t(`contact.form.yachtTypeOptions.${key}`),
        }),
      ),
    [t],
  );

  const yachtLocationOptions = useMemo(
    () =>
      (
        ["jeddah", "redSea", "neom", "dubai", "abuDhabi", "bahrain", "otherGulf", "other"] as const
      ).map((key) => ({
        key,
        label: t(`contact.form.yachtLocationOptions.${key}`),
      })),
    [t],
  );

  const channels = [
    {
      icon: Phone,
      label: t("contact.channels.concierge.label"),
      value: settings.phoneDisplay ?? settings.phone,
      note: t("contact.channels.concierge.note"),
      href: `tel:${settings.phone}`,
      ltr: true,
    },
    {
      icon: Mail,
      label: t("contact.channels.email.label"),
      value: settings.email,
      note: t("contact.channels.email.note"),
      href: `mailto:${settings.email}`,
      ltr: true,
    },
    {
      icon: MapPin,
      label: t("contact.channels.office.label"),
      value: address,
      note: t("contact.channels.office.note"),
      href: undefined,
      ltr: false,
    },
  ];

  const whatsappHref = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
    language === "ar"
      ? "مرحباً، أود طلب استشارة إدارة يخوت."
      : "Hello, I would like a yacht management consultation.",
  )}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.yachtType.trim() ||
      !form.yachtLength.trim() ||
      !form.yachtLocation.trim() ||
      !form.serviceNeeded.trim()
    ) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await ingestContactLead({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || form.serviceNeeded,
        yachtType: form.yachtType.trim(),
        yachtLength: form.yachtLength.trim(),
        yachtLocation: form.yachtLocation.trim(),
        serviceNeeded: form.serviceNeeded.trim(),
      });
      setStatus("success");
      setForm(emptyForm);
    } catch {
      setStatus("error");
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        image={headerImage}
        imagePosition="32% 42%"
        overlay="strong"
      />

      <section id="contact-form" className="bg-sand py-16 lg:py-24">
        <div className="container-luxe grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal direction="left">
            <p className="eyebrow">{t("contact.info.title")}</p>
            <h2 className="type-display-m mt-3 text-navy sm:mt-4">{t("contact.info.subtitle")}</h2>

            <ul className="mt-8 space-y-3">
              {channels.map((channel) => (
                <li
                  key={channel.label}
                  className="rounded-2xl border border-navy/10 bg-background/80 p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                      <channel.icon className="size-4" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
                        {channel.label}
                      </p>
                      {channel.href ? (
                        <a
                          href={channel.href}
                          className="mt-1 block text-sm font-medium text-navy transition-colors hover:text-gold sm:text-base"
                          dir={channel.ltr ? "ltr" : undefined}
                        >
                          {channel.value}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm leading-relaxed text-navy sm:text-base">
                          {channel.value}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{channel.note}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-3.5 text-[0.7rem] tracking-[0.16em] text-[#128C7E] uppercase transition hover:bg-[#25D366] hover:text-white"
            >
              <MessageCircle className="size-4" strokeWidth={1.5} />
              WhatsApp
            </a>

            <div className="mt-8 flex items-center gap-4 border-s-2 border-gold ps-5">
              <p className="font-latin-display text-4xl text-navy sm:text-5xl" dir="ltr">
                {t("contact.response.value")}
              </p>
              <div>
                <p className="text-sm text-navy">{t("contact.response.unit")}</p>
                <p className="text-xs text-muted-foreground">{t("contact.response.label")}</p>
                <p className="mt-1 text-[0.65rem] text-muted-foreground">
                  {t("contact.response.caption")}
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="rounded-3xl border border-navy/10 bg-background p-5 shadow-sm sm:p-8 lg:p-10"
            >
              <p className="eyebrow">{t("contact.formSection.title")}</p>
              <h2 className="type-display-m mt-3 text-navy sm:mt-4">
                {t("contact.formSection.subtitle")}
              </h2>

              {status === "success" ? (
                <div className="mt-10 flex flex-col items-center gap-4 py-10 text-center">
                  <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="size-7" strokeWidth={1.5} />
                  </span>
                  <p className="max-w-sm text-base text-navy">{t("contact.form.success")}</p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="text-[0.7rem] tracking-[0.18em] text-gold uppercase transition hover:text-navy"
                  >
                    {t("contact.form.submitAnother")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-8 grid gap-5 sm:grid-cols-2 sm:gap-6">
                    <Field
                      id="page-contact-name"
                      label={t("contact.form.name")}
                      placeholder={t("contact.form.namePlaceholder")}
                      value={form.name}
                      required
                      onChange={(value) => setForm({ ...form, name: value })}
                    />
                    <Field
                      id="page-contact-email"
                      type="email"
                      label={t("contact.form.email")}
                      placeholder={t("contact.form.emailPlaceholder")}
                      value={form.email}
                      required
                      ltr
                      onChange={(value) => setForm({ ...form, email: value })}
                    />
                    <Field
                      id="page-contact-phone"
                      type="tel"
                      label={t("contact.form.phone")}
                      placeholder={t("contact.form.phonePlaceholder")}
                      value={form.phone}
                      required
                      ltr
                      onChange={(value) => setForm({ ...form, phone: value })}
                    />
                    <div>
                      <label
                        htmlFor="page-contact-yacht-type"
                        className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase"
                      >
                        {t("contact.form.yachtType")}
                        <span className="ms-1 text-gold">*</span>
                      </label>
                      <select
                        id="page-contact-yacht-type"
                        required
                        value={form.yachtType}
                        onChange={(event) => setForm({ ...form, yachtType: event.target.value })}
                        className="mt-2 w-full appearance-none border-b border-navy/20 bg-transparent py-3 text-sm text-navy outline-none transition-colors focus:border-gold"
                      >
                        <option value="">{t("contact.form.yachtTypePlaceholder")}</option>
                        {yachtTypeOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Field
                      id="page-contact-yacht-length"
                      label={t("contact.form.yachtLength")}
                      placeholder={t("contact.form.yachtLengthPlaceholder")}
                      value={form.yachtLength}
                      required
                      onChange={(value) => setForm({ ...form, yachtLength: value })}
                    />
                    <div>
                      <label
                        htmlFor="page-contact-yacht-location"
                        className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase"
                      >
                        {t("contact.form.yachtLocation")}
                        <span className="ms-1 text-gold">*</span>
                      </label>
                      <select
                        id="page-contact-yacht-location"
                        required
                        value={form.yachtLocation}
                        onChange={(event) =>
                          setForm({ ...form, yachtLocation: event.target.value })
                        }
                        className="mt-2 w-full appearance-none border-b border-navy/20 bg-transparent py-3 text-sm text-navy outline-none transition-colors focus:border-gold"
                      >
                        <option value="">{t("contact.form.yachtLocationPlaceholder")}</option>
                        {yachtLocationOptions.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6">
                    <label
                      htmlFor="page-contact-service"
                      className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase"
                    >
                      {t("contact.form.serviceNeeded")}
                      <span className="ms-1 text-gold">*</span>
                    </label>
                    <select
                      id="page-contact-service"
                      required
                      value={form.serviceNeeded}
                      onChange={(event) => setForm({ ...form, serviceNeeded: event.target.value })}
                      className="mt-2 w-full appearance-none border-b border-navy/20 bg-transparent py-3 text-sm text-navy outline-none transition-colors focus:border-gold"
                    >
                      <option value="">{t("contact.form.serviceNeededPlaceholder")}</option>
                      {serviceOptions.map((option) => (
                        <option key={option.slug} value={option.slug}>
                          {option.label}
                        </option>
                      ))}
                      <option value="other">{t("contact.form.serviceOther")}</option>
                    </select>
                  </div>

                  <div className="mt-5 flex flex-col gap-2 sm:mt-6">
                    <label
                      htmlFor="page-contact-message"
                      className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase"
                    >
                      {t("contact.form.message")}
                    </label>
                    <textarea
                      id="page-contact-message"
                      rows={4}
                      placeholder={t("contact.form.messagePlaceholder")}
                      value={form.message}
                      onChange={(event) => setForm({ ...form, message: event.target.value })}
                      className="resize-none border-b border-navy/20 bg-transparent py-3 text-sm text-navy outline-none transition-colors placeholder:text-navy/30 focus:border-gold"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.98 }}
                    disabled={status === "sending"}
                    className="mt-8 inline-flex w-full items-center justify-center gap-2 border border-navy bg-navy px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy-foreground uppercase transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy disabled:opacity-60"
                  >
                    {status === "sending" ? t("contact.form.sending") : t("contact.form.submit")}
                    <CtaArrow className="size-3.5" strokeWidth={1.5} />
                  </motion.button>

                  <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5 text-gold" strokeWidth={1.5} />
                    {t("contact.formSection.replyNote")}
                  </p>

                  {status === "error" ? (
                    <p className="mt-3 text-xs text-destructive">{t("contact.form.error")}</p>
                  ) : null}
                </>
              )}
            </form>
          </Reveal>
        </div>
      </section>

      {pathways.length > 0 ? (
        <section className="bg-background py-16 lg:py-24">
          <div className="container-luxe">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">{t("contact.pathwaysSection.eyebrow")}</p>
              <h2 className="type-display-m mt-3 text-navy">
                {t("contact.pathwaysSection.title")}
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
              {pathways.map((pathway, index) => (
                <Reveal key={pathway.title} delay={index * 0.06}>
                  <article className="flex h-full flex-col rounded-3xl border border-navy/10 bg-sand/60 p-6 transition hover:border-gold/35 hover:bg-white hover:shadow-card sm:p-7">
                    <span className="font-latin-display text-sm text-gold">0{index + 1}</span>
                    <h3 className="type-display-s mt-4 text-navy">{pathway.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {pathway.body}
                    </p>
                    <a
                      href="#contact-form"
                      className="mt-6 inline-flex items-center gap-2 text-[0.68rem] tracking-[0.16em] text-navy uppercase transition-colors hover:text-gold"
                    >
                      {pathway.cta}
                      <CtaArrow className="size-3.5" strokeWidth={1.5} />
                    </a>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-navy py-16 lg:py-24">
        <div className="container-luxe grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <Reveal direction="left">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("contact.lounge.eyebrow")}
            </p>
            <h2 className="type-display-m mt-4 text-navy-foreground">
              {t("contact.lounge.title")}
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-navy-foreground/65 sm:text-base">
              {t("contact.lounge.body")}
            </p>

            {loungeHours.length > 0 ? (
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {loungeHours.map((item) => (
                  <li
                    key={item.day}
                    className="rounded-2xl border border-navy-foreground/10 bg-navy-foreground/[0.04] p-4"
                  >
                    <p className="text-[0.65rem] tracking-[0.18em] text-gold/80 uppercase">
                      {item.day}
                    </p>
                    <p className="mt-2 text-navy-foreground" dir="ltr">
                      {item.time}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <div className="overflow-hidden rounded-3xl border border-navy-foreground/10">
              <img
                src={loungeImage}
                alt={t("contact.lounge.imageAlt")}
                loading="lazy"
                width={1200}
                height={900}
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  ltr = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  ltr?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase"
      >
        {label}
        {required ? <span className="ms-1 text-gold">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        dir={ltr ? "ltr" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "border-b border-navy/20 bg-transparent py-3 text-sm text-navy outline-none transition-colors placeholder:text-navy/30 focus:border-gold",
          ltr && "text-start",
        )}
      />
    </div>
  );
}
