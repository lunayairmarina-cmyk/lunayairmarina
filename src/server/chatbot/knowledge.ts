import type { ChatLanguage } from "@/lib/chatbot/types";
import faqKnowledge from "@/data/chatbot-knowledge.json";
import company from "@/data/chatbot/company.json";
import contact from "@/data/chatbot/contact.json";
import locations from "@/data/chatbot/locations.json";
import limitations from "@/data/chatbot/limitations.json";
import servicesFile from "@/data/chatbot/services.json";

type Localized = { en: string; ar: string };

function loc(value: Localized, language: ChatLanguage): string {
  return language === "ar" ? value.ar : value.en;
}

function verifiedFactsPayload(language: ChatLanguage) {
  const lang = language === "ar" ? "ar" : "en";
  return {
    company: {
      name: company.name,
      persona: company.persona,
      tagline: loc(company.tagline, lang),
      founded: company.founded,
      description: loc(company.description, lang),
      mission: loc(company.mission, lang),
      vision: loc(company.vision, lang),
      stats: {
        yachtsManaged: company.stats.yachtsManaged,
        yachtsManagedLabel: loc(company.stats.yachtsManagedLabel, lang),
        partners: company.stats.partners,
        responseMinutes: company.stats.responseMinutes,
      },
    },
    locations: {
      headquarters: {
        city: loc(locations.headquarters.city, lang),
        country: loc(locations.headquarters.country, lang),
      },
      coverage: loc(locations.coverageNote, lang),
      regions: locations.regions.map((region) => loc({ en: region.en, ar: region.ar }, lang)),
    },
    services: servicesFile.services.map((service) => ({
      id: service.id,
      title: loc(service.title, lang),
      summary: loc(service.summary, lang),
      includes: service.includes[lang],
    })),
    contact: {
      phoneDisplay: contact.phoneDisplay,
      whatsappUrl: contact.whatsappUrl,
      email: contact.email,
      address: loc(contact.address, lang),
      hours: loc(contact.conciergeHours, lang),
      urls: contact.urls,
      social: contact.social,
    },
    limitations: {
      priceNotPublished: loc(limitations.priceNotPublished, lang),
      berthNotPublished: loc(limitations.berthNotPublished, lang),
      yachtRentalNotListed: loc(limitations.yachtRentalNotListed, lang),
      purchaseSaleOutOfScope: loc(limitations.purchaseSaleOutOfScope, lang),
      fleetDemoNote: loc(limitations.fleetDemoNote, lang),
    },
    faq: faqKnowledge.faq.map((item) => ({
      question: item.question[lang],
      answer: item.answer[lang],
    })),
  };
}

/** Compact verified Lunayair facts for retrieval fallback and Gemini grounding. */
export function getKnowledgeForLanguage(language: ChatLanguage): string {
  return JSON.stringify(verifiedFactsPayload(language), null, 2);
}

/**
 * Ground Gemini on verified business facts, plus retrieved website documents when present.
 * Omits matcher/intent IDs and unpublished numeric prices.
 */
export function composeGeminiKnowledge(language: ChatLanguage, retrievedKnowledge: string): string {
  const facts = verifiedFactsPayload(language);
  const compact = {
    company: facts.company,
    locations: facts.locations,
    services: facts.services,
    contact: facts.contact,
    limitations: facts.limitations,
  };
  const verifiedBlock = JSON.stringify(compact, null, 2);
  const retrieved = retrievedKnowledge.trim();
  if (!retrieved) {
    return `${verifiedBlock}\n\nFAQ:\n${JSON.stringify(facts.faq, null, 2)}`;
  }
  return `${verifiedBlock}\n\n---\nADDITIONAL RETRIEVED WEBSITE KNOWLEDGE:\n${retrieved}`;
}
