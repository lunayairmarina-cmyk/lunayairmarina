export interface ParsedYachtLength {
  entity: "YACHT_LENGTH";
  value: number;
  unit: "m" | "ft";
  raw: string;
}

function normalizeDigits(s: string): string {
  return s.replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

const LENGTH_PATTERNS: Array<{ re: RegExp; unit: "m" | "ft" }> = [
  { re: /(\d{2,3})\s*(?:meters?|metres?)\b/i, unit: "m" },
  { re: /(\d{2,3})\s*(?:feet|foot|ft)\b/i, unit: "ft" },
  { re: /(\d{2,3})\s*(?:مترا|متر|أمتار|امtar|امtar)/i, unit: "m" },
  { re: /(\d{2,3})\s*قدم/i, unit: "ft" },
  { re: /(\d{2,3})\s*m\b/i, unit: "m" },
  { re: /(\d{2,3})m\b/i, unit: "m" },
  { re: /(\d{2,3})\s*ft\b/i, unit: "ft" },
  { re: /(\d{2,3})ft\b/i, unit: "ft" },
  { re: /(\d{2,3})\s*م(?:تر|ترا)?(?=\s|$)/i, unit: "m" },
];

export function parseYachtLength(message: string): ParsedYachtLength | undefined {
  const digitNorm = normalizeDigits(message.normalize("NFKC"));
  for (const { re, unit } of LENGTH_PATTERNS) {
    const m = digitNorm.match(re);
    if (!m?.[1]) continue;
    const value = parseInt(m[1], 10);
    if (value < 10 || value > 200) continue;
    return {
      entity: "YACHT_LENGTH",
      value,
      unit,
      raw: m[0]!,
    };
  }
  return undefined;
}

export function formatYachtLength(length: { value: number; unit: string }): string {
  return length.unit === "ft" ? `${length.value}ft` : `${length.value}m`;
}
