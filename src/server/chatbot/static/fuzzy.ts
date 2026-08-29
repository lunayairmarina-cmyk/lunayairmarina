/** Safe fuzzy match for known vocabulary only (no whole-message fuzzy). */

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let prev = i;
    for (let j = 1; j <= b.length; j += 1) {
      const val =
        a[i - 1] === b[j - 1]
          ? row[j - 1]!
          : Math.min(row[j]! + 1, row[j - 1]! + 1, prev + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length]!;
}

export function fuzzyTokenMatch(
  token: string,
  candidates: string[],
  maxDistance: number,
  minLength: number,
): string | null {
  if (token.length < minLength) return null;
  for (const c of candidates) {
    if (token === c) return c;
    if (c.length < minLength) continue;
    const d = levenshtein(token, c);
    if (d <= maxDistance && d > 0) return c;
  }
  return null;
}
