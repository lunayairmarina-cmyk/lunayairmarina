import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { useLanguage } from "@/lib/i18n";
import { faqRecords } from "@/data/mock";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveFaq } from "@/services/adminCmsService";
import type { FaqContent } from "@/types/content";

export const Route = createFileRoute("/admin/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — lunayairmarina Admin" },
      { name: "description", content: "Manage frequently asked questions." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminFaqPage,
});

const emptyDraft = { question: "", answer: "" };

function AdminFaqPage() {
  const { t, language } = useLanguage();
  const initial = useMemo<FaqContent[]>(() => {
    const cms = loadCmsStore();
    if (cms.faq.length) return cms.faq;
    return faqRecords.map((row, index) => ({
      id: row.id,
      question: { en: row.question, ar: row.question },
      answer: { en: row.answer, ar: row.answer },
      order: index + 1,
    }));
  }, []);

  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);

  const persist = async (next: FaqContent[]) => {
    setRows(next);
    const result = await saveFaq(next);
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
                question: { ...row.question, [language]: draft.question },
                answer: { ...row.answer, [language]: draft.answer },
              }
            : row,
        )
      : [
          ...rows,
          {
            id: `f${Date.now()}`,
            question: { en: draft.question, ar: draft.question },
            answer: { en: draft.answer, ar: draft.answer },
            order: rows.length + 1,
          },
        ];
    await persist(next);
    setOpen(false);
    setEditingId(null);
  };

  const columns: Column<FaqContent>[] = [
    {
      key: "question",
      header: t("admin.table.question"),
      render: (row) => <span className="text-navy">{row.question[language]}</span>,
    },
    {
      key: "answer",
      header: t("admin.table.answer"),
      render: (row) => (
        <span className="line-clamp-2 max-w-lg text-muted-foreground">{row.answer[language]}</span>
      ),
    },
  ];

  return (
    <AdminLayout title={t("admin.nav.faq")}>
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
                  question: row.question[language],
                  answer: row.answer[language],
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
          label={t("admin.table.question")}
          value={draft.question}
          onChange={(value) => setDraft({ ...draft, question: value })}
        />
        <ModalField
          textarea
          label={t("admin.table.answer")}
          value={draft.answer}
          onChange={(value) => setDraft({ ...draft, answer: value })}
        />
      </Modal>
    </AdminLayout>
  );
}
