import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: ReactNode;
  submitLabel?: string;
  busy?: boolean;
}

export function Modal({
  open,
  title,
  onClose,
  onSubmit,
  children,
  submitLabel,
  busy = false,
}: ModalProps) {
  const { t } = useLanguage();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-end bg-navy/45 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="admin-hide-scrollbar flex max-h-[92dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-2xl border border-navy/8 bg-white shadow-luxe sm:max-h-[88vh] sm:rounded-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-navy/8 px-4 py-4 sm:px-6 sm:py-5">
              <h2 className="min-w-0 truncate font-display text-lg text-navy">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("admin.actions.cancel")}
                className="grid size-11 shrink-0 place-items-center rounded-lg text-navy/40 transition-colors hover:bg-[#faf8f4] hover:text-navy"
              >
                <X className="size-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-col gap-5 px-4 py-5 sm:px-6 sm:py-6">{children}</div>

            {onSubmit ? (
              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-navy/8 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6 sm:py-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-navy/10 px-5 py-3 text-xs tracking-[0.16em] text-navy/65 uppercase transition-colors hover:text-navy"
                >
                  {t("admin.actions.cancel")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSubmit}
                  className="rounded-full bg-navy px-5 py-3 text-xs tracking-[0.16em] text-white uppercase transition-colors hover:bg-navy/90 disabled:opacity-60"
                >
                  {submitLabel ?? t("admin.actions.save")}
                </button>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ModalField({
  label,
  value,
  onChange,
  textarea = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.6rem] tracking-[0.22em] text-navy/40 uppercase">{label}</span>
      {textarea ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="resize-none rounded-xl border border-navy/10 bg-[#faf8f4] px-4 py-3 text-sm outline-none transition-colors focus:border-navy/30"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-xl border border-navy/10 bg-[#faf8f4] px-4 py-3 text-sm outline-none transition-colors focus:border-navy/30"
        />
      )}
    </label>
  );
}
