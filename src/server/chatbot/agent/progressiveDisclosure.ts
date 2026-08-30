import type { ChatLanguage } from "@/lib/chatbot/types";
import servicesFile from "@/data/chatbot/services.json";
import contact from "@/data/chatbot/contact.json";
import limitations from "@/data/chatbot/limitations.json";
import type { FactSelectionResult } from "./factSelection";

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

/** Full KB prose for internal tracking / anti-repetition fingerprints (not prompt copy templates). */
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

export function buildDisclosureFactHintsFromSelection(
  selection: FactSelectionResult,
  language: ChatLanguage,
): string {
  const lines = selection.allowedFacts.map((fact) => `${fact.id} (${fact.kind})=${fact.text}`);
  lines.push(`angleHint=${selection.angleHint}`);
  lines.push(
    language === "ar"
      ? "instruction=استخدم هذه الحقائق فقط كمادة مصدر — أعد صياغتها محادثياً دون نسخ حرفي."
      : "instruction=Use only these facts as source material — express naturally without copying verbatim.",
  );
  return lines.join("\n");
}

/**
 * Structured fact hints for Gemini prompt — source material, not copy-paste templates.
 * Prefer factSelection when provided (information budget enforced server-side).
 */
export function buildDisclosureFactHints(
  topicKey: string,
  level: number,
  language: ChatLanguage,
  factSelection?: FactSelectionResult,
): string {
  if (factSelection) return buildDisclosureFactHintsFromSelection(factSelection, language);

  if (level <= 0 || topicKey === "general") return "";
  const service = findService(topicKey);
  const lang = language === "ar" ? "ar" : "en";
  if (!service) return "";

  if (level === 1) {
    return [
      `serviceId=${topicKey}`,
      `title=${loc(service.title, lang)}`,
      `themes=operational management, technical supervision, financial oversight, crew coordination, planned maintenance, maritime compliance`,
      `instruction=Cover these themes in your own words; do not quote the website summary sentence.`,
    ].join("\n");
  }

  if (level === 2) {
    return [
      `instruction=Present up to 3 new facts in natural prose — server will supply allowed facts via ALLOWED FACTS block.`,
    ].join("\n");
  }

  if (level === 3) {
    return [
      `pricingModel=${loc(service.pricingLabel, lang)}`,
      `pricePolicy=${loc(limitations.priceNotPublished, lang)}`,
      "instruction=Explain pricing context naturally without inventing numbers.",
    ].join("\n");
  }

  return [
    `consultationPaths=${contact.urls.application}, ${contact.email}`,
    `pricePolicy=${loc(limitations.priceNotPublished, lang)}`,
    "instruction=Offer consultation/handoff naturally; no pressure.",
  ].join("\n");
}

/** Only the content allowed at the current disclosure level. */
export function buildAllowedDisclosureContent(
  topicKey: string,
  level: number,
  language: ChatLanguage,
): string {
  return buildDisclosureFactHints(topicKey, level, language);
}

/** Prior level themes already covered — avoid repeating same information. */
export function buildForbiddenDisclosureList(
  topicKey: string,
  currentLevel: number,
  language: ChatLanguage,
): string[] {
  if (currentLevel <= 1 || topicKey === "general") return [];
  const forbidden: string[] = [];
  for (let i = 1; i < currentLevel; i += 1) {
    const label =
      i === 1
        ? "overview themes"
        : i === 2
          ? "includes/responsibilities list"
          : i === 3
            ? "pricing context"
            : "consultation/handoff";
    forbidden.push(`L${i}: ${label} (already covered — advance with new detail)`);
  }
  void language;
  void topicKey;
  return forbidden;
}

export function buildProgressiveDisclosureBlock(input: {
  topicKey: string;
  level: number;
  language: ChatLanguage;
  nextLevel?: number;
  forbiddenLevels?: string[];
  factSelection?: FactSelectionResult;
  questionFocus?: string;
}): string {
  const { topicKey, level, language, nextLevel, forbiddenLevels, factSelection, questionFocus } = input;
  if (level <= 0) return "";

  const hints = buildDisclosureFactHints(topicKey, level, language, factSelection);
  const levelLabel = factSelection?.reason ?? (
    level === 1
      ? "Overview"
      : level === 2
        ? "Main responsibilities"
        : level === 3
          ? "Operational / pricing context"
          : "Consultation / handoff"
  );

  const lang = language === "ar" ? "ar" : "en";
  const header =
    lang === "ar"
      ? `PROGRESSIVE DISCLOSURE (internal — ALLOWED FACTS for this turn; paraphrase naturally):`
      : `PROGRESSIVE DISCLOSURE (internal — ALLOWED FACTS for this turn; paraphrase naturally):`;

  let block = `${header}\ntopic=${topicKey}\nlevel=${level} (${levelLabel})`;
  if (questionFocus) block += `\nquestionFocus=${questionFocus}`;
  block += `\nallowedFactsSource:\n${hints}`;
  const forbidden = forbiddenLevels ?? buildForbiddenDisclosureList(topicKey, level, language);
  if (forbidden.length) {
    block += `\nalreadyCovered (do not repeat):\n${forbidden.map((item) => `- ${item}`).join("\n")}`;
  }
  if (nextLevel && nextLevel <= MAX_DISCLOSURE_LEVEL) {
    block += `\nnextLevel=${nextLevel} (hold until visitor asks for more)`;
  }
  return block;
}
