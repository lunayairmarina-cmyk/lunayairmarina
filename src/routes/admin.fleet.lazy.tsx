import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveFleet } from "@/services/adminCmsService";
import type { FleetItem } from "@/types/content";
import { yachts } from "@/data/mock";

export const Route = createLazyFileRoute("/admin/fleet")({
  component: AdminFleetPage,
});

const emptyDraft = {
  yachtName: "",
  yachtType: "",
  yachtLength: "",
  description: "",
  image: "",
  capacity: "",
  crew: "",
};

function seedFleet(): FleetItem[] {
  const cms = loadCmsStore();
  if (cms.fleet.length) return cms.fleet;
  return yachts.map((yacht, index) => ({
    id: yacht.id,
    yachtName: yacht.name,
    yachtType: yacht.category,
    yachtLength: yacht.length,
    image: yacht.image,
    description: {
      en: `${yacht.name} — professionally managed yacht.`,
      ar: `${yacht.name} — يخت تحت إدارة احترافية.`,
    },
    capacity: yacht.capacity,
    crew: yacht.crew,
    order: index + 1,
  }));
}

function AdminFleetPage() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<FleetItem[]>(() => seedFleet());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [status, setStatus] = useState<string | null>(null);

  const persist = async (next: FleetItem[]) => {
    setRows(next);
    const result = await saveFleet(next);
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
                yachtName: draft.yachtName,
                yachtType: { ...row.yachtType, [language]: draft.yachtType },
                yachtLength: draft.yachtLength,
                description: { ...row.description, [language]: draft.description },
                image: draft.image || row.image,
                capacity: Number(draft.capacity) || undefined,
                crew: Number(draft.crew) || undefined,
              }
            : row,
        )
      : [
          ...rows,
          {
            id: `fl${Date.now()}`,
            yachtName: draft.yachtName,
            yachtType: { en: draft.yachtType, ar: draft.yachtType },
            yachtLength: draft.yachtLength,
            description: { en: draft.description, ar: draft.description },
            image: draft.image,
            capacity: Number(draft.capacity) || undefined,
            crew: Number(draft.crew) || undefined,
            order: rows.length + 1,
          },
        ];
    await persist(next);
    setOpen(false);
    setEditingId(null);
  };

  const columns: Column<FleetItem>[] = useMemo(
    () => [
      {
        key: "image",
        header: t("admin.table.image"),
        render: (row) => (
          <img src={row.image} alt="" className="size-14 rounded-md object-cover" />
        ),
      },
      {
        key: "name",
        header: t("admin.table.name"),
        render: (row) => <span className="text-navy">{row.yachtName}</span>,
      },
      {
        key: "length",
        header: t("admin.table.length"),
        render: (row) => row.yachtLength,
      },
      {
        key: "category",
        header: t("admin.table.category"),
        render: (row) => row.yachtType[language],
      },
    ],
    [language, t],
  );

  return (
    <AdminLayout title={t("admin.nav.fleet")}>
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
                  yachtName: row.yachtName,
                  yachtType: row.yachtType[language],
                  yachtLength: row.yachtLength,
                  description: row.description[language],
                  image: row.image,
                  capacity: row.capacity ? String(row.capacity) : "",
                  crew: row.crew ? String(row.crew) : "",
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
          value={draft.yachtName}
          onChange={(value) => setDraft({ ...draft, yachtName: value })}
        />
        <ModalField
          label={t("admin.table.category")}
          value={draft.yachtType}
          onChange={(value) => setDraft({ ...draft, yachtType: value })}
        />
        <ModalField
          label={t("admin.table.length")}
          value={draft.yachtLength}
          onChange={(value) => setDraft({ ...draft, yachtLength: value })}
        />
        <ModalField
          label={t("admin.table.capacity")}
          value={draft.capacity}
          onChange={(value) => setDraft({ ...draft, capacity: value })}
        />
        <ModalField
          label="Crew"
          value={draft.crew}
          onChange={(value) => setDraft({ ...draft, crew: value })}
        />
        <ModalField
          textarea
          label={t("admin.table.description")}
          value={draft.description}
          onChange={(value) => setDraft({ ...draft, description: value })}
        />
        <MediaUploader
          label={t("admin.table.image")}
          value={draft.image}
          pathPrefix="images/fleet"
          onChange={(url) => setDraft({ ...draft, image: url })}
        />
      </Modal>
    </AdminLayout>
  );
}
