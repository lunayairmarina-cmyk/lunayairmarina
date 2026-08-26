export interface CustomerContext {
  customerType?: string;
  name?: string;
  phone?: string;
  email?: string;
  yachtLength?: string;
  yachtType?: string;
  location?: string;
  interests: string[];
  lastServiceMentioned?: string;
  requestedContactMethod?: string;
  urgency?: "low" | "medium" | "high";
  customerIntent?: string;
}

export function emptyCustomerContext(): CustomerContext {
  return { interests: [] };
}

export function mergeCustomerContext(
  current: CustomerContext,
  patch: Partial<CustomerContext>,
): CustomerContext {
  const interests = [...new Set([...(current.interests ?? []), ...(patch.interests ?? [])])];
  return {
    ...current,
    ...patch,
    interests,
  };
}

export function hasVisitorContact(context: CustomerContext): boolean {
  return Boolean(context.name?.trim() && context.phone?.trim());
}

export function formatCustomerContext(context: CustomerContext, language: "ar" | "en"): string {
  const lines: string[] = [];
  if (context.customerType) {
    lines.push(
      language === "ar"
        ? `نوع العميل: ${context.customerType}`
        : `Customer type: ${context.customerType}`,
    );
  }
  if (context.name)
    lines.push(language === "ar" ? `الاسم: ${context.name}` : `Name: ${context.name}`);
  if (context.phone)
    lines.push(language === "ar" ? `الهاتف: ${context.phone}` : `Phone: ${context.phone}`);
  if (context.email)
    lines.push(language === "ar" ? `الإيميل: ${context.email}` : `Email: ${context.email}`);
  if (context.yachtLength) {
    lines.push(
      language === "ar"
        ? `طول اليخت: ${context.yachtLength}`
        : `Yacht length: ${context.yachtLength}`,
    );
  }
  if (context.yachtType) {
    lines.push(
      language === "ar" ? `نوع اليخت: ${context.yachtType}` : `Yacht type: ${context.yachtType}`,
    );
  }
  if (context.location) {
    lines.push(language === "ar" ? `الموقع: ${context.location}` : `Location: ${context.location}`);
  }
  if (context.interests.length) {
    lines.push(
      language === "ar"
        ? `اهتمامات: ${context.interests.join(", ")}`
        : `Interests: ${context.interests.join(", ")}`,
    );
  }
  if (context.lastServiceMentioned) {
    lines.push(
      language === "ar"
        ? `آخر خدمة مذكورة: ${context.lastServiceMentioned}`
        : `Last service mentioned: ${context.lastServiceMentioned}`,
    );
  }
  if (context.requestedContactMethod) {
    lines.push(
      language === "ar"
        ? `وسيلة التواصل المفضلة: ${context.requestedContactMethod}`
        : `Preferred contact: ${context.requestedContactMethod}`,
    );
  }
  if (context.urgency) {
    lines.push(language === "ar" ? `الاستعجال: ${context.urgency}` : `Urgency: ${context.urgency}`);
  }
  if (context.customerIntent) {
    lines.push(
      language === "ar"
        ? `نية الزائر: ${context.customerIntent}`
        : `Intent: ${context.customerIntent}`,
    );
  }
  if (!context.name || !context.phone) {
    lines.push(
      language === "ar"
        ? "ملاحظة: بيانات التواصل تُجمع عبر نموذج الشات — لا تطلب الاسم/الجوال في النص."
        : "Note: contact is collected via the chat form — do not ask for name/phone in text.",
    );
  }
  return lines.join("\n");
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

const PHONE_RE = /(?:\+?\d[\d\s\-()]{7,}\d)/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Rule-based context extraction from user messages (no LLM). */
export function extractContextFromMessage(
  message: string,
  language: "ar" | "en",
  prior: CustomerContext,
): { context: CustomerContext } {
  const normalized = message.normalize("NFKC").toLowerCase();
  const original = message.normalize("NFKC").trim();
  const patch: Partial<CustomerContext> = {};

  const lengthMatch = normalized.match(/(\d+)\s*(?:ft|feet|foot|قدم)/i);
  if (lengthMatch) patch.yachtLength = `${lengthMatch[1]} feet`;

  if (/مالك\s*يخت|yacht owner|owner/i.test(normalized)) patch.customerType = "yacht_owner";

  if (/جدة|jeddah/i.test(normalized)) patch.location = language === "ar" ? "جدة" : "Jeddah";
  if (/البحر الأحمر|red sea/i.test(normalized)) {
    patch.location = language === "ar" ? "البحر الأحمر" : "Red Sea";
  }

  const phoneMatch = original.match(PHONE_RE);
  if (phoneMatch?.[0]) {
    patch.phone = phoneMatch[0].replace(/\s+/g, " ").trim();
    if (!patch.requestedContactMethod) patch.requestedContactMethod = "phone";
  }

  const emailMatch = original.match(EMAIL_RE);
  if (emailMatch?.[0]) {
    patch.email = emailMatch[0].trim().toLowerCase();
    if (!patch.requestedContactMethod) patch.requestedContactMethod = "email";
  }

  const nameMatch = original.match(
    language === "ar"
      ? /(?:اسمي|أنا اسمي|انا اسمي|الاسم\s*[:=]?\s*|my name is)\s*([^\n,،.]{2,40})/i
      : /(?:my name is|i am|i'm|name\s*[:=]\s*)\s*([a-z][a-z\s'-]{1,40})/i,
  );
  if (nameMatch?.[1]) {
    const cleaned = nameMatch[1].replace(PHONE_RE, "").replace(EMAIL_RE, "").trim();
    if (cleaned.length > 1 && cleaned.length < 60) patch.name = cleaned;
  }

  // Short reply that looks like a bare name after we already asked (no digits).
  if (
    !patch.name &&
    !prior.name &&
    original.length >= 2 &&
    original.length <= 40 &&
    !PHONE_RE.test(original) &&
    !EMAIL_RE.test(original) &&
    !/[?]/.test(original) &&
    (language === "ar"
      ? /^[\u0600-\u06FF\s'.-]+$/.test(original)
      : /^[a-zA-Z][a-zA-Z\s'.-]{1,39}$/.test(original))
  ) {
    if (
      !/^(نعم|لا|ok|okay|thanks|شكرا|مرحبا|السلام|hi|hello|yes|no)$/i.test(original.trim())
    ) {
      patch.name = original.trim();
    }
  }

  const interests = [...prior.interests];
  if (/إدارة\s*ال?طاق|طاقم|crew management|crew/i.test(normalized)) {
    interests.push("crew_management");
    patch.lastServiceMentioned = "crew-management";
  }
  if (/صيان|maintenance|تشغيل|operations/i.test(normalized)) {
    interests.push("maintenance_operations");
    if (!patch.lastServiceMentioned) patch.lastServiceMentioned = "yacht-management-360";
  }
  if (/إدارة\s*اليخوت|yacht management|360|كل حاجة|full management/i.test(normalized)) {
    interests.push("yacht_management");
    patch.lastServiceMentioned = "yacht-management-360";
    patch.customerIntent = "full_yacht_management";
  }
  if (/يخت\s*زائر|visiting yacht|agency/i.test(normalized)) {
    interests.push("visiting_yacht_agency");
    patch.lastServiceMentioned = "visiting-yacht-agency";
  }
  if (/مارينا|marina management/i.test(normalized)) {
    interests.push("marina_management");
    patch.lastServiceMentioned = "marina-management";
  }
  if (interests.length) patch.interests = interests;

  if (/عاجل|urgent|asap|بسرعة/i.test(normalized)) patch.urgency = "high";
  else if (/قريب|soon|قريبا/i.test(normalized)) patch.urgency = "medium";

  if (/whatsapp|واتس/i.test(normalized)) patch.requestedContactMethod = "whatsapp";
  if (/email|ايميل|إيميل|بريد/i.test(normalized)) patch.requestedContactMethod = "email";
  if (/phone|هاتف|اتصل|جوال|موبايل/i.test(normalized)) patch.requestedContactMethod = "phone";

  return { context: mergeCustomerContext(prior, patch) };
}

/** Compact rolling summary without LLM. */
export function updateConversationSummary(
  current: string,
  message: string,
  language: "ar" | "en",
  context: CustomerContext,
): string {
  const parts: string[] = [];
  if (context.name) {
    parts.push(language === "ar" ? `الاسم: ${context.name}.` : `Name: ${context.name}.`);
  }
  if (context.phone) {
    parts.push(language === "ar" ? `الجوال: ${context.phone}.` : `Phone: ${context.phone}.`);
  }
  if (context.yachtLength) {
    parts.push(
      language === "ar"
        ? `مالك/زائر لديه يخت ${context.yachtLength}.`
        : `Customer has a ${context.yachtLength} yacht.`,
    );
  }
  if (context.location) {
    parts.push(
      language === "ar" ? `الموقع: ${context.location}.` : `Location: ${context.location}.`,
    );
  }
  if (context.interests.length) {
    parts.push(
      language === "ar"
        ? `اهتمامات: ${context.interests.join(", ")}.`
        : `Interests: ${context.interests.join(", ")}.`,
    );
  }
  if (/price|pricing|سعر|تكلف/i.test(message)) {
    parts.push(
      language === "ar"
        ? "سأل عن التسعير (غير منشور علناً)."
        : "Asked about pricing (not publicly published).",
    );
  }
  if (/availability|متاح|مرسى|book/i.test(message)) {
    parts.push(
      language === "ar"
        ? "سأل عن التوفر (لا يوجد مصدر توفر فوري)."
        : "Asked about availability (no real-time source).",
    );
  }
  const next = parts.join(" ").trim();
  if (!next) return current;
  return [current, next].filter(Boolean).join(" ").slice(0, 1200);
}
