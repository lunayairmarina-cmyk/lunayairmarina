import type { CustomerContext } from "@/lib/agent/context";

/** Firestore lead fields from conversation context — no static-engine scoring. */
export function leadPatchFromContext(
  context: CustomerContext,
  intentId: string,
): Record<string, unknown> {
  return {
    name: (context.name ?? "").slice(0, 120),
    phone: (context.phone ?? "").slice(0, 40),
    normalizedPhone: (context.normalizedPhone ?? "").slice(0, 40),
    email: (context.email ?? "").slice(0, 200),
    yachtType: (context.yachtType ?? context.customerType ?? "").slice(0, 80),
    yachtLength: (context.yachtLength ?? "").slice(0, 40),
    location: (context.location ?? "").slice(0, 80),
    serviceInterest: (context.interests ?? []).slice(0, 12),
    leadScore: context.leadScore ?? 0,
    lastIntent: intentId,
    messageCount: context.messageCount ?? 0,
    yachtMentioned: Boolean(context.yachtMentioned),
    detectedLanguage: context.detectedLanguage,
    lastSeenAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
