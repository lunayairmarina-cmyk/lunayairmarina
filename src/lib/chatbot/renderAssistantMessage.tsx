import { Fragment, type ReactNode } from "react";
import company from "@/data/chatbot/company.json";
import { companyInfo } from "@/data/companyInfo";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/** Strip HTML tags so Gemini HTML is never rendered as markup. */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/** Decode common numeric and named entities without using innerHTML. */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => codePointChar(hex, 16))
    .replace(/&#(\d+);/g, (_, dec: string) => codePointChar(dec, 10))
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/(?:&#39;|&apos;)/gi, "'");
}

function codePointChar(value: string, radix: 10 | 16): string {
  const cp = Number.parseInt(value, radix);
  if (!Number.isFinite(cp) || cp < 0 || cp > 0x10_ffff) return "";
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}

export function normalizeAssistantText(text: string): string {
  return decodeHtmlEntities(stripHtmlTags(text)).replace(/\r\n/g, "\n").trim();
}

const WA_URL_RE =
  /https?:\/\/(?:wa\.me\/(\d{8,15})|api\.whatsapp\.com\/send\?(?:[^&\s]*&)*phone=(\d{8,15}))/gi;
const EXTERNAL_HTTP_URL_RE =
  /https?:\/\/(?!wa\.me(?:\/|\b))(?!api\.whatsapp\.com)[^\s<>)\]"']+/gi;
const PHONE_CANDIDATE_RE = /(?:\+?\d[\d\s\-()]{6,}\d)/g;
const WHATSAPP_WORD_RE = /whatsapp|واتساب|واتس/i;
const AGENCY_HOST = "top1markting.com";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normalize local/GCC mobiles to an international digit string for wa.me. */
export function normalizeWhatsAppDigits(raw: string): string | null {
  let digits = digitsOnly(raw);
  if (digits.length < 8 || digits.length > 15) return null;
  // Egyptian local: 01xxxxxxxxx → 201xxxxxxxxx
  if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 11) {
    digits = `20${digits.slice(1)}`;
  }
  return digits;
}

export function whatsappHrefFromDigits(digits: string): string {
  return `https://wa.me/${digits}`;
}

export function extractWhatsAppTarget(text: string): string | null {
  WA_URL_RE.lastIndex = 0;
  const urlMatch = WA_URL_RE.exec(text);
  if (urlMatch) {
    const fromUrl = normalizeWhatsAppDigits(urlMatch[1] || urlMatch[2] || "");
    if (fromUrl) return fromUrl;
  }

  const companyDigits = digitsOnly(companyInfo.whatsapp || companyInfo.phone);
  const mentionsWhatsApp = WHATSAPP_WORD_RE.test(text);
  const phones = text.match(PHONE_CANDIDATE_RE) ?? [];

  for (const phone of phones) {
    const normalized = normalizeWhatsAppDigits(phone);
    if (!normalized) continue;
    if (normalized === companyDigits || mentionsWhatsApp) return normalized;
  }

  // Company WhatsApp number written without the word "WhatsApp"
  if (companyDigits && digitsOnly(text).includes(companyDigits)) {
    return companyDigits;
  }

  if (mentionsWhatsApp && companyDigits) return companyDigits;
  return null;
}

function stripWhatsAppUrls(text: string): string {
  return text
    .replace(WA_URL_RE, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeExternalUrl(url: string): string {
  return url.replace(/[.,;:!?]+$/g, "").replace(/\/+$/, "").toLowerCase();
}

export function extractPublishedAgencyLink(text: string): string | null {
  const published = company.websiteImplementation.websiteUrl.replace(/\/+$/, "");
  EXTERNAL_HTTP_URL_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = EXTERNAL_HTTP_URL_RE.exec(text)) !== null) {
    const raw = match[0].replace(/[.,;:!?]+$/g, "");
    if (raw.toLowerCase().includes(AGENCY_HOST)) {
      return published;
    }
    if (normalizeExternalUrl(raw) === normalizeExternalUrl(published)) {
      return published;
    }
  }
  return null;
}

