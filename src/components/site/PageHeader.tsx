import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  image: string;
  compact?: boolean;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  image,
  compact = false,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "relative flex w-full items-end overflow-hidden",
        compact
          ? "min-h-[34vh] pb-10 sm:min-h-[36vh] sm:pb-14"
          : "min-h-[38vh] pb-10 sm:min-h-[44vh] sm:pb-16 lg:min-h-[50vh] lg:pb-20",
      )}
    >
      <div className="absolute inset-0 bg-navy">
        <img
          src={image}
          alt=""
          aria-hidden
          className="size-full object-cover object-[center_40%] sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050d18]/70 via-[#050d18]/25 to-transparent sm:from-[#050d18]/55 sm:via-transparent" />
      </div>

      <div className="container-luxe relative z-10 w-full">
        <div className="max-w-xl text-start">
          {eyebrow ? (
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="eyebrow block"
            >
              {eyebrow}
            </motion.span>
          ) : null}

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="type-display-l mt-3 whitespace-pre-line text-balance text-white sm:mt-4"
          >
            {title}
          </motion.h1>

          <motion.span
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="gold-rule mt-4 origin-start sm:mt-6"
          />

          {subtitle ? (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.8 }}
              className="type-body mt-4 max-w-md text-white/80 sm:mt-6 sm:max-w-xl"
            >
              {subtitle}
            </motion.p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
