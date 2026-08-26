import knowledge from "@/data/chatbot-knowledge.json";
import type { ChatLanguage } from "@/lib/chatbot/types";

export function getKnowledgeForLanguage(language: ChatLanguage): string {
  const lang = language === "ar" ? "ar" : "en";

  const payload = {
    version: knowledge.version,
    company: knowledge.company[lang],
    services: knowledge.services.map((service) => ({
      id: service.id,
      title: service.title[lang],
      summary: service.summary[lang],
    })),
    faq: knowledge.faq.map((item) => ({
      question: item.question[lang],
      answer: item.answer[lang],
    })),
    contact: {
      phoneDisplay: knowledge.contact.phoneDisplay,
      email: knowledge.contact.email,
      address: knowledge.contact.address[lang],
      hours: knowledge.contact.hours[lang],
      websitePaths: knowledge.contact.websitePaths,
      socialLinks: knowledge.contact.socialLinks,
    },
    limitations: knowledge.limitations[lang],
  };

  return JSON.stringify(payload, null, 2);
}
