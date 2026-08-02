import type { ReactNode } from "react";
import { motion } from "motion/react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppButton } from "./WhatsAppButton";

interface SiteLayoutProps {
  children: ReactNode;
  transparentNav?: boolean;
}

export function SiteLayout({ children, transparentNav = false }: SiteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar transparent={transparentNav} />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1"
      >
        {children}
      </motion.main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
