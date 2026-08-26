import { Fragment, type ReactNode } from "react";
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
  const nodes: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let part = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-plain-${part}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>,
      );
      part += 1;
    }

    nodes.push(
      <strong key={`${keyPrefix}-strong-${part}`} className="font-semibold">
        {renderInline(match[1], `${keyPrefix}-nested-${part}`)}
      </strong>,
    );
    part += 1;
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(<Fragment key={`${keyPrefix}-plain-${part}`}>{text.slice(lastIndex)}</Fragment>);
  }

  return nodes.length ? nodes : [text];
}

function renderParagraph(block: string, key: string): ReactNode {
  const lines = block.split("\n").filter((line) => line.trim().length > 0);

  if (lines.length > 0 && lines.every(isListLine)) {
    return (
      <ul key={key} className="my-1 list-disc space-y-1 ps-4">
        {lines.map((line, index) => (
          <li key={`${key}-li-${index}`} className="leading-relaxed">
            {renderInline(listLineContent(line), `${key}-li-inline-${index}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <p key={key} className="leading-relaxed">
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

interface AssistantMessageContentProps {
  content: string;
  className?: string;
}

export function AssistantMessageContent({ content, className }: AssistantMessageContentProps) {
  const blocks = renderAssistantMessage(content);

  return (
    <div className={cn("space-y-2 break-words [overflow-wrap:anywhere]", className)}>
      {blocks.length ? (
        blocks
      ) : (
        <p className="leading-relaxed">{normalizeAssistantText(content)}</p>
      )}
    </div>
  );
}
