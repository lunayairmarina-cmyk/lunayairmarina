import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { useLanguage } from "@/lib/i18n";
import { faqRecords } from "@/data/mock";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveFaq } from "@/services/adminCmsService";
import type { FaqContent } from "@/types/content";
import { asLocalized, pairLocalized } from "@/lib/localized";

export const Route = createLazyFileRoute("/admin/faq")({
  component: AdminFaqPage,
});

type Draft = {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
};

const emptyDraft = (): Draft => ({
  questionEn: "",
  questionAr: "",
  answerEn: "",
  answerAr: "",
});

function AdminFaqPage() {
  const { t, language } = useLanguage();
  const initial = useMemo<FaqContent[]>(() => {
    const cms = loadCmsStore();
    if (cms.faq.length) {
      return cms.faq.map((row) => ({
        ...row,
        question: asLocalized(row.question),
        answer: asLocalized(row.answer),
      }));
    }
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
  const [draft, setDraft] = useState<Draft>(emptyDraft);
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
    if (!draft.questionEn.trim() && !draft.questionAr.trim()) return;
    const question = pairLocalized(draft.questionEn, draft.questionAr);
    const answer = pairLocalized(draft.answerEn, draft.answerAr);
    const next = editingId
      ? rows.map((row) => (row.id === editingId ? { ...row, question, answer } : row))
      : [
          ...rows,
          {
            id: `f${Date.now()}`,
            question,
            answer,
            order: rows.length + 1,
          },
        ];
    await persist(next);
    setOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {status ? <span className="text-xs text-navy/55">{status}</span> : <span />}
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setDraft(emptyDraft());
            setOpen(true);
          }}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase transition-colors hover:bg-navy/90 sm:w-auto"
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
                const question = asLocalized(row.question);
                const answer = asLocalized(row.answer);
                setEditingId(row.id);
                setDraft({
                  questionEn: question.en,
                  questionAr: question.ar,
                  answerEn: answer.en,
                  answerAr: answer.ar,
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
          label={`${t("admin.table.question")} (EN)`}
          value={draft.questionEn}
          onChange={(value) => setDraft({ ...draft, questionEn: value })}
        />
        <ModalField
          label={`${t("admin.table.question")} (AR)`}
          value={draft.questionAr}
          onChange={(value) => setDraft({ ...draft, questionAr: value })}
        />
        <ModalField
          textarea
          label={`${t("admin.table.answer")} (EN)`}
          value={draft.answerEn}
          onChange={(value) => setDraft({ ...draft, answerEn: value })}
        />
        <ModalField
          textarea
          label={`${t("admin.table.answer")} (AR)`}
          value={draft.answerAr}
          onChange={(value) => setDraft({ ...draft, answerAr: value })}
        />
      </Modal>
    </AdminLayout>
  );
}
