import entitiesConfig from "@/data/chatbot/entities.json";
import { normalizeMessage, tokenize } from "./normalize";
import { parseYachtLength, type ParsedYachtLength } from "./yachtLength";

export type YachtLengthEntity = ParsedYachtLength;

export interface ExtractedEntitySet {
  yacht: boolean;
  yachtType?: string;
  locations: string[];
  locationCanonical: string[];
  services: string[];
  yachtLength?: YachtLengthEntity;
  hasOwnership: boolean;
  pricingInterest: boolean;
  contactIntent: boolean;
  customerGoal?: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  objectionType?: "PRICE_OBJECTION" | "HESITATION" | "COMPARISON" | "NO_CONTACT_OBJECTION";
  phone?: string;
  email?: string;
  name?: string;
}

export function emptyExtractedEntities(): ExtractedEntitySet {
  return {
    yacht: false,
    locations: [],
    locationCanonical: [],
    services: [],
    hasOwnership: false,
    pricingInterest: false,
    contactIntent: false,
    urgency: "LOW",
  };
}

interface EntitiesCfg {
  types: {
    yacht: { variants: string[] };
    yacht_type?: { canonical: Record<string, string[]> };
    location: { canonical: Record<string, string[]> };
    service: { variants: Record<string, string[]> };
    yacht_length: { patterns: string[] };
    urgency?: { high: string[] };
    objection?: { types: Record<string, string[]> };
  };
  ownershipPhrases: string[];
}

const cfg = entitiesConfig as unknown as EntitiesCfg;

export function extractEntities(message: string): ExtractedEntitySet {
  const rawMsg = message;
  const normalized = normalizeMessage(message);
  const tokens = tokenize(normalized);
  const joined = tokens.join(" ");

  let yacht = false;
  for (const v of cfg.types.yacht.variants) {
    const nv = normalizeMessage(v);
    if (tokens.includes(nv) || joined.includes(nv)) {
      yacht = true;
      break;
    }
  }

  let yachtType: string | undefined;
  if (cfg.types.yacht_type?.canonical) {
    for (const [canonical, variants] of Object.entries(cfg.types.yacht_type.canonical)) {
      for (const v of variants) {
        const nv = normalizeMessage(v);
        if (tokens.includes(nv) || joined.includes(nv)) {
          yachtType = canonical;
          yacht = true;
          break;
        }
      }
      if (yachtType) break;
    }
  }

  const locations: string[] = [];
  const locationCanonical: string[] = [];
  for (const [canonical, variants] of Object.entries(cfg.types.location.canonical)) {
    for (const v of variants) {
      const nv = normalizeMessage(v);
      if (tokens.includes(nv) || joined.includes(nv)) {
        locations.push(nv);
        if (!locationCanonical.includes(canonical)) locationCanonical.push(canonical);
        break;
      }
    }
  }

  const services: string[] = [];
  for (const [service, variants] of Object.entries(cfg.types.service.variants)) {
    for (const v of variants) {
      const nv = normalizeMessage(v);
      if (tokens.includes(nv) || joined.includes(nv)) {
        if (!services.includes(service)) services.push(service);
        break;
      }
    }
  }

  const yachtLength = parseYachtLength(message);
  if (yachtLength) yacht = true;

  const hasOwnership = cfg.ownershipPhrases.some((p) => normalized.includes(normalizeMessage(p)));

  const pricingInterest =
    normalized.includes("بكم") ||
    normalized.includes("بكام") ||
    normalized.includes("سعر") ||
    normalized.includes("price") ||
    normalized.includes("cost") ||
    normalized.includes("how much") ||
    tokens.includes("كم");

  const contactIntent =
    normalized.includes("تواصل") ||
    normalized.includes("contact") ||
    normalized.includes("رقم") ||
    normalized.includes("واتس") ||
    normalized.includes("whatsapp") ||
    normalized.includes("phone");

  let urgency: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (cfg.types.urgency?.high) {
    for (const phrase of cfg.types.urgency.high) {
      const np = normalizeMessage(phrase);
      if (normalized.includes(np)) {
        urgency = "HIGH";
        break;
      }
    }
  }

  let objectionType: ExtractedEntitySet["objectionType"] | undefined;
  if (cfg.types.objection?.types) {
    for (const [objKind, phrases] of Object.entries(cfg.types.objection.types)) {
      for (const phrase of phrases) {
        const np = normalizeMessage(phrase);
        if (normalized.includes(np)) {
          objectionType = objKind as ExtractedEntitySet["objectionType"];
          break;
        }
      }
      if (objectionType) break;
    }
  }

  let customerGoal: string | undefined;
  if (hasOwnership) customerGoal = "turnkey_management";
  else if (services.includes("crew") && !services.includes("management")) customerGoal = "crew_placement";
  else if (services.includes("marina") && !services.includes("management")) customerGoal = "berth_booking";
  else if (services.includes("maintenance") && !services.includes("management")) customerGoal = "yacht_upkeep";
  else if (services.includes("agency")) customerGoal = "entry_clearance";

  // Contact info extraction (phone & email)
  let phone: string | undefined;
  const phoneMatch = rawMsg.match(/(?:\+?966|0)?5\d{8}\b/);
  if (phoneMatch) phone = phoneMatch[0];

  let email: string | undefined;
  const emailMatch = rawMsg.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) email = emailMatch[0];

  return {
    yacht: yacht || hasOwnership,
    yachtType,
    locations: [...new Set(locations)],
    locationCanonical: [...new Set(locationCanonical)],
    services,
    yachtLength,
    hasOwnership,
    pricingInterest,
    contactIntent,
    customerGoal,
    urgency,
    objectionType,
    phone,
    email,
  };
}

