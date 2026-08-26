import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { useOptionalSiteContent, localizeOrFallback } from "@/providers/SiteContentProvider";

interface FaqItem {
  question: string;
  answer: string;
}

export function FaqSection({ variant = "default" }: { variant?: "default" | "home" }) {
  const { t, tv, language } = useLanguage();
  const remote = useOptionalSiteContent()?.bundle?.faq ?? [];
  const localeItems = tv<FaqItem[]>("faq.items") ?? [];
  const items: FaqItem[] =
    remote.length > 0
      ? remote.map((item, index) => ({
          question: localizeOrFallback(item.question, language, localeItems[index]?.question ?? ""),
          answer: localizeOrFallback(item.answer, language, localeItems[index]?.answer ?? ""),
        }))
      : localeItems;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className={cn(
        "py-16 sm:py-20 lg:py-24",
        variant === "home" ? "bg-[#fbfaf7]" : "bg-background",
      )}
    >
      <div className="container-luxe grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 xl:gap-20">
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
                  className="flex w-full items-start justify-between gap-3 py-5 text-start sm:items-center sm:gap-6 sm:py-6"
                >
                  <span
                    className={cn(
                      "font-display text-base transition-colors sm:text-lg",
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
