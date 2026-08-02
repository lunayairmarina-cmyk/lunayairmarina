import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({ variant = "default" }: { variant?: "default" | "home" }) {
  const { t, tv, language } = useLanguage();
  const remote = useOptionalSiteContent()?.bundle?.faq ?? [];
  const items: FaqItem[] =
    remote.length > 0
      ? remote.map((item) => ({
          question: localizeValue(item.question, language),
          answer: localizeValue(item.answer, language),
        }))
      : (tv<FaqItem[]>("faq.items") ?? []);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={cn("py-24 lg:py-32", variant === "home" ? "bg-[#fbfaf7]" : "bg-background")}>
      <div className="container-luxe grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <SectionHeading eyebrow={t("faq.eyebrow")} title={t("faq.title")} align="start" />

        <div className="divide-y divide-border border-y border-border">
          {items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-6 text-start"
                >
                  <span
                    className={cn(
                      "font-display text-lg transition-colors",
                      isOpen ? "text-gold" : "text-navy",
                    )}
                  >
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.35 }}
                    className="shrink-0 text-gold"
                  >
                    <Plus className="size-5" strokeWidth={1.5} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-sm leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