function stripPublishedAgencyUrls(text: string): string {
  const patterns = [
    company.websiteImplementation.websiteUrl,
    company.websiteImplementation.websiteUrl.replace(/\/$/, ""),
    `https://www.${AGENCY_HOST}`,
    `https://www.${AGENCY_HOST}/`,
    `https://${AGENCY_HOST}`,
    `https://${AGENCY_HOST}/`,
  ];
  let result = text;
  for (const pattern of patterns) {
    result = result.split(pattern).join("");
  }
  return result
    .replace(/(?:عبر\s*الرابط\s*:?\s*)/gi, "")
    .replace(/(?:via\s*the\s*link\s*:?\s*)/gi, "")
    .replace(/(?:for\s*more\s*information\s*\.?\s*)/gi, "")
    .replace(/(?:للمزيد\s*من\s*المعلومات\s*\.?\s*)/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function externalLinkLabel(url: string): string {
  if (url.toLowerCase().includes(AGENCY_HOST)) {
    return company.websiteImplementation.agency;
  }
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function isWhatsAppMatch(raw: string): boolean {
  return /wa\.me|api\.whatsapp\.com/i.test(raw);
}

function isListLine(line: string): boolean {
  return /^[*\-•]\s+/.test(line.trim());
}

function listLineContent(line: string): string {
  return line.trim().replace(/^[*\-•]\s+/, "");
}

function splitBlocks(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function renderTextWithBreaks(text: string, keyPrefix: string): ReactNode[] {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];

  lines.forEach((line, index) => {
    if (index > 0) nodes.push(<br key={`${keyPrefix}-br-${index}`} />);
    if (line) nodes.push(...renderInline(line, `${keyPrefix}-ln-${index}`));
  });

  return nodes.length ? nodes : [text];
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // Bold first, then phone/link detection inside plain segments.
  const nodes: ReactNode[] = [];
  const boldPattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = boldPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        ...renderPlainWithPhones(text.slice(lastIndex, match.index), `${keyPrefix}-plain-${part}`),
      );
      part += 1;
    }

    nodes.push(
      <strong key={`${keyPrefix}-strong-${part}`} className="font-semibold">
        {renderInline(match[1], `${keyPrefix}-nested-${part}`)}
      </strong>,
    );
    part += 1;
    lastIndex = boldPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderPlainWithPhones(text.slice(lastIndex), `${keyPrefix}-plain-${part}`));
  }

  return nodes.length ? nodes : [text];
}

