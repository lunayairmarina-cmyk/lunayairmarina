import { useEffect, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Check, Printer, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, StatusBadge, type Column } from "@/components/admin/DataTable";
import { useLanguage } from "@/lib/i18n";
import { loadCmsStore, type CmsMessage } from "@/lib/cms-store";
import { fetchMessagesFromFirebase, saveMessages } from "@/services/adminCmsService";

export const Route = createLazyFileRoute("/admin/messages")({
  component: AdminMessagesPage,
});

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPrintHtml(
  messages: CmsMessage[],
  labels: {
    title: string;
    empty: string;
    printedAt: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    date: string;
    status: string;
    statusNew: string;
    statusRead: string;
    yachtType: string;
    yachtLength: string;
    yachtLocation: string;
    serviceNeeded: string;
    brand: string;
  },
  dir: "ltr" | "rtl",
) {
  const printedAt = new Date().toLocaleString();

  const field = (label: string, value?: string) => {
    if (!value?.trim()) return "";
    return `<div class="field">
      <span class="field-label">${escapeHtml(label)}</span>
      <span class="field-value" dir="auto">${escapeHtml(value)}</span>
    </div>`;
  };

  const body =
    messages.length === 0
      ? `<p class="empty">${escapeHtml(labels.empty)}</p>`
      : messages
          .map((row, index) => {
            const isNew = row.status === "new";
            return `
              <article class="card">
                <div class="card-accent"></div>
                <header class="card-head">
                  <div class="card-title-wrap">
                    <span class="index">#${index + 1}</span>
                    <h2 dir="auto">${escapeHtml(row.name || "—")}</h2>
                  </div>
                  <div class="badges">
                    <span class="badge date">${escapeHtml(row.date || "—")}</span>
                    <span class="badge ${isNew ? "badge-new" : "badge-read"}">${escapeHtml(
                      isNew ? labels.statusNew : labels.statusRead,
                    )}</span>
                  </div>
                </header>
                <div class="fields">
                  ${field(labels.email, row.email)}
                  ${field(labels.phone, row.phone)}
                  ${field(labels.yachtType, row.yachtType)}
                  ${field(labels.yachtLength, row.yachtLength)}
                  ${field(labels.yachtLocation, row.yachtLocation)}
                  ${field(labels.serviceNeeded, row.serviceNeeded)}
                </div>
                <div class="message-box">
                  <span class="message-label">${escapeHtml(labels.message)}</span>
                  <p class="message-body" dir="auto">${escapeHtml(row.message || "—").replaceAll("\n", "<br/>")}</p>
                </div>
              </article>
            `;
          })
          .join("");

  return `<!doctype html>
<html lang="${dir === "rtl" ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)}</title>
  <style>
    :root {
      --navy: #0b1f33;
      --navy-soft: #14324f;
      --gold: #c4a35a;
      --gold-soft: #f4ead3;
      --sand: #f7f3eb;
      --line: #e4dccb;
      --muted: #5d6b7a;
      --ok: #2f6b4f;
      --new: #9a6b1f;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--navy);
      background: #fff;
      font-family: "Segoe UI", Tahoma, "Noto Kufi Arabic", Arial, sans-serif;
    }
    .sheet { padding: 18px 20px 24px; }
    .hero {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 20px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--navy) 0%, var(--navy-soft) 70%, #1c4a70 100%);
      color: #fff;
      margin-bottom: 18px;
    }
    .brand {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gold);
      margin: 0 0 6px;
    }
    .hero h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 700;
      line-height: 1.2;
    }
    .hero-meta {
      text-align: ${dir === "rtl" ? "left" : "right"};
      font-size: 12px;
      color: rgba(255,255,255,0.78);
      line-height: 1.55;
    }
    .hero-meta strong { color: var(--gold); font-weight: 600; }
    .empty {
      padding: 28px;
      text-align: center;
      border: 1px dashed var(--line);
      border-radius: 14px;
      color: var(--muted);
      background: var(--sand);
    }
    .card {
      position: relative;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
      margin-bottom: 12px;
      page-break-inside: avoid;
      break-inside: avoid;
      box-shadow: 0 1px 0 rgba(11, 31, 51, 0.04);
    }
    .card-accent {
      position: absolute;
      inset-block: 0;
      ${dir === "rtl" ? "right" : "left"}: 0;
      width: 5px;
      background: linear-gradient(180deg, var(--gold), #a8843d);
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px 10px;
      background: linear-gradient(180deg, var(--sand), #fff);
      border-bottom: 1px solid var(--line);
    }
    .card-title-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .index {
      flex: 0 0 auto;
      min-width: 34px;
      height: 28px;
      padding: 0 8px;
      display: inline-grid;
      place-items: center;
      border-radius: 999px;
      background: var(--navy);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
    }
    .card-head h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: var(--navy);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .badges { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
    .badge {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
      border: 1px solid transparent;
    }
    .badge.date { background: #eef3f7; color: var(--muted); border-color: #d8e1ea; }
    .badge-new { background: #fff4df; color: var(--new); border-color: #efd3a0; }
    .badge-read { background: #e8f5ee; color: var(--ok); border-color: #b9dcc9; }
    .fields {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px 12px;
      padding: 12px 16px;
    }
    .field {
      background: var(--sand);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 10px;
      min-width: 0;
    }
    .field-label {
      display: block;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--gold);
      font-weight: 700;
      margin-bottom: 3px;
    }
    .field-value {
      display: block;
      font-size: 13px;
      color: var(--navy);
      word-break: break-word;
    }
    .message-box {
      margin: 0 16px 14px;
      padding: 12px 14px;
      border-radius: 12px;
      background: linear-gradient(180deg, #fffdf8, #fff);
      border: 1px solid var(--line);
      border-inline-start: 3px solid var(--gold);
    }
    .message-label {
      display: block;
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--navy-soft);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .message-body {
      margin: 0;
      font-size: 13px;
      line-height: 1.65;
      color: #243447;
      white-space: pre-wrap;
    }
    @media print {
      .sheet { padding: 0; }
      .hero { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card, .badge, .field, .message-box, .index, .card-accent {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .card { box-shadow: none; margin-bottom: 10px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="hero">
      <div>
        <p class="brand">${escapeHtml(labels.brand)}</p>
        <h1>${escapeHtml(labels.title)}</h1>
      </div>
      <div class="hero-meta">
        <div><strong>${escapeHtml(labels.printedAt)}</strong><br/>${escapeHtml(printedAt)}</div>
        <div style="margin-top:6px"><strong>${messages.length}</strong></div>
      </div>
    </header>
    ${body}
  </div>
</body>
</html>`;
}

