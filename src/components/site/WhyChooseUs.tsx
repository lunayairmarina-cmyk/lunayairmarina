import { motion } from "motion/react";
import { Award, Clock, Globe2, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { staggerContainer, staggerItem } from "@/components/shared/Reveal";
import { useOptionalSiteContent, localizeValue } from "@/providers/SiteContentProvider";
import { cn } from "@/lib/utils";

interface WhyItem {
  title: string;
  description: string;
}

const icons = [Award, Globe2, Clock, Sparkles];

export function WhyChooseUs({ variant = "default" }: { variant?: "default" | "home" }) {
  const { t, tv, language } = useLanguage();
  const why = useOptionalSiteContent()?.bundle?.why;
  const items: WhyItem[] = why
    ? why.items.map((item) => ({
        title: localizeValue(item.title, language),
        description: localizeValue(item.description, language),
      }))
    : (tv<WhyItem[]>("why.items") ?? []);
  const eyebrow = why ? localizeValue(why.eyebrow, language) : t("why.eyebrow");
  const title = why ? localizeValue(why.title, language) : t("why.title");

  return (
    <section
      className={cn(
        "py-24 lg:py-32",
        variant === "home" ? "bg-[#f3efe7]" : "bg-background",
      )}
    >
      <div className="container-luxe">
        <SectionHeading eyebrow={eyebrow} title={title} align="start" />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mt-14 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {items.map((item, index) => {
            const Icon = icons[index % icons.length];
            return (
              <motion.div
                key={`${item.title}-${index}`}
                variants={staggerItem}
                className={cn(
                  "group p-9 transition-colors duration-500 hover:bg-navy",
                  variant === "home" ? "bg-white" : "bg-sand",
                )}
              >
                <Icon
                  className="size-7 text-gold transition-transform duration-500 group-hover:scale-110"
                  strokeWidth={1.3}
                />
                <h3 className="mt-6 text-lg text-navy transition-colors duration-500 group-hover:text-navy-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground transition-colors duration-500 group-hover:text-navy-foreground/60">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
