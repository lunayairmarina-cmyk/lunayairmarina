import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, StatusBadge, type Column } from "@/components/admin/DataTable";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore, type CmsMessage } from "@/lib/cms-store";
import { fetchMessagesFromFirebase, saveMessages } from "@/services/adminCmsService";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Messages — lunayairmarina Admin" },
      { name: "description", content: "Inbox of website contact requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<CmsMessage[]>(() => loadCmsStore().messages);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetchMessagesFromFirebase()
      .then((messages) => {
        if (messages.length) setRows(messages);
      })
      .catch(() => {
        // Keep local CMS messages if Firebase read fails.
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = async (next: CmsMessage[]) => {
    setRows(next);
    await saveMessages(next);
  };

  const columns: Column<CmsMessage>[] = [
    {
      key: "name",
      header: t("admin.table.name"),
      render: (row) => <span className="text-navy">{row.name}</span>,
    },
    { key: "email", header: t("admin.table.email"), render: (row) => row.email },
    { key: "phone", header: t("admin.table.phone"), render: (row) => row.phone },
    {
      key: "message",
      header: t("admin.table.message"),
      render: (row) => (
        <span className="line-clamp-2 max-w-sm text-muted-foreground">{row.message}</span>
      ),
    },
    { key: "date", header: t("admin.table.date"), render: (row) => row.date },
    {
      key: "status",
      header: t("admin.table.status"),
      render: (row) => (
        <StatusBadge
          label={row.status === "new" ? t("admin.status.new") : t("admin.status.read")}
          tone={row.status === "new" ? "active" : "draft"}
        />
      ),
    },
  ];

  return (
    <AdminLayout title={t("admin.nav.messages")}>
      {loading ? (
        <p className="mb-4 text-xs text-navy/45">{t("admin.messages.loading")}</p>
      ) : null}
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        actions={(row) => (
          <>
            <RowAction
              icon={Check}
              label={t("admin.status.read")}
              onClick={() =>
                void persist(
                  rows.map((item) =>
                    item.id === row.id ? { ...item, status: "read" as const } : item,
                  ),
                )
              }
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
    </AdminLayout>
  );
}
