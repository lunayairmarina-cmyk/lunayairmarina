import { useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, StatusBadge, type Column } from "@/components/admin/DataTable";
import { Modal, ModalField } from "@/components/admin/Modal";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { useLanguage } from "@/lib/i18n";
import { serviceRecords } from "@/data/mock";
import { SERVICE_SLUGS } from "@/data/services";
import { loadCmsStore } from "@/lib/cms-store";
import { describeSaveResult, saveServices } from "@/services/adminCmsService";
import { ServiceDetailEditor } from "@/components/admin/ServiceDetailEditor";
import type { ServiceContent } from "@/types/content";

export const Route = createLazyFileRoute("/admin/services")({
  component: AdminServicesPage,
});

function toServiceContent(): ServiceContent[] {
  const cms = loadCmsStore();
  if (cms.services.length) return cms.services;
  return serviceRecords.map((row, index) => ({
    id: row.id,
    slug: SERVICE_SLUGS[index] ?? row.id,
    title: row.title,
    description: row.description,
    image: row.image,
    features: [],
    order: index + 1,
    details: { status: row.status },
  }));
}

function AdminServicesPage() {
  const { t, language } = useLanguage();
  const [rows, setRows] = useState<ServiceContent[]>(() => toServiceContent());
  const [editing, setEditing] = useState<ServiceContent | null>(null);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    image: "",
    slug: "",
    features: "",
  });
  const [status, setStatus] = useState<string | null>(null);

  const persist = async (next: ServiceContent[]) => {
    setRows(next);
    const result = await saveServices(next);
    setStatus(
      describeSaveResult(result, {
        synced: t("admin.cms.savedSynced"),
        local: t("admin.cms.savedLocal"),
      }),
    );
  };

  const openEdit = (row: ServiceContent) => {
    setEditing(row);
    setDraft({
      title: row.title[language],
      description: row.description[language],
      image: row.image,
      slug: row.slug,
      features: (row.features ?? [])
        .map((feature) => feature[language] || feature.en)
        .filter(Boolean)
        .join("\n"),
    });
  };

  const save = async () => {
    if (!editing) return;
    const featureLines = draft.features
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const next = rows.map((row) =>
      row.id === editing.id
        ? {
            ...row,
            slug: draft.slug || row.slug,
            image: draft.image || row.image,
            title: { ...row.title, [language]: draft.title },
            description: { ...row.description, [language]: draft.description },
            features: featureLines.map((line, index) => {
              const existing = row.features?.[index];
              return existing
                ? { ...existing, [language]: line }
                : { en: line, ar: line };
            }),
          }
        : row,
    );
    await persist(next);
    setEditing(null);
  };

  const addNew = async () => {
    const id = `s${Date.now()}`;
    const row: ServiceContent = {
      id,
      slug: `service-${Date.now()}`,
      title: { en: "New service", ar: "خدمة جديدة" },
      description: { en: "Service description", ar: "وصف الخدمة" },
      image: serviceRecords[0]?.image ?? "",
      features: [],
      order: rows.length + 1,
      details: { status: "draft" },
    };
    await persist([...rows, row]);
    openEdit(row);
  };

  const columns: Column<ServiceContent>[] = useMemo(
    () => [
      {
        key: "image",
        header: t("admin.table.image"),
        render: (row) => (
          <img src={row.image} alt="" loading="lazy" className="size-14 rounded-md object-cover" />
        ),
      },
      {
        key: "title",
        header: t("admin.table.title"),
        render: (row) => <span className="text-navy">{row.title[language]}</span>,
      },
      {
        key: "description",
        header: t("admin.table.description"),
        render: (row) => (
          <span className="line-clamp-2 max-w-sm text-muted-foreground">
            {row.description[language]}
          </span>
        ),
      },
      {
        key: "status",
        header: t("admin.table.status"),
        render: (row) => {
          const active = (row.details as { status?: string } | undefined)?.status !== "draft";
          return (
            <StatusBadge
              label={active ? t("admin.status.active") : t("admin.status.draft")}
              tone={active ? "active" : "draft"}
            />
          );
        },
      },
    ],
    [language, t],
  );

  return (
    <AdminLayout title={t("admin.nav.services")}>
      <div className="mb-6 flex items-center justify-between gap-3">
        {status ? <span className="text-xs text-navy/55">{status}</span> : <span />}
        <button
          type="button"
          onClick={() => void addNew()}
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
            <RowAction icon={Pencil} label={t("admin.actions.edit")} onClick={() => openEdit(row)} />
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
        open={Boolean(editing)}
        title={t("admin.actions.edit")}
        onClose={() => setEditing(null)}
        onSubmit={() => void save()}
      >
        <ModalField
          label={t("admin.table.title")}
          value={draft.title}
          onChange={(value) => setDraft({ ...draft, title: value })}
        />
        <ModalField
          textarea
          label={t("admin.table.description")}
          value={draft.description}
          onChange={(value) => setDraft({ ...draft, description: value })}
        />
        <ModalField
          label="Slug"
          value={draft.slug}
          onChange={(value) => setDraft({ ...draft, slug: value })}
        />
        <ModalField
          textarea
          label={`${t("admin.table.description")} features (one per line)`}
          value={draft.features}
          onChange={(value) => setDraft({ ...draft, features: value })}
        />
        <MediaUploader
          label={t("admin.table.image")}
          value={draft.image}
          pathPrefix="images/services"
          onChange={(url) => setDraft({ ...draft, image: url })}
        />
      </Modal>

      <ServiceDetailEditor />
    </AdminLayout>
  );
}
