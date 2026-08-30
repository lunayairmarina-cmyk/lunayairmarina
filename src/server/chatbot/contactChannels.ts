import contact from "@/data/chatbot/contact.json";
import type { ChatLanguage } from "@/lib/chatbot/types";

/** Published WhatsApp URL — single source: src/data/chatbot/contact.json */
export function getPublishedWhatsAppUrl(): string {
  return contact.whatsappUrl;
}

export function getPublishedWhatsAppE164(): string {
  return contact.whatsapp;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whether reply already contains the published WhatsApp link or wa.me/<e164>. */
export function replyContainsPublishedWhatsAppUrl(reply: string): boolean {
  const url = getPublishedWhatsAppUrl();
  const e164 = getPublishedWhatsAppE164();
  return reply.includes(url) || new RegExp(`wa\\.me\\/${escapeRegExp(e164)}`, "i").test(reply);
}

export function appendPublishedWhatsAppUrl(reply: string): string {
  return `${reply.trim()}\n\n${getPublishedWhatsAppUrl()}`;
}

/** Authoritative published contact channels — sourced from src/data/chatbot/contact.json */
export function getPublishedContactChannels(language: ChatLanguage) {
  const isAr = language === "ar";
  return {
    phone: {
      display: contact.phoneDisplay,
      e164: contact.phone,
      label: isAr ? "رقم الهاتف للاتصال الصوتي" : "Direct phone (voice calls)",
    },
    whatsapp: {
      display: contact.phoneDisplay,
      e164: contact.whatsapp,
      url: contact.whatsappUrl,
      label: isAr ? "واتساب" : "WhatsApp messaging",
    },
    email: contact.email,
    contactForm: {
      url: contact.urls.contact,
      label: isAr ? "نموذج التواصل على الموقع" : "Website contact form",
    },
  };
}
