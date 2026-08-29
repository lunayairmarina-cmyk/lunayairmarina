import entitiesConfig from "@/data/chatbot/entities.json";
import { normalizeMessage, tokenize } from "./normalize";

export interface DetectedEntities {
  yachtLength?: string;
  locations: string[];
  hasOwnershipSignal: boolean;
}

const cfg = entitiesConfig as {
  types: { location: { canonical: Record<string, string[]> } };
  ownershipPhrases: string[];
};

const LOCATION_TOKENS = new Set<string>();
for (const variants of Object.values(cfg.types.location.canonical)) {
  for (const v of variants) LOCATION_TOKENS.add(normalizeMessage(v));
}
LOCATION_TOKENS.add("red");
LOCATION_TOKENS.add("sea");

const OWNERSHIP_PHRASES = cfg.ownershipPhrases.map((p) => normalizeMessage(p));

export function detectEntities(message: string): DetectedEntities {
  const normalized = normalizeMessage(message);
  const tokens = tokenize(normalized);
  const locations: string[] = [];

  for (const t of tokens) {
    if (LOCATION_TOKENS.has(t)) locations.push(t);
  }
  if (normalized.includes("red sea") || normalized.includes("البحر الاحمر")) {
    locations.push("red_sea");
  }

  const lengthMatch = normalized.match(/(\d{2,3})\s*(متر|m|meter|meters|ft|feet)/);
  const yachtLength = lengthMatch ? lengthMatch[0] : undefined;

  const hasOwnershipSignal = OWNERSHIP_PHRASES.some((p) => normalized.includes(p));

  return { yachtLength, locations: [...new Set(locations)], hasOwnershipSignal };
}