function renderPlainWithPhones(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern =
    /(?:https?:\/\/(?:wa\.me\/\d{8,15}|api\.whatsapp\.com\/send\?[^\s]+)|https?:\/\/(?!wa\.me(?:\/|\b))(?!api\.whatsapp\.com)[^\s<>)\]"']+|(?:\+?\d[\d\s\-()]{6,}\d))/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-t-${part}`}>{text.slice(lastIndex, match.index)}</Fragment>,
      );
      part += 1;
    }

    const raw = match[0];
    if (isWhatsAppMatch(raw)) {
      const waUrlMatch = raw.match(
        /https?:\/\/(?:wa\.me\/(\d{8,15})|api\.whatsapp\.com\/send\?(?:[^&\s]*&)*phone=(\d{8,15}))/i,
      );
      const digits = waUrlMatch
        ? normalizeWhatsAppDigits(waUrlMatch[1] || waUrlMatch[2] || "")
        : normalizeWhatsAppDigits(raw);

      if (digits) {
        nodes.push(
          <a
            key={`${keyPrefix}-phone-${part}`}
            href={whatsappHrefFromDigits(digits)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-gold underline decoration-gold/50 underline-offset-2 hover:decoration-gold"
            dir="ltr"
          >
            {waUrlMatch ? companyInfo.phoneDisplay || raw : raw.trim()}
          </a>,
        );
      } else {
        nodes.push(<Fragment key={`${keyPrefix}-raw-${part}`}>{raw}</Fragment>);
      }
    } else if (/^https?:\/\//i.test(raw)) {
      const href = raw.replace(/[.,;:!?]+$/g, "");
      nodes.push(
        <a
          key={`${keyPrefix}-link-${part}`}
          href={href}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-gold underline decoration-gold/50 underline-offset-2 hover:decoration-gold"
          dir="ltr"
        >
          {externalLinkLabel(href)}
        </a>,
      );
    } else {
      const digits = normalizeWhatsAppDigits(raw);
      if (digits) {
        nodes.push(
          <a
            key={`${keyPrefix}-phone-${part}`}
            href={whatsappHrefFromDigits(digits)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-gold underline decoration-gold/50 underline-offset-2 hover:decoration-gold"
            dir="ltr"
          >
            {raw.trim()}
          </a>,
        );
      } else {
        nodes.push(<Fragment key={`${keyPrefix}-raw-${part}`}>{raw}</Fragment>);
      }
    }
    part += 1;
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-t-${part}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes.length ? nodes : [text];
}

function renderParagraph(block: string, key: string): ReactNode {
  const lines = block.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length > 0 && lines.every(isListLine)) {
    return (
      <ul key={key} className="my-1 list-disc space-y-1 ps-4 [overflow-wrap:anywhere]">
        {lines.map((line, index) => (
          <li key={`${key}-li-${index}`} className="min-w-0 break-words leading-relaxed">
            {renderInline(listLineContent(line), `${key}-li-inline-${index}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="min-w-0 break-words leading-relaxed [overflow-wrap:anywhere]">
      {renderTextWithBreaks(block, key)}
    </p>
  );
}

export function renderAssistantMessage(content: string): ReactNode[] {
  const normalized = normalizeAssistantText(content);
  if (!normalized) return [];

  return splitBlocks(normalized).map((block, index) =>
    renderParagraph(block, `assistant-block-${index}`),
  );
}

function WhatsAppCta({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1ebe5d] active:scale-[0.99]"
    >
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-current" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 6.045L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
      <span>{label}</span>
    </a>
  );
}

function ExternalLinkCta({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-sm font-semibold text-gold shadow-sm transition hover:bg-gold/20 active:scale-[0.99]"
    >
      <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      <span>{label}</span>
    </a>
  );
}

interface AssistantMessageContentProps {
  content: string;
  className?: string;
}

export function AssistantMessageContent({ content, className }: AssistantMessageContentProps) {
  const { t, language } = useLanguage();
  const normalized = normalizeAssistantText(content);
  const whatsappDigits = extractWhatsAppTarget(normalized);
  const agencyLink = extractPublishedAgencyLink(normalized);
  let displayText = normalized;
  if (whatsappDigits) displayText = stripWhatsAppUrls(displayText);
  if (agencyLink) displayText = stripPublishedAgencyUrls(displayText);
  const blocks = displayText ? renderAssistantMessage(displayText) : [];
  const agencyButtonLabel =
    language === "ar"
      ? `زيارة موقع ${company.websiteImplementation.agency}`
      : `Visit ${company.websiteImplementation.agency} website`;

  return (
    <div className={cn("space-y-2 break-words [overflow-wrap:anywhere]", className)}>
      {blocks.length ? (
        blocks
      ) : displayText ? (
        <p className="leading-relaxed">{displayText}</p>
      ) : null}
      {agencyLink ? <ExternalLinkCta href={agencyLink} label={agencyButtonLabel} /> : null}
      {whatsappDigits ? (
        <WhatsAppCta
          href={whatsappHrefFromDigits(whatsappDigits)}
          label={t("chatbot.whatsappButton")}
        />
      ) : null}
    </div>
  );
}
