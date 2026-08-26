import { z } from "zod";
import {
  emptyCustomerContext,
  type CustomerContext,
} from "@/lib/agent/context";
import {
  buildConversationRecord,
  loadConversation,
  makeMessageId,
  appendConversationMessage,
  saveConversation,
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
import { tryGetAdminFirestore } from "@/server/agent/firebaseAdmin";
import { getDb } from "@/lib/firebase";
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

async function loadExisting(sessionId: string) {
  const adminDb = await tryGetAdminFirestore();
  if (adminDb) return loadConversationAdmin(adminDb, sessionId);
  try {
    return await loadConversation(getDb(), sessionId);
  } catch {
    return null;
  }
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
    const existing = await loadExisting(sessionId);
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

    // 1) Persist conversation + messages first (client SDK allowed by rules).
    const adminDb = await tryGetAdminFirestore();
    if (adminDb) {
      await saveConversationAdmin(adminDb, record);
      await appendConversationMessageAdmin(adminDb, sessionId, noteUser);
      await appendConversationMessageAdmin(adminDb, sessionId, noteAssistant);
    } else {
      // Client rules currently allow customerContext; denormalized visitor* fields
      // may be rejected until firestore.rules are deployed — keep contact in context.
      const clientRecord = { ...record };
      delete clientRecord.visitorName;
      delete clientRecord.visitorPhone;
      delete clientRecord.visitorEmail;
      const db = getDb();
      await saveConversation(db, clientRecord);
      await appendConversationMessage(db, sessionId, noteUser);
      await appendConversationMessage(db, sessionId, noteAssistant);
    }

    // 2) Leads require Admin SDK (rules block client create) — best-effort only.
    try {
      if (adminDb) {
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
        logAiUsage({
          event: "lead_created",
          sessionId,
          language,
          intent: "contact_form",
        });
      }
    } catch {
      // Conversation already saved; lead can wait for Admin credentials.
    }

    return { ok: true, confirmation: noteAssistant.content };
  } catch (error) {
    console.error("[saveChatContact]", error);
    return { ok: false, code: "SERVICE" };
  }
}
