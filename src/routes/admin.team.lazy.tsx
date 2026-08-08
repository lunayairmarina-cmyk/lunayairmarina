import { useEffect, useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useLanguage } from "@/lib/i18n";
import { asLocalized, pairLocalized } from "@/lib/localized";
import { describeSaveResult, loadTeam, saveTeam } from "@/services/adminCmsService";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import type { TeamMember } from "@/types/content";

export const Route = createLazyFileRoute("/admin/team")({
  component: AdminTeamPage,
});

type Draft = {
  nameEn: string;
  nameAr: string;
  positionEn: string;
  positionAr: string;
  bioEn: string;
  bioAr: string;
  image: string;
};

const emptyDraft = (): Draft => ({
  nameEn: "",
  nameAr: "",
  positionEn: "",
  positionAr: "",
  bioEn: "",
  bioAr: "",
  image: "",
});

function normalizeTeam(rows: TeamMember[]): TeamMember[] {
  return rows.map((row) => ({
    ...row,
    name: asLocalized(row.name),
    position: asLocalized(row.position),
    bio: asLocalized(row.bio),
  }));
}

function AdminTeamPage() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const team = await loadTeam();
      if (!cancelled) {
        setRows(normalizeTeam(team));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!draft.nameEn.trim() && !draft.nameAr.trim()) return;
    const name = pairLocalized(draft.nameEn, draft.nameAr);
    const position = pairLocalized(draft.positionEn, draft.positionAr);
    const bio = pairLocalized(draft.bioEn, draft.bioAr);

    const next = editingId
      ? rows.map((row) =>
          row.id === editingId
            ? {
                ...row,
                name,
                position,
                bio,
                image: draft.image || row.image,
              }
            : row,
        )
      : [
          ...rows,
          {
            id: `tm${Date.now()}`,
            name,
            position,
            bio,
            image: draft.image,
            order: rows.length + 1,
          },
        ];
    await persist(next);
    setOpen(false);
    setEditingId(null);
    setDraft(emptyDraft());
  };

  const columns: Column<TeamMember>[] = useMemo(
    () => [
      {
        key: "image",
        header: t("admin.table.image"),
        render: (row) =>
          row.image ? (
            <ResolvedImage
              src={row.image}
              alt=""
              className="size-12 rounded-full object-cover"
            />
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
        <span className="text-xs text-navy/55">
          {status ?? (loading ? t("common.loading") : null)}
        </span>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setDraft(emptyDraft());
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
                const name = asLocalized(row.name);
                const position = asLocalized(row.position);
                const bio = asLocalized(row.bio);
                setEditingId(row.id);
                setDraft({
                  nameEn: name.en,
                  nameAr: name.ar,
                  positionEn: position.en,
                  positionAr: position.ar,
                  bioEn: bio.en,
                  bioAr: bio.ar,
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
        <div className="grid gap-5 sm:grid-cols-2">
          <ModalField
            label={`${t("admin.table.name")} (EN)`}
            value={draft.nameEn}
            onChange={(value) => setDraft({ ...draft, nameEn: value })}
          />
          <ModalField
            label={`${t("admin.table.name")} (AR)`}
            value={draft.nameAr}
            onChange={(value) => setDraft({ ...draft, nameAr: value })}
          />
          <ModalField
            label={`${t("admin.table.position")} (EN)`}
            value={draft.positionEn}
            onChange={(value) => setDraft({ ...draft, positionEn: value })}
          />
          <ModalField
            label={`${t("admin.table.position")} (AR)`}
            value={draft.positionAr}
            onChange={(value) => setDraft({ ...draft, positionAr: value })}
          />
        </div>
        <ModalField
          textarea
          label={`${t("admin.table.description")} (EN)`}
          value={draft.bioEn}
          onChange={(value) => setDraft({ ...draft, bioEn: value })}
        />
        <ModalField
          textarea
          label={`${t("admin.table.description")} (AR)`}
          value={draft.bioAr}
          onChange={(value) => setDraft({ ...draft, bioAr: value })}
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
