/** IDs of admin-approved FAQ answers that must survive reingest. */
export function isProtectedKnowledgeDocumentId(id: string): boolean {
  return /^faq-approved-/i.test(id);
}

/**
 * Test-only / fixture knowledge that must not affect production retrieval ranking.
 * Keeps approved production candidates; excludes explicit kc-test fixtures.
 */
export function isTestOnlyKnowledgeDocument(input: {
  id: string;
  title?: string;
  content?: string;
  sourcePath?: string;
}): boolean {
  if (/kc-test/i.test(input.id)) return true;
  if (input.sourcePath && /knowledgeCandidates\/kc-test/i.test(input.sourcePath)) return true;
  const haystack = `${input.title ?? ""}\n${input.content ?? ""}`;
  if (/طلاء اليخت بالذهب|gold\s*paint|غير المذكورة/i.test(haystack)) return true;
  return false;
}
