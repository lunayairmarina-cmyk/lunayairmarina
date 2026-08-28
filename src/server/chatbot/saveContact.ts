import { z } from "zod";
import {
  emptyCustomerContext,
  type CustomerContext,
} from "@/lib/agent/context";
import {
  buildConversationRecord,
  makeMessageId,
} from "@/server/agent/conversationStore";
import { pairedMessageTimestamps } from "@/lib/agent/messageOrder";
import { stripUndefinedDeep } from "@/lib/agent/firestoreSanitize";
import {
  appendConversationMessageAdmin,
  loadConversationAdmin,
  saveConversationAdmin,
} from "@/server/agent/conversationStoreAdmin";
import { buildAiLeadRecord } from "@/lib/agent/aiAdminClient";
import { createAiLeadAdmin, updateAiLeadAdmin } from "@/server/agent/leadsStoreAdmin";
import { probeAdminFirestore, tryGetAdminFirestore } from "@/server/agent/firebaseAdmin";
import {
  buildEnvDiagnostics,
  extractFirestoreError,
} from "@/server/agent/firebaseAdminDiagnostics";
import { logAiUsage } from "@/server/agent/usageLog";

const contactSchema = z.object({
  sessionId: z
    .string()
    .trim()
    .min(8)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/),
  language: z.enum(["ar", "en"]),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().max(200).optional(),
});

export type SaveChatContactResult =
  | { ok: true; confirmation: string }
  | { ok: false; code: "VALIDATION" | "SERVICE" };

async function loadExistingAdmin(sessionId: string) {
  const adminDb = await tryGetAdminFirestore();
  if (!adminDb) return null;
  return loadConversationAdmin(adminDb, sessionId);
}

