import { useRef, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ModalField } from "@/components/admin/Modal";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveTrust } from "@/services/adminCmsService";
import type { LocalizedString, TrustContent } from "@/types/content";
import enLocale from "@/locales/en.json";
import arLocale from "@/locales/ar.json";

export const Route = createLazyFileRoute("/admin/trust")({
  component: AdminTrustPage,
});

type TrustSlot = TrustContent["slots"][number] & { id: string };

function asLocalized(value: unknown, fallback = ""): LocalizedString {
  if (typeof value === "string") return { en: value, ar: value };
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return {
      en: typeof record.en === "string" ? record.en : fallback,
      ar: typeof record.ar === "string" ? record.ar : fallback,
    };
  }
  return { en: fallback, ar: fallback };
}

function makeSlotId() {
  return `trust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSlot(raw: unknown, index: number): TrustSlot {
  const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    id: typeof item.id === "string" ? item.id : `trust-seed-${index}`,
    title: asLocalized(item.title, "New slot"),
    body: asLocalized(item.body, "Coming soon"),
  };
}

function emptySlot(): TrustSlot {
  return {
    id: makeSlotId(),
    title: { en: "New slot", ar: "خانة جديدة" },
    body: { en: "Coming soon", ar: "قريبًا" },
  };
}

function seedTrust(): { meta: Omit<TrustContent, "slots">; slots: TrustSlot[] } {
  const cms = loadCmsStore();
  const enSlots = (enLocale as { trust: { slots: Array<{ title: string; body: string }> } }).trust
    .slots;
  const arSlots = (arLocale as { trust: { slots: Array<{ title: string; body: string }> } }).trust
    .slots;

  const fallbackSlots = enSlots.map((slot, index) =>
    normalizeSlot(
      {
        title: { en: slot.title, ar: arSlots[index]?.title ?? slot.title },
        body: { en: slot.body, ar: arSlots[index]?.body ?? slot.body },
      },
      index,
    ),
  );

  const source = cms.trust;
  if (!source) {
    return {
      meta: {
        eyebrow: { en: enLocale.trust.eyebrow, ar: arLocale.trust.eyebrow },
        title: { en: enLocale.trust.title, ar: arLocale.trust.title },
        lead: { en: enLocale.trust.lead, ar: arLocale.trust.lead },
        cta: { en: enLocale.trust.cta, ar: arLocale.trust.cta },
      },
      slots: fallbackSlots,
    };
  }

  const rawSlots = Array.isArray(source.slots) ? source.slots : fallbackSlots;
  return {
    meta: {
      eyebrow: asLocalized(source.eyebrow, enLocale.trust.eyebrow),
      title: asLocalized(source.title, enLocale.trust.title),
      lead: asLocalized(source.lead, enLocale.trust.lead),
      cta: asLocalized(source.cta, enLocale.trust.cta),
    },
    slots: rawSlots.map((slot, index) => normalizeSlot(slot, index)),
  };
}

function toTrustContent(meta: Omit<TrustContent, "slots">, slots: TrustSlot[]): TrustContent {
  return {
    ...meta,
    slots: slots.map(({ title, body }) => ({ title, body })),
  };
}

function AdminTrustPage() {
  const { t, language } = useLanguage();
  const seeded = seedTrust();
  const [meta, setMeta] = useState(seeded.meta);
  const [slots, setSlots] = useState<TrustSlot[]>(seeded.slots);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  const addSlot = () => {
    const next = emptySlot();
    setSlots((prev) => [...(Array.isArray(prev) ? prev : []), next]);
    setHighlightId(next.id);
    setStatus(t("admin.trust.slotAdded"));
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== id));
  };

  const updateSlot = (id: string, patch: Partial<Pick<TrustSlot, "title" | "body">>) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
    );
  };

  const save = async () => {
    setBusy(true);
    const result = await saveTrust(toTrustContent(meta, slots));
    setStatus(
      describeSaveResult(result, {
        synced: t("admin.cms.savedSynced"),
        local: t("admin.cms.savedLocal"),
      }),
    );
    setBusy(false);
  };

  return (
    <AdminLayout title={t("admin.nav.trust")}>
      <div className="mb-6 flex items-center justify-between gap-3">
        {status ? <span className="text-xs text-navy/55">{status}</span> : <span />}
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase hover:bg-navy/90 disabled:opacity-60"
        >
          {t("admin.content.save")}
        </button>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-2">
            <ModalField
              label="Eyebrow"
              value={meta.eyebrow[language] ?? ""}
              onChange={(value) =>
                setMeta({ ...meta, eyebrow: { ...meta.eyebrow, [language]: value } })
              }
            />
            <ModalField
              label={t("admin.table.title")}
              value={meta.title[language] ?? ""}
              onChange={(value) =>
                setMeta({ ...meta, title: { ...meta.title, [language]: value } })
              }
            />
            <ModalField
              textarea
              label="Lead"
              value={meta.lead[language] ?? ""}
              onChange={(value) =>
                setMeta({ ...meta, lead: { ...meta.lead, [language]: value } })
              }
            />
            <ModalField
              label="CTA"
              value={meta.cta[language] ?? ""}
              onChange={(value) =>
                setMeta({ ...meta, cta: { ...meta.cta, [language]: value } })
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-navy/8 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg text-navy">{t("admin.trust.slots")}</h3>
              <p className="mt-1 text-xs text-navy/45">
                {slots.length} {t("admin.trust.slotsCount")}
              </p>
            </div>
            <button
              type="button"
              onClick={addSlot}
              className="relative z-10 inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-navy transition-colors hover:border-navy/40 hover:bg-[#faf8f4]"
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
              {t("admin.actions.add")}
            </button>
          </div>

          <div className="space-y-4">
            {slots.map((slot, index) => (
              <div
                key={slot.id}
                className={`rounded-xl border p-4 transition-colors ${
                  highlightId === slot.id
                    ? "border-gold bg-gold/10"
                    : "border-navy/8 bg-[#faf8f4]"
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[0.65rem] tracking-[0.16em] text-navy/40 uppercase">
                    {t("admin.trust.slotLabel")} #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.id)}
                    aria-label={t("admin.actions.delete")}
                    className="rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  <ModalField
                    label={t("admin.table.title")}
                    value={slot.title[language] ?? ""}
                    onChange={(value) =>
                      updateSlot(slot.id, {
                        title: { ...slot.title, [language]: value },
                      })
                    }
                  />
                  <ModalField
                    textarea
                    label={t("admin.table.description")}
                    value={slot.body[language] ?? ""}
                    onChange={(value) =>
                      updateSlot(slot.id, {
                        body: { ...slot.body, [language]: value },
                      })
                    }
                  />
                </div>
              </div>
            ))}
            <div ref={listEndRef} />
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={addSlot}
              className="inline-flex items-center gap-2 rounded-full border border-dashed border-navy/25 px-5 py-3 text-xs uppercase tracking-[0.16em] text-navy/70 transition-colors hover:border-navy/50 hover:text-navy"
            >
              <Plus className="size-3.5" strokeWidth={1.75} />
              {t("admin.actions.add")}
            </button>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
