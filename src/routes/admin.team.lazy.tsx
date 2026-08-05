import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveTeam } from "@/services/adminCmsService";
import type { TeamMember } from "@/types/content";

export const Route = createLazyFileRoute("/admin/team")({
  component: AdminTeamPage,
});

const emptyDraft = {
  name: "",
  position: "",
  bio: "",
  image: "",
};

function AdminTeamPage() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<TeamMember[]>(() => loadCmsStore().team);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);

  const persist = async (next: TeamMember[]) => {
    setRows(next);
    const result = await saveTeam(next);
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
                name: { ...row.name, [language]: draft.name },
                position: { ...row.position, [language]: draft.position },
                bio: { ...row.bio, [language]: draft.bio },
                image: draft.image || row.image,
              }
            : row,
        )
      : [
          ...rows,
          {
            id: `tm${Date.now()}`,
            name: { en: draft.name, ar: draft.name },
            position: { en: draft.position, ar: draft.position },
            bio: { en: draft.bio, ar: draft.bio },
            image: draft.image,
            order: rows.length + 1,
          },
        ];
    await persist(next);
    setOpen(false);
    setEditingId(null);
  };

  const columns: Column<TeamMember>[] = useMemo(
    () => [
      {
        key: "image",
        header: t("admin.table.image"),
        render: (row) =>
          row.image ? (
            <img src={row.image} alt="" className="size-12 rounded-full object-cover" />
          ) : (
            <span className="grid size-12 place-items-center rounded-full bg-navy/6 text-xs">
              {row.name[language].slice(0, 2).toUpperCase()}
            </span>
          ),
      },
      {
        key: "name",
        header: t("admin.table.name"),
        render: (row) => <span className="text-navy">{row.name[language]}</span>,
      },
      {
        key: "position",
        header: t("admin.table.position"),
        render: (row) => row.position[language],
      },
      {
        key: "bio",
        header: t("admin.table.description"),
        render: (row) => (
          <span className="line-clamp-2 max-w-sm text-muted-foreground">{row.bio[language]}</span>
        ),
      },
    ],
    [language, t],
  );

  return (
    <AdminLayout title={t("admin.nav.team")}>
      <div className="mb-6 flex items-center justify-between gap-3">
        {status ? <span className="text-xs text-navy/55">{status}</span> : <span />}
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setDraft(emptyDraft);
            setOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-xs tracking-[0.18em] text-white uppercase hover:bg-navy/90"
        >
          <Plus className="size-4" />
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
                  name: row.name[language],
                  position: row.position[language],
                  bio: row.bio[language],
                  image: row.image,
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
          label={t("admin.table.description")}
          value={draft.bio}
          onChange={(value) => setDraft({ ...draft, bio: value })}
        />
        <MediaUploader
          label={t("admin.table.image")}
          value={draft.image}
          pathPrefix="images/team"
          onChange={(url) => setDraft({ ...draft, image: url })}
        />
      </Modal>
    </AdminLayout>
  );
}