/** Persist visitor contact from the in-chat form (conversation + optional lead). */
export async function saveChatContact(input: unknown): Promise<SaveChatContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "VALIDATION" };

  const { sessionId, language, name, phone } = parsed.data;
  const rawEmail = parsed.data.email?.trim() ?? "";
  const email = rawEmail && /.+@.+\..+/.test(rawEmail) ? rawEmail.toLowerCase() : undefined;
  const now = new Date().toISOString();

  try {
    const adminDb = await tryGetAdminFirestore();
    if (!adminDb) {
      const diagnostics = await probeAdminFirestore();
      console.error("[saveChatContact] admin unavailable", {
        ...diagnostics,
        SAVE_CONVERSATION_START: false,
        SAVE_CONVERSATION_ERROR_CODE: "admin_unavailable",
        SAVE_CONVERSATION_ERROR_MESSAGE: diagnostics.ADMIN_INIT_ERROR_MESSAGE ?? "admin_db_null",
      });
      return { ok: false, code: "SERVICE" };
    }

    const existing = await loadExistingAdmin(sessionId);
    let customerContext = emptyCustomerContext();
    if (existing?.customerContext && typeof existing.customerContext === "object") {
      const stored = existing.customerContext as unknown as CustomerContext;
      customerContext = {
        ...emptyCustomerContext(),
        ...stored,
        interests: Array.isArray(stored.interests) ? stored.interests : [],
      };
    }
    customerContext = {
      ...customerContext,
      name,
      phone,
      requestedContactMethod: customerContext.requestedContactMethod || "phone",
    };
    const resolvedEmail = email || customerContext.email?.trim() || "";
    if (resolvedEmail) customerContext.email = resolvedEmail;
    else delete customerContext.email;

    const record =
      existing ??
      buildConversationRecord({
        sessionId,
        language,
        customerContext,
      });
    record.lastMessageAt = now;
    record.customerContext = stripUndefinedDeep(
      customerContext as unknown as Record<string, unknown>,
    );
    record.visitorName = name;
    record.visitorPhone = phone;
    if (resolvedEmail) record.visitorEmail = resolvedEmail;
    else delete record.visitorEmail;
    record.leadStatus = "handoff";
    record.summary = [
      record.summary,
      language === "ar" ? `تواصل: ${name} / ${phone}` : `Contact: ${name} / ${phone}`,
    ]
      .filter(Boolean)
      .join(" ")
      .slice(0, 1200);

    const { userAt, assistantAt } = pairedMessageTimestamps(new Date(now));
    const noteUser = {
      id: makeMessageId("user"),
      role: "user" as const,
      content:
        language === "ar"
          ? `بيانات التواصل:\nالاسم: ${name}\nالجوال: ${phone}${resolvedEmail ? `\nالإيميل: ${resolvedEmail}` : ""}`
          : `Contact details:\nName: ${name}\nMobile: ${phone}${resolvedEmail ? `\nEmail: ${resolvedEmail}` : ""}`,
      timestamp: userAt,
      intent: "contact_form",
    };
    const noteAssistant = {
      id: makeMessageId("assistant"),
      role: "assistant" as const,
      content:
        language === "ar"
          ? `شكرًا ${name}، تم حفظ بياناتك. فريق Lunayair Marina سيتواصل معك قريبًا على ${phone}. كيف يمكنني مساعدتك أكثر؟`
          : `Thank you ${name} — your details are saved. The Lunayair Marina team will reach you soon on ${phone}. How else can I help?`,
      timestamp: assistantAt,
      confidence: "high" as const,
    };

    console.info("[saveChatContact]", {
      ...buildEnvDiagnostics(),
      ADMIN_DB: true,
      SAVE_CONVERSATION_START: true,
      sessionId,
    });

    try {
      await saveConversationAdmin(adminDb, record);
      console.info("[saveChatContact]", {
        SAVE_CONVERSATION_SUCCESS: true,
        sessionId,
      });
    } catch (error) {
      const firestoreError = extractFirestoreError(error);
      console.error("[saveChatContact]", {
        ...buildEnvDiagnostics(),
        ADMIN_DB: true,
        SAVE_CONVERSATION_START: true,
        SAVE_CONVERSATION_SUCCESS: false,
        SAVE_CONVERSATION_ERROR_CODE: firestoreError.code ?? "conversation_write_failed",
        SAVE_CONVERSATION_ERROR_MESSAGE: firestoreError.message,
        sessionId,
      });
      throw error;
    }

    try {
      await appendConversationMessageAdmin(adminDb, sessionId, noteUser);
      await appendConversationMessageAdmin(adminDb, sessionId, noteAssistant);
      console.info("[saveChatContact]", {
        SAVE_MESSAGE_SUCCESS: true,
        sessionId,
      });
    } catch (error) {
      const firestoreError = extractFirestoreError(error);
      console.error("[saveChatContact]", {
        ...buildEnvDiagnostics(),
        ADMIN_DB: true,
        SAVE_MESSAGE_SUCCESS: false,
        SAVE_CONVERSATION_ERROR_CODE: firestoreError.code ?? "message_write_failed",
        SAVE_CONVERSATION_ERROR_MESSAGE: firestoreError.message,
        sessionId,
      });
      throw error;
    }

    // Leads require Admin SDK — best-effort only.
    try {
      if (record.leadId) {
        await updateAiLeadAdmin(adminDb, record.leadId, {
          name,
          phone,
          email: resolvedEmail || "",
          yachtType: (customerContext.yachtType ?? customerContext.customerType ?? "").slice(0, 80),
          yachtLength: (customerContext.yachtLength ?? "").slice(0, 40),
          location: (customerContext.location ?? "").slice(0, 80),
          serviceInterest: (customerContext.interests ?? []).slice(0, 12),
        });
      } else {
        const lead = buildAiLeadRecord({
          conversationId: sessionId,
          context: customerContext,
          name,
          phone,
          email: resolvedEmail || undefined,
        });
        await createAiLeadAdmin(adminDb, lead);
        record.leadId = lead.id;
        await saveConversationAdmin(adminDb, record);
      }
      console.info("[saveChatContact]", { SAVE_LEAD_SUCCESS: true, sessionId });
      logAiUsage({
        event: "lead_created",
        sessionId,
        language,
        intent: "contact_form",
      });
    } catch (error) {
      const firestoreError = extractFirestoreError(error);
      console.error("[saveChatContact]", {
        SAVE_LEAD_SUCCESS: false,
        SAVE_LEAD_ERROR_CODE: firestoreError.code,
        SAVE_LEAD_ERROR_MESSAGE: firestoreError.message,
        sessionId,
      });
    }

    return { ok: true, confirmation: noteAssistant.content };
  } catch (error) {
    const firestoreError = extractFirestoreError(error);
    console.error("[saveChatContact]", {
      ...buildEnvDiagnostics(),
      SAVE_CONVERSATION_ERROR_CODE: firestoreError.code ?? "service_error",
      SAVE_CONVERSATION_ERROR_MESSAGE: firestoreError.message,
    });
    return { ok: false, code: "SERVICE" };
  }
}
