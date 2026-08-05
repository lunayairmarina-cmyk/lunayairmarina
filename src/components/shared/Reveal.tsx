import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealDirection = "up" | "left" | "right" | "scale" | "fade";

const offsets: Record<RevealDirection, { x?: number; y?: number; scale?: number }> = {
  up: { y: 28 },
  left: { x: -32 },
  right: { x: 32 },
  scale: { scale: 0.94 },
  fade: {},
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: RevealDirection;
  as?: "div" | "section" | "li" | "article" | "span";
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = "up",
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as] as typeof motion.div;
  const offset = offsets[direction];

  return (
    <MotionTag
      className={className}
      // Below-the-fold only: keep content readable if JS is slow (start nearly visible).
      initial={{ opacity: 0.55, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px", amount: 0.15 }}
      transition={{ duration: 0.45, delay: Math.min(delay, 0.08), ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0.55, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={cn(className)}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}
