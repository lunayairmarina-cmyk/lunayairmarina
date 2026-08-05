import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { useLanguage } from "@/lib/i18n";
import { testimonialRecords } from "@/data/mock";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveTestimonials } from "@/services/adminCmsService";
import type { TestimonialContent } from "@/types/content";

export const Route = createLazyFileRoute("/admin/testimonials")({
  component: AdminTestimonialsPage,
});

const emptyDraft = { name: "", position: "", review: "" };

function AdminTestimonialsPage() {
  const { t, language } = useLanguage();
  const initial = useMemo<TestimonialContent[]>(() => {
    const cms = loadCmsStore();
    if (cms.testimonials.length) return cms.testimonials;
    return testimonialRecords.map((row, index) => ({
      id: row.id,
      clientName: row.name,
      role: { en: row.position, ar: row.position },
      text: { en: row.review, ar: row.review },
      order: index + 1,
    }));
  }, []);

  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);

  const persist = async (next: TestimonialContent[]) => {
    setRows(next);
    const result = await saveTestimonials(next);
    setStatus(
      describeSaveResult(result, {
        synced: t("admin.cms.savedSynced"),
        local: t("admin.cms.savedLocal"),
      }),
    );
  };

  const save = async () => {
    const next = editingId
      ? rows.map((row) =>
          row.id === editingId
            ? {
                ...row,
                clientName: draft.name,
                role: { ...row.role, [language]: draft.position },
                text: { ...row.text, [language]: draft.review },
              }
            : row,
        )
      : [
          ...rows,
          {
            id: `t${Date.now()}`,
            clientName: draft.name,
            role: { en: draft.position, ar: draft.position },
            text: { en: draft.review, ar: draft.review },
            order: rows.length + 1,
          },
        ];
    await persist(next);
    setOpen(false);
    setEditingId(null);
  };

  const columns: Column<TestimonialContent>[] = [
    {
      key: "photo",
      header: t("admin.table.image"),
      render: (row) => (
        <span className="grid size-11 place-items-center rounded-full bg-navy/6 text-xs text-navy">
          {row.clientName.slice(0, 2).toUpperCase()}
        </span>
      ),
    },
    {
      key: "name",
      header: t("admin.table.name"),
      render: (row) => <span className="text-navy">{row.clientName}</span>,
    },
    {
      key: "position",
      header: t("admin.table.position"),
      render: (row) => row.role[language],
    },
    {
      key: "review",
      header: t("admin.table.review"),
      render: (row) => (
        <span className="line-clamp-2 max-w-sm text-muted-foreground">{row.text[language]}</span>
      ),
    },
  ];

  return (
    <AdminLayout title={t("admin.nav.testimonials")}>
      <div className="mb-6 flex items-center justify-between gap-3">
        {status ? <span className="text-xs text-navy/55">{status}</span> : <span />}
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setDraft(emptyDraft);
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90"
        >
          <Plus className="size-4" strokeWidth={1.5} />
          {t("admin.actions.add")}
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        actions={(row) => (
          <>
            <RowAction
              icon={Pencil}
              label={t("admin.actions.edit")}
              onClick={() => {
                setEditingId(row.id);
                setDraft({
                  name: row.clientName,
                  position: row.role[language],
                  review: row.text[language],
                });
                setOpen(true);
              }}
            />
            <RowAction
              icon={Trash2}
              tone="danger"
              label={t("admin.actions.delete")}
              onClick={() => void persist(rows.filter((item) => item.id !== row.id))}
            />
          </>
        )}
      />

      <Modal
        open={open}
        title={editingId ? t("admin.actions.edit") : t("admin.actions.add")}
        onClose={() => setOpen(false)}
        onSubmit={() => void save()}
      >
        <ModalField
          label={t("admin.table.name")}
          value={draft.name}
          onChange={(value) => setDraft({ ...draft, name: value })}
        />
        <ModalField
          label={t("admin.table.position")}
          value={draft.position}
          onChange={(value) => setDraft({ ...draft, position: value })}
        />
        <ModalField
          textarea
          label={t("admin.table.review")}
          value={draft.review}
          onChange={(value) => setDraft({ ...draft, review: value })}
        />
      </Modal>
    </AdminLayout>
  );
}
