import { getStaticKnowledgeBundle } from "@/data/chatbot/loadKnowledge";
import { normalizeMessage } from "./normalize";

export function isGibberish(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;

  const n = normalizeMessage(trimmed);
  if (!n && trimmed.length > 0) return true;

  const bundle = getStaticKnowledgeBundle();
  const patterns = bundle.conceptRules?.gibberishPatterns ?? [];

  for (const p of patterns) {
    try {
      if (new RegExp(p, "i").test(n) || new RegExp(p, "i").test(trimmed)) return true;
    } catch {
      /* skip invalid */
    }
  }

  if (/^(asdfgh|qwerty|zxcvbn|xyz123|123456|testtest|asdf|qwertyuiop|xyz|abc123|123abc)$/i.test(trimmed) || /^(asdfgh|qwerty|zxcvbn|xyz123|123456|testtest|asdf|qwertyuiop|xyz|abc123|123abc)$/i.test(n) || /nonsense|random nonsense/i.test(trimmed)) {
    return true;
  }

  if (/^(.)\1{4,}$/.test(n.replace(/\s/g, ""))) return true;
  if (n.length <= 2 && !/^(كم|ok|hi|no|نعم|لا)$/i.test(n)) return false;

  const words = n.split(/\s+/).filter(Boolean);
  if (words.length === 1 && words[0]!.length >= 5 && !/[aeiouy\u0648\u0627\u064a\u0647]/i.test(words[0]!)) {
    return true;
  }

  return false;
}
