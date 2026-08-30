import type { ChatLanguage } from "@/lib/chatbot/types";
import servicesFile from "@/data/chatbot/services.json";
import contact from "@/data/chatbot/contact.json";
import limitations from "@/data/chatbot/limitations.json";

type Localized = { en: string; ar: string };

function loc(value: Localized, language: ChatLanguage): string {
  return language === "ar" ? value.ar : value.en;
}

export const MAX_DISCLOSURE_LEVEL = 4;

export function resolveDisclosureTopic(serviceId?: string, intent?: string): string {
  if (serviceId) return serviceId;
  if (intent?.includes("YACHT_MANAGEMENT")) return "yacht-management-360";
  if (intent?.includes("CREW")) return "crew-management";
  if (intent?.includes("MARINA")) return "marina-management";
  if (intent?.includes("VISITING")) return "visiting-yacht-agency";
  return "general";
}

export function detectScopeQuestion(message: string): boolean {
  return /وش تشمل|وش تتضمن|ماذا تشمل|what('s| is| are) included|what does .* include|includes\b|scope of|نطاق/i.test(
    message.normalize("NFKC"),
  );
}

export function detectProgressiveRequest(message: string): boolean {
  return /وش بعد|وايش بعد|تفاصيل أكثر|تفاصيل اكتر|وش بعدين|وبعدين|show more|more details|what else|tell me more/i.test(
    message.normalize("NFKC"),
  );
}

function findService(serviceId: string) {
  return servicesFile.services.find((service) => service.id === serviceId);
}

export function advanceDisclosureLevel(
  current: number,
  reason: "scope" | "progressive",
): number {
  if (reason === "scope") return current === 0 ? 1 : current;
  return Math.min(MAX_DISCLOSURE_LEVEL, current + 1);
}

/** KB-grounded facts for the requested level only (no invented details). */
export function buildDisclosureFacts(
  topicKey: string,
  level: number,
  language: ChatLanguage,
): string {
  if (level <= 0 || topicKey === "general") return "";
  if (level > MAX_DISCLOSURE_LEVEL) {
    return buildDisclosureFacts(topicKey, MAX_DISCLOSURE_LEVEL, language);
  }

  const lang = language === "ar" ? "ar" : "en";
  const service = findService(topicKey);

  if (level === 1 && service) {
    return loc(service.summary, lang);
  }

  if (level === 2 && service) {
    const items = service.includes[lang];
    return items.map((item) => `- ${item}`).join("\n");
  }

  if (level === 3 && service) {
    const pricing = loc(service.pricingLabel, lang);
    const priceNote = loc(limitations.priceNotPublished, lang);
    return `${pricing}\n${priceNote}`;
  }

  if (level >= 4) {
    const lines = [
      loc(limitations.priceNotPublished, lang),
      language === "ar"
        ? `للاستشارة: ${contact.urls.application} أو ${contact.email}`
        : `For consultation: ${contact.urls.application} or ${contact.email}`,
      contact.whatsappUrl,
    ];
    return lines.join("\n");
  }

  return "";
}

/** Only the content allowed at the current disclosure level. */
export function buildAllowedDisclosureContent(
  topicKey: string,
  level: number,
  language: ChatLanguage,
): string {
  return buildDisclosureFacts(topicKey, level, language);
}

/** Summaries of prior levels that must NOT be repeated verbatim. */
export function buildForbiddenDisclosureList(
  topicKey: string,
  currentLevel: number,
  language: ChatLanguage,
): string[] {
  if (currentLevel <= 1 || topicKey === "general") return [];
  const forbidden: string[] = [];
  for (let i = 1; i < currentLevel; i += 1) {
    const facts = buildDisclosureFacts(topicKey, i, language);
    if (facts) forbidden.push(`L${i}: ${facts.slice(0, 160)}`);
  }
  return forbidden;
}

export function buildProgressiveDisclosureBlock(input: {
  topicKey: string;
  level: number;
  language: ChatLanguage;
  nextLevel?: number;
  forbiddenLevels?: string[];
}): string {
  const { topicKey, level, language, nextLevel, forbiddenLevels } = input;
  if (level <= 0) return "";

  const facts = buildAllowedDisclosureContent(topicKey, level, language);
  const levelLabel =
    level === 1
      ? "Overview"
      : level === 2
        ? "Main responsibilities"
        : level === 3
          ? "Operational / pricing context"
          : "Consultation / handoff";

  const nextFacts =
    nextLevel && nextLevel <= MAX_DISCLOSURE_LEVEL
      ? buildDisclosureFacts(topicKey, nextLevel, language)
      : "";

  const lang = language === "ar" ? "ar" : "en";
  const header =
    lang === "ar"
      ? `PROGRESSIVE DISCLOSURE (internal — use ONLY these published facts for level ${level}, do NOT repeat prior levels verbatim):`
      : `PROGRESSIVE DISCLOSURE (internal — use ONLY these published facts for level ${level}, do NOT repeat prior levels verbatim):`;

  let block = `${header}\ntopic=${topicKey}\nlevel=${level} (${levelLabel})\nallowedContentOnly:\n${facts}`;
  const forbidden = forbiddenLevels ?? buildForbiddenDisclosureList(topicKey, level, language);
  if (forbidden.length) {
    block += `\nforbiddenRepeat (already disclosed — do NOT repeat):\n${forbidden.map((item) => `- ${item}`).join("\n")}`;
  }
  if (nextFacts && nextLevel) {
    block += `\nnextLevelPreview=${nextLevel} (do not disclose until visitor asks for more)`;
  }
  return block;
}