function printAllMessages(
  messages: CmsMessage[],
  labels: Parameters<typeof buildPrintHtml>[1],
  dir: "ltr" | "rtl",
) {
  const html = buildPrintHtml(messages, labels, dir);

  // Same-document iframe avoids blank about:blank popups (Brave/Chrome blockers).
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const frameWindow = iframe.contentWindow;
  const frameDoc = iframe.contentDocument || frameWindow?.document;
  if (!frameWindow || !frameDoc) {
    iframe.remove();
    return;
  }

  frameDoc.open();
  frameDoc.write(html);
  frameDoc.close();

  const cleanup = () => {
    iframe.remove();
  };

  const triggerPrint = () => {
    try {
      frameWindow.focus();
      frameWindow.print();
    } finally {
      window.setTimeout(cleanup, 1000);
    }
  };

  if (frameDoc.readyState === "complete") {
    window.setTimeout(triggerPrint, 50);
  } else {
    iframe.onload = () => window.setTimeout(triggerPrint, 50);
  }
}

function AdminMessagesPage() {
  const { t, dir } = useLanguage();
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-navy/55">
          {loading ? t("admin.messages.loading") : null}
        </span>
        <button
          type="button"
          onClick={() =>
            printAllMessages(
              rows,
              {
                title: t("admin.messages.printTitle"),
                empty: t("admin.messages.printEmpty"),
                printedAt: t("admin.messages.printedAt"),
                name: t("admin.table.name"),
                email: t("admin.table.email"),
                phone: t("admin.table.phone"),
                message: t("admin.table.message"),
                date: t("admin.table.date"),
                status: t("admin.table.status"),
                statusNew: t("admin.status.new"),
                statusRead: t("admin.status.read"),
                yachtType: t("contact.form.yachtType"),
                yachtLength: t("contact.form.yachtLength"),
                yachtLocation: t("contact.form.yachtLocation"),
                serviceNeeded: t("contact.form.serviceNeeded"),
                brand: t("brand.wordmark"),
              },
              dir,
            )
          }
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-navy/15 bg-white px-5 py-3 text-xs tracking-[0.18em] text-navy uppercase transition-colors hover:border-navy/30 hover:bg-navy/5 sm:w-auto"
        >
          <Printer className="size-4" strokeWidth={1.5} />
          {t("admin.messages.printAll")}
        </button>
      </div>

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
