import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Reveal } from "@/components/shared/Reveal";
import { useCompanySettings, useCompanyAddress } from "@/hooks/useCompanySettings";
import { ingestContactLead } from "@/services/adminCmsService";

interface FormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const emptyForm: FormState = { name: "", email: "", phone: "", message: "" };

/** Homepage contact teaser — full page lives in `/contact`. */
export function ContactSection() {
  const { t } = useLanguage();
  const settings = useCompanySettings();
  const address = useCompanyAddress();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      await ingestContactLead({
        name: form.name,
        email: form.email,
        phone: "",
        message: form.message,
      });
      setStatus("success");
      setForm(emptyForm);
    } catch {
      setStatus("error");
    }
  };

  const details = [
    {
      icon: Phone,
      label: t("contact.channels.concierge.label"),
      value: settings.phoneDisplay ?? settings.phone,
      note: t("contact.channels.concierge.note"),
      ltr: true,
    },
    {
      icon: Mail,
      label: t("contact.email"),
      value: settings.email,
      note: t("contact.channels.email.note"),
      ltr: true,
    },
    {
      icon: MapPin,
      label: t("contact.location"),
      value: address,
      note: t("contact.channels.office.note"),
      ltr: false,
    },
    {
      icon: Clock,
      label: t("contact.response.label"),
      value: `${t("contact.response.value")} ${t("contact.response.unit")}`,
      note: t("contact.formSection.replyNote"),
      ltr: false,
    },
  ];

  return (
    <section className="bg-navy py-24 lg:py-32">
      <div className="container-luxe grid gap-14 lg:grid-cols-2 lg:gap-20">
        <div className="flex flex-col gap-10">
          <Reveal direction="left">
            <span className="eyebrow">{t("contact.eyebrow")}</span>
            <h2 className="mt-4 text-3xl leading-tight text-navy-foreground sm:text-4xl lg:text-5xl">
              {t("contact.title")}
            </h2>
            <span className="gold-rule mt-6" />
            <p className="mt-6 max-w-md leading-relaxed text-navy-foreground/60">
              {t("contact.subtitle")}
            </p>
          </Reveal>

          <Reveal direction="left" delay={0.12}>
            <ul className="grid gap-6 sm:grid-cols-2">
              {details.map((detail) => (
                <li key={detail.label} className="glass-card rounded-lg p-6">
                  <detail.icon className="size-5 text-gold" strokeWidth={1.4} />
                  <p className="mt-4 text-[0.6rem] tracking-[0.24em] text-navy-foreground/45 uppercase">
                    {detail.label}
                  </p>
                  <p
                    className="mt-1 text-sm text-navy-foreground/85"
                    dir={detail.ltr ? "ltr" : undefined}
                  >
                    {detail.value}
                  </p>
                  <p className="mt-2 text-xs text-navy-foreground/45">{detail.note}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal direction="right" delay={0.1}>
          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="glass-card flex flex-col gap-5 rounded-lg p-5 sm:p-8 lg:p-10"
          >
            <Field
              id="contact-name"
              label={t("contact.form.name")}
              value={form.name}
              onChange={(value) => setForm({ ...form, name: value })}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field
                id="contact-email"
                type="email"
                label={t("contact.form.email")}
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
              />
              <Field
                id="contact-phone"
                type="tel"
                label={t("contact.form.phone")}
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="contact-message"
                className="text-[0.6rem] tracking-[0.22em] text-navy-foreground/50 uppercase"
              >
                {t("contact.form.message")}
              </label>
              <textarea
                id="contact-message"
                rows={5}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                className="resize-none border-b border-navy-foreground/20 bg-transparent py-3 text-sm text-navy-foreground outline-none transition-colors placeholder:text-navy-foreground/30 focus:border-gold"
              />
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={status === "sending"}
              className="mt-2 border border-gold bg-gold px-8 py-4 text-[0.7rem] tracking-[0.22em] text-navy uppercase transition-all duration-500 hover:bg-transparent hover:text-gold disabled:opacity-60"
            >
              {status === "sending" ? t("contact.form.sending") : t("contact.form.submit")}
            </motion.button>

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
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[0.6rem] tracking-[0.22em] text-navy-foreground/50 uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border-b border-navy-foreground/20 bg-transparent py-3 text-sm text-navy-foreground outline-none transition-colors focus:border-gold"
      />
    </div>
  );
}
