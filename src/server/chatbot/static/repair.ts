import agentRules from "@/data/chatbot/agent-rules.json";
import { normalizeMessage } from "./normalize";

const patterns = agentRules.repairPatterns as { ar: string[]; en: string[] };
const targets = agentRules.repairTargets as Record<
  string,
  { keywords: string[]; intent: string; topic: string }
>;

export interface RepairResult {
  isRepair: boolean;
  correctedIntent?: string;
  correctedTopic?: string;
  needsClarification?: boolean;
}

const REPAIR_PHRASES = [
  "لا مو هذا",
  "لا مو كذا",
  "لا مو قصدي",
  "مو قصدي",
  "قصدي شيء ثاني",
  "قصدي شي ثاني",
  "لا قصدي",
  "مو هذا",
  "غلط",
  "خطأ",
  "no that's not what I mean",
  "not that",
  "wrong",
  "i meant something else",
];

export function detectRepair(message: string): RepairResult {
  const n = normalizeMessage(message);
  const allPatterns = [
    ...patterns.ar,
    ...patterns.en,
    ...REPAIR_PHRASES,
  ].map((p) => normalizeMessage(p));

  const isRepair = allPatterns.some((p) => n.includes(p) || n.startsWith(p.trim()));
  if (!isRepair) return { isRepair: false };

  for (const target of Object.values(targets)) {
    for (const kw of target.keywords) {
      const nk = normalizeMessage(kw);
      if (n.includes(nk)) {
        return { isRepair: true, correctedIntent: target.intent, correctedTopic: target.topic };
      }
    }
  }

  if (n.includes("marina") || n.includes("مارينا") || n.includes("المارينا")) {
    return { isRepair: true, correctedIntent: "MARINA_MANAGEMENT", correctedTopic: "marina" };
  }
  if (n.includes("crew") || n.includes("طاقم") || n.includes("طاقm")) {
    return { isRepair: true, correctedIntent: "CREW_MANAGEMENT", correctedTopic: "crew" };
  }
  if (n.includes("yacht") || n.includes("يacht") || n.includes("يخت")) {
    return { isRepair: true, correctedIntent: "YACHT_MANAGEMENT", correctedTopic: "yacht" };
  }
  if (n.includes("تأمين") || n.includes("insurance")) {
    return { isRepair: true, correctedIntent: "INSURANCE", correctedTopic: "insurance" };
  }
  if (n.includes("صيانة") || n.includes("maintenance")) {
    return { isRepair: true, correctedIntent: "MAINTENANCE", correctedTopic: "maintenance" };
  }
  if (n.includes("تصاريح") || n.includes("permits")) {
    return { isRepair: true, correctedIntent: "VISITING_YACHT_PERMITS", correctedTopic: "agency" };
  }

  return { isRepair: true, needsClarification: true };
}

