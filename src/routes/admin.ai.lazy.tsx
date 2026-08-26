import { useCallback, useEffect, useMemo, useState } from "react";
import { createLazyFileRoute } from "@tanstack/react-router";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  doc,
  setDoc,
  type Firestore,
} from "firebase/firestore";
import { Bot, Check, RefreshCw, X } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DataTable, RowAction, StatusBadge, type Column } from "@/components/admin/DataTable";
import { useLanguage } from "@/lib/i18n";
import { getDb } from "@/lib/firebase";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  AI_CONVERSATIONS_COLLECTION,
  AI_LEADS_COLLECTION,
  KNOWLEDGE_CANDIDATES_COLLECTION,
  KNOWLEDGE_COLLECTION,
  type AiConversationRecord,
  type AiLeadRecord,
  type KnowledgeCandidateRecord,
} from "@/lib/agent/types";
import {
  updateAiLeadStatusClient,
  approveKnowledgeCandidateClient,
} from "@/lib/agent/aiAdminClient";
import { readKnowledgeSyncStatusClient } from "@/lib/agent/knowledgeSyncClient";
import { triggerKnowledgeSync } from "@/functions/aiAdmin";

export const Route = createLazyFileRoute("/admin/ai")({
  component: AdminAiPage,
});

async function listConversations(db: Firestore): Promise<AiConversationRecord[]> {
  try {
    const snap = await getDocs(
      query(
        collection(db, AI_CONVERSATIONS_COLLECTION),
        orderBy("lastMessageAt", "desc"),
        limit(40),
      ),
    );
    return snap.docs.map((item) => item.data() as AiConversationRecord);
  } catch {
    const snap = await getDocs(collection(db, AI_CONVERSATIONS_COLLECTION));
    return snap.docs
      .map((item) => item.data() as AiConversationRecord)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .slice(0, 40);
  }
}

