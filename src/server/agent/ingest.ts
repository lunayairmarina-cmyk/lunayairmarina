import type { Firestore } from "firebase/firestore";
import type { IngestionReport } from "@/lib/agent/types";
import { buildKnowledgeDocuments, summarizeIngestion } from "./buildDocuments";
import {
  countKnowledgeDocuments,
  deleteStaleKnowledgeDocuments,
  upsertKnowledgeDocuments,
} from "./knowledgeStore";
import { loadKnowledgeSourceBundle } from "./loadSource";

export async function runKnowledgeIngestion(
  db: Firestore,
): Promise<IngestionReport & { removed: number }> {
  const bundle = await loadKnowledgeSourceBundle(db);
  const { documents, skipped } = buildKnowledgeDocuments(bundle);
  const activeIds = new Set(documents.map((doc) => doc.id));

  await upsertKnowledgeDocuments(db, documents);
  const removed = await deleteStaleKnowledgeDocuments(db, activeIds);
  const report = summarizeIngestion(documents, skipped);

  return { ...report, removed };
}

export function printIngestionReport(report: IngestionReport & { removed?: number }) {
  console.log("\n=== LUNAYAIR KNOWLEDGE INGESTION ===\n");
  console.log(`Arabic documents: ${report.arabicDocuments}`);
  console.log(`English documents: ${report.englishDocuments}`);
  console.log(`Total documents: ${report.totalDocuments}`);
  if (report.removed != null) console.log(`Removed stale documents: ${report.removed}`);
  console.log("\nCoverage:");
  console.log(`Company: ${report.coverage.company ? "✓" : "✗"}`);
  console.log(`Homepage: ${report.coverage.homepage ? "✓" : "✗"}`);
  console.log(`About: ${report.coverage.about ? "✓" : "✗"}`);
  console.log(`Services: ${report.coverage.services ? "✓" : "✗"}`);
  console.log(`FAQ: ${report.coverage.faq ? "✓" : "✗"}`);
  console.log(`Why Choose Us: ${report.coverage.why ? "✓" : "✗"}`);
  console.log(`Trust: ${report.coverage.trust ? "✓" : "✗"}`);
  console.log(`Fleet: ${report.coverage.fleet ? "✓" : "✗"}`);
  console.log(`Team: ${report.coverage.team ? "✓" : "✗"}`);
  console.log(`Blog: ${report.coverage.blog ? "✓" : "✗"}`);
  console.log(`Locations: ${report.coverage.locations ? "✓" : "✗"}`);
  console.log(`Advertising: ${report.coverage.advertising ? "✓" : "✗"}`);
  console.log(`Application: ${report.coverage.application ? "✓" : "✗"}`);
  console.log(`Contact: ${report.coverage.contact ? "✓" : "✗"}`);
  if (report.skipped.length) {
    console.log("\nSkipped:");
    for (const item of report.skipped) console.log(`- ${item}`);
  }
  console.log("\nBy type:", report.byType);
}

export { countKnowledgeDocuments };
