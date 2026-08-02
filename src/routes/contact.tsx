import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { PageHeader } from "@/components/site/PageHeader";
import { Reveal } from "@/components/shared/Reveal";
import { useLanguage } from "@/lib/i18n";
import { useCompanySettings, useCompanyAddress } from "@/hooks/useCompanySettings";
import { ingestContactLead } from "@/services/adminCmsService";
import { buildSeoHead } from "@/services/seoService";
import { usePageHeaderImage } from "@/hooks/usePageHeaderImage";
import contactHeader from "@/assets/about-marina.jpg";
import loungeImage from "@/assets/gallery-3.jpg";

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
  const { t, tv, isRTL } = useLanguage();
  const settings = useCompanySettings();
  const address = useCompanyAddress();
  const headerImage = usePageHeaderImage("contact", contactHeader);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const CtaArrow = isRTL ? ArrowLeft : ArrowRight;

  const pathways = [
    tv<Pathway>("contact.pathways.visit"),
    tv<Pathway>("contact.pathways.emergency"),
    tv<Pathway>("contact.pathways.charter"),
  ].filter(Boolean) as Pathway[];

  const loungeHours = tv<LoungeHour[]>("contact.lounge.hours") ?? [];

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.yachtType ||
      !form.yachtLength ||
      !form.yachtLocation ||
      !form.serviceNeeded
    ) {
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      await ingestContactLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message || form.serviceNeeded,
        yachtType: form.yachtType,
        yachtLength: form.yachtLength,
        yachtLocation: form.yachtLocation,
        serviceNeeded: form.serviceNeeded,
      });
      setStatus("success");
      setForm(emptyForm);
    } catch {
      setStatus("error");
    }
  };

  return (
    <SiteLayout transparentNav>
      <PageHeader
        eyebrow={t("contact.eyebrow")}
        title={t("contact.title")}
        subtitle={t("contact.subtitle")}
        image={headerImage}
        crumb={t("footer.contact")}
        compact
      />

      {/* One focused consultation block */}
      <section id="contact-form" className="bg-sand py-16 lg:py-20">
        <div className="container-luxe grid items-start gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal direction="left">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("contact.info.title")}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-navy sm:text-4xl">
              {t("contact.info.subtitle")}
            </h2>

            <ul className="mt-9 divide-y divide-navy/10 border-y border-navy/10">
              {channels.map((channel) => (
                <li key={channel.label} className="flex items-start gap-4 py-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full border border-gold/45 text-gold">
                    <channel.icon className="size-4" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
                      {channel.label}
                    </p>
                    {channel.href ? (
                      <a
                        href={channel.href}
                        className="mt-1 block text-sm text-navy transition-colors hover:text-gold sm:text-base"
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
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-4 border-s-2 border-gold ps-5">
              <p className="font-display text-4xl text-navy">{t("contact.response.value")}</p>
              <div>
                <p className="text-sm text-navy">{t("contact.response.unit")}</p>
                <p className="text-xs text-muted-foreground">{t("contact.response.label")}</p>
              </div>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="border border-navy/10 bg-background p-7 sm:p-9 lg:p-10"
            >
              <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
                {t("contact.formSection.title")}
              </p>
              <h2 className="mt-3 font-display text-2xl text-navy sm:text-3xl">
                {t("contact.formSection.subtitle")}
              </h2>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                <Field
                  id="page-contact-name"
                  label={t("contact.form.name")}
                  placeholder={t("contact.form.namePlaceholder")}
                  value={form.name}
                  onChange={(value) => setForm({ ...form, name: value })}
                />
                <Field
                  id="page-contact-email"
                  type="email"
                  label={t("contact.form.email")}
                  placeholder={t("contact.form.emailPlaceholder")}
                  value={form.email}
                  onChange={(value) => setForm({ ...form, email: value })}
                />
                <Field
                  id="page-contact-phone"
                  type="tel"
                  label={t("contact.form.phone")}
                  placeholder={t("contact.form.phonePlaceholder")}
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value })}
                />
                <Field
                  id="page-contact-yacht-type"
                  label={t("contact.form.yachtType")}
                  placeholder={t("contact.form.yachtTypePlaceholder")}
                  value={form.yachtType}
                  onChange={(value) => setForm({ ...form, yachtType: value })}
                />
                <Field
                  id="page-contact-yacht-length"
                  label={t("contact.form.yachtLength")}
                  placeholder={t("contact.form.yachtLengthPlaceholder")}
                  value={form.yachtLength}
                  onChange={(value) => setForm({ ...form, yachtLength: value })}
                />
                <Field
                  id="page-contact-yacht-location"
                  label={t("contact.form.yachtLocation")}
                  placeholder={t("contact.form.yachtLocationPlaceholder")}
                  value={form.yachtLocation}
                  onChange={(value) => setForm({ ...form, yachtLocation: value })}
                />
              </div>
              <div className="mt-6">
                <Field
                  id="page-contact-service"
                  label={t("contact.form.serviceNeeded")}
                  placeholder={t("contact.form.serviceNeededPlaceholder")}
                  value={form.serviceNeeded}
                  onChange={(value) => setForm({ ...form, serviceNeeded: value })}
                />
              </div>
              <div className="mt-6 flex flex-col gap-2">
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
                className="mt-7 inline-flex w-full items-center justify-center gap-2 border border-navy bg-navy px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy-foreground uppercase transition-all duration-500 hover:border-gold hover:bg-gold hover:text-navy disabled:opacity-60"
              >
                {status === "sending" ? t("contact.form.sending") : t("contact.form.submit")}
                <CtaArrow className="size-3.5" strokeWidth={1.5} />
              </motion.button>

              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-gold" strokeWidth={1.5} />
                {t("contact.formSection.replyNote")}
              </p>

              {status === "success" && (
                <p className="text-xs text-gold">{t("contact.form.success")}</p>
              )}
              {status === "error" && (
                <p className="text-xs text-destructive">{t("contact.form.error")}</p>
              )}
            </form>
          </Reveal>
        </div>
      </section>

      {/* Service pathways */}
      <section className="bg-background py-16 lg:py-20">
        <div className="container-luxe">
          <div className="grid gap-10 md:grid-cols-3 md:gap-0">
            {pathways.map((pathway, index) => (
              <Reveal
                key={pathway.title}
                delay={index * 0.06}
                className="border-s border-navy/10 ps-6 md:px-8 first:border-gold"
              >
                <span className="font-display text-sm text-gold">0{index + 1}</span>
                <h3 className="mt-4 font-display text-xl text-navy sm:text-2xl">
                  {pathway.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {pathway.body}
                </p>
                <a
                  href="#contact-form"
                  className="mt-5 inline-flex items-center gap-2 text-[0.68rem] tracking-[0.16em] text-navy uppercase transition-colors hover:text-gold"
                >
                  {pathway.cta}
                  <CtaArrow className="size-3.5" strokeWidth={1.5} />
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Compact lounge */}
      <section className="bg-navy py-16 lg:py-20">
        <div className="container-luxe grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <Reveal direction="left">
            <p className="text-[0.7rem] tracking-[0.28em] text-gold uppercase">
              {t("contact.lounge.eyebrow")}
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy-foreground sm:text-4xl">
              {t("contact.lounge.title")}
            </h2>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-navy-foreground/65 sm:text-base">
              {t("contact.lounge.body")}
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {loungeHours.map((item) => (
                <li key={item.day} className="border-t border-navy-foreground/15 pt-4">
                  <p className="text-[0.65rem] tracking-[0.18em] text-gold/80 uppercase">{item.day}</p>
                  <p className="mt-2 text-navy-foreground" dir="ltr">
                    {item.time}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal direction="right" delay={0.08}>
            <img
              src={loungeImage}
              alt={t("contact.lounge.imageAlt")}
              loading="lazy"
              width={1200}
              height={900}
              className="aspect-[16/10] w-full object-cover"
            />
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[0.6rem] tracking-[0.22em] text-muted-foreground uppercase">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="border-b border-navy/20 bg-transparent py-3 text-sm text-navy outline-none transition-colors placeholder:text-navy/30 focus:border-gold"
      />
    </div>
  );
}