async function listCandidates(db: Firestore): Promise<KnowledgeCandidateRecord[]> {
  const snap = await getDocs(collection(db, KNOWLEDGE_CANDIDATES_COLLECTION));
  return snap.docs
    .map((item) => item.data() as KnowledgeCandidateRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

async function listLeads(db: Firestore): Promise<AiLeadRecord[]> {
  try {
    const snap = await getDocs(
      query(collection(db, AI_LEADS_COLLECTION), orderBy("createdAt", "desc"), limit(40)),
    );
    return snap.docs.map((item) => item.data() as AiLeadRecord);
  } catch {
    const snap = await getDocs(collection(db, AI_LEADS_COLLECTION));
    return snap.docs
      .map((item) => item.data() as AiLeadRecord)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 40);
  }
}

async function countKnowledge(db: Firestore): Promise<number> {
  const snap = await getDocs(collection(db, KNOWLEDGE_COLLECTION));
  return snap.size;
}

function AdminAiPage() {
  const { t, language } = useLanguage();
  const { can, user } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [conversations, setConversations] = useState<AiConversationRecord[]>([]);
  const [candidates, setCandidates] = useState<KnowledgeCandidateRecord[]>([]);
  const [leads, setLeads] = useState<AiLeadRecord[]>([]);
  const [knowledgeCount, setKnowledgeCount] = useState(0);
  const [syncNeeds, setSyncNeeds] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const db = getDb();
      const [conv, cand, leadRows, count, sync] = await Promise.all([
        listConversations(db),
        listCandidates(db),
        listLeads(db),
        countKnowledge(db),
        readKnowledgeSyncStatusClient(db),
      ]);
      setConversations(conv);
      setCandidates(cand);
      setLeads(leadRows);
      setKnowledgeCount(count);
      setSyncNeeds(Boolean(sync?.needsReingest));
    } catch {
      setStatus(t("admin.ai.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!can("ai")) return;
    void refresh();
  }, [can, refresh]);

  const intentStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of conversations) {
      const intent = row.lastIntent || "unknown";
      map.set(intent, (map.get(intent) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [conversations]);

  const pendingCandidates = candidates.filter((item) => item.status === "pending");
  const approvedCandidates = candidates.filter((item) => item.status === "approved");

  const conversationColumns: Column<AiConversationRecord>[] = [
    {
      key: "session",
      header: t("admin.ai.session"),
      render: (row) => <span className="font-mono text-xs">{row.sessionId.slice(0, 12)}…</span>,
    },
    {
      key: "lang",
      header: t("admin.ai.language"),
      render: (row) => row.language.toUpperCase(),
    },
    {
      key: "intent",
      header: t("admin.ai.intent"),
      render: (row) => row.lastIntent || "—",
    },
    {
      key: "lead",
      header: t("admin.ai.leadStatus"),
      render: (row) => (
        <StatusBadge
          tone={
            row.leadStatus === "handoff"
              ? "active"
              : row.leadStatus === "potential"
                ? "scheduled"
                : "draft"
          }
          label={row.leadStatus}
        />
      ),
    },
    {
      key: "updated",
      header: t("admin.ai.updated"),
      render: (row) => new Date(row.lastMessageAt).toLocaleString(language === "ar" ? "ar" : "en"),
    },
  ];

  const candidateColumns: Column<KnowledgeCandidateRecord>[] = [
    {
      key: "q",
      header: t("admin.ai.question"),
      render: (row) => <span className="line-clamp-2 max-w-md text-sm">{row.question}</span>,
    },
    { key: "lang", header: t("admin.ai.language"), render: (row) => row.language },
    {
      key: "status",
      header: t("admin.table.status"),
      render: (row) => (
        <StatusBadge
          tone={
            row.status === "approved"
              ? "active"
              : row.status === "rejected"
                ? "expired"
                : "scheduled"
          }
          label={row.status}
        />
      ),
    },
  ];

  const leadColumns: Column<AiLeadRecord>[] = [
    { key: "name", header: t("admin.ai.name"), render: (row) => row.name || "—" },
    { key: "phone", header: t("admin.ai.phone"), render: (row) => row.phone || "—" },
    { key: "email", header: t("admin.ai.email"), render: (row) => row.email || "—" },
    {
      key: "interest",
      header: t("admin.ai.interest"),
      render: (row) => row.serviceInterest.join(", ") || "—",
    },
    {
      key: "status",
      header: t("admin.table.status"),
      render: (row) => (
        <StatusBadge tone={row.status === "new" ? "scheduled" : "active"} label={row.status} />
      ),
    },
  ];

  async function onApprove(candidate: KnowledgeCandidateRecord) {
    const answer = window.prompt(t("admin.ai.approvePrompt"), candidate.suggestedAnswer || "");
    if (!answer?.trim()) return;
    try {
      await approveKnowledgeCandidateClient(getDb(), candidate, answer.trim());
      setStatus(t("admin.ai.approved"));
      await refresh();
    } catch {
      setStatus(t("admin.ai.approveFailed"));
    }
  }

  async function onReject(candidate: KnowledgeCandidateRecord) {
    try {
      await setDoc(
        doc(getDb(), KNOWLEDGE_CANDIDATES_COLLECTION, candidate.id),
        {
          ...candidate,
          status: "rejected",
          reviewedAt: new Date().toISOString(),
          reviewedBy: user?.email || user?.id || "admin",
        },
        { merge: true },
      );
      setStatus(t("admin.ai.rejected"));
      await refresh();
    } catch {
      setStatus(t("admin.ai.approveFailed"));
    }
  }

  async function onCloseLead(lead: AiLeadRecord) {
    try {
      await updateAiLeadStatusClient(getDb(), lead.id, "closed");
      await refresh();
    } catch {
      setStatus(t("admin.ai.loadFailed"));
    }
  }

  async function onSync() {
    setSyncing(true);
    setStatus("");
    try {
      const result = await triggerKnowledgeSync();
      if (result.ok) {
        setStatus(
          language === "ar"
            ? `تمت المزامنة — ${result.total ?? 0} مستند`
            : `Synced — ${result.total ?? 0} documents`,
        );
      } else {
        setStatus(result.error || t("admin.ai.syncFailed"));
      }
      await refresh();
    } catch {
      setStatus(t("admin.ai.syncFailed"));
    } finally {
      setSyncing(false);
    }
  }

  if (!can("ai")) {
    return (
      <AdminLayout title={t("admin.nav.ai")}>
        <p className="text-sm text-muted-foreground">{t("admin.ai.noPermission")}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={t("admin.nav.ai")}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">{t("admin.ai.subtitle")}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-navy/15 bg-white px-4 py-2 text-sm text-navy"
          >
            <RefreshCw className="size-4" />
            {t("admin.ai.refresh")}
          </button>
          <button
            type="button"
            disabled={syncing}
            onClick={() => void onSync()}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            <Bot className="size-4" />
            {syncing ? t("admin.ai.syncing") : t("admin.ai.syncNow")}
          </button>
        </div>
      </div>

      {status ? <p className="mb-4 text-sm text-navy/80">{status}</p> : null}
      {loading ? <p className="mb-4 text-xs text-navy/55">{t("admin.ai.loading")}</p> : null}

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("admin.ai.knowledgeDocs")} value={String(knowledgeCount)} />
        <StatCard label={t("admin.ai.conversations")} value={String(conversations.length)} />
        <StatCard
          label={t("admin.ai.pendingCandidates")}
          value={String(pendingCandidates.length)}
        />
        <StatCard
          label={t("admin.ai.syncStatus")}
          value={syncNeeds ? t("admin.ai.syncNeeded") : t("admin.ai.syncOk")}
        />
      </div>

      {intentStats.length > 0 ? (
        <section className="mb-8">
          <h3 className="mb-3 font-display text-lg text-navy">{t("admin.ai.popularIntents")}</h3>
          <ul className="flex flex-wrap gap-2">
            {intentStats.map(([intent, count]) => (
              <li
                key={intent}
                className="rounded-full border border-navy/10 bg-white px-3 py-1 text-xs text-navy/80"
              >
                {intent}: {count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mb-10">
        <h3 className="mb-3 font-display text-lg text-navy">{t("admin.ai.conversations")}</h3>
        <DataTable
          columns={conversationColumns}
          rows={conversations}
          getRowId={(row) => row.conversationId}
        />
      </section>

      <section className="mb-10">
        <h3 className="mb-3 font-display text-lg text-navy">{t("admin.ai.leads")}</h3>
        <DataTable
          columns={leadColumns}
          rows={leads}
          getRowId={(row) => row.id}
          actions={(row) =>
            row.status === "new" ? (
              <RowAction
                icon={Check}
                label={t("admin.ai.closeLead")}
                onClick={() => void onCloseLead(row)}
              />
            ) : null
          }
        />
      </section>

      <section className="mb-10">
        <h3 className="mb-3 font-display text-lg text-navy">{t("admin.ai.candidates")}</h3>
        <DataTable
          columns={candidateColumns}
          rows={pendingCandidates}
          getRowId={(row) => row.id}
          actions={(row) => (
            <>
              <RowAction
                icon={Check}
                label={t("admin.ai.approve")}
                onClick={() => void onApprove(row)}
              />
              <RowAction
                icon={X}
                label={t("admin.ai.reject")}
                tone="danger"
                onClick={() => void onReject(row)}
              />
            </>
          )}
        />
      </section>

      <section>
        <h3 className="mb-3 font-display text-lg text-navy">{t("admin.ai.approvedKnowledge")}</h3>
        <DataTable
          columns={candidateColumns}
          rows={approvedCandidates}
          getRowId={(row) => row.id}
        />
      </section>
    </AdminLayout>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white px-4 py-3">
      <p className="text-[0.65rem] tracking-[0.16em] text-navy/45 uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl text-navy">{value}</p>
    </div>
  );
}
