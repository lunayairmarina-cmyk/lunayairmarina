/** Normalize Saudi / Gulf mobile numbers for storage and comparison. */

const NON_DIGIT = /[^\d+]/g;

export interface NormalizedPhone {
  raw: string;
  normalized: string;
  valid: boolean;
}

export function stripPhoneInput(input: string): string {
  return input.replace(NON_DIGIT, "").trim();
}

export function normalizeSaudiPhone(input: string): NormalizedPhone {
  const raw = input.trim();
  let digits = stripPhoneInput(raw);

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("+")) digits = digits.slice(1);

  if (digits.startsWith("966")) {
    digits = digits.slice(3);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  const valid = /^5\d{8}$/.test(digits);
  const normalized = valid ? `+966${digits}` : raw.slice(0, 40);

  return { raw, normalized, valid: valid || digits.length >= 9 };
}

export function validatePhone(input: string): boolean {
  const trimmed = input.trim();
  if (trimmed.length < 7 || trimmed.length > 40) return false;
  const { valid } = normalizeSaudiPhone(trimmed);
  return valid;
}

export function validateVisitorName(input: string): boolean {
  const name = input.trim();
  if (name.length < 2 || name.length > 120) return false;
  if (/^\d+$/.test(name)) return false;
  if (/^[^a-zA-Z\u0600-\u06FF]+$/.test(name)) return false;
  return true;
}
