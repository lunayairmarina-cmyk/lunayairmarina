/**
 * One-off probe for verified audit gaps (retrieval + optional Gemini).
 * Does not modify production CMS. No secrets logged.
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

import { analyzeQuery } from "../src/lib/agent/query";
import { isTestOnlyKnowledgeDocument } from "../src/server/agent/knowledgeProtect";
import {
  resetKnowledgeCacheForTests,
  retrieveKnowledge,
} from "../src/server/agent/retrieve";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(__dirname, "../.env") });

const CASES: Array<{
  id: string;
  language: "ar" | "en";
  query: string;
  expectTypes?: string[];
  expectEmpty?: boolean;
  forbidIds?: RegExp;
}> = [
  {
    id: "fleet-ar",
    language: "ar",
    query: "إيه اليخوت أو أنواع الأسطول المتاحة عندكم؟",
    expectTypes: ["fleet"],
  },
  {
    id: "fleet-en",
    language: "en",
    query: "What yachts or fleet types do you have under management?",
    expectTypes: ["fleet"],
  },
  {
    id: "team-ar",
    language: "ar",
    query: "مين الفريق أو مين المسؤول عن إدارة وتشغيل اليخوت؟",
    expectEmpty: true,
  },
  {
    id: "team-en",
    language: "en",
    query: "Who is on the team or who manages yacht operations?",
    expectEmpty: true,
  },
  {
    id: "gallery-ar",
    language: "ar",
    query: "إيه الموجود في معرض الصور؟",
    expectTypes: ["gallery"],
  },
  {
    id: "trust-ar",
    language: "ar",
    query: "هل عندكم شهادات أو اعتمادات موثقة؟",
    expectEmpty: true,
  },
  {
    id: "trust-en",
    language: "en",
    query: "Do you have verified certifications or trust badges?",
    expectEmpty: true,
  },
  {
    id: "testimonials-ar",
    language: "ar",
    query: "هل عندكم تجارب أو آراء من العملاء؟",
    expectTypes: ["testimonial"],
  },
  {
    id: "testimonials-en",
    language: "en",
    query: "Do you have client testimonials or reviews?",
    expectTypes: ["testimonial"],
  },
  {
    id: "ads-ar-1",
    language: "ar",
    query: "هل بتقدموا خدمات إعلانية للشركات؟",
    expectTypes: ["advertisement"],
  },
  {
    id: "ads-ar-2",
    language: "ar",
    query: "هل عندكم إعلانات أو شراكات؟",
    expectTypes: ["advertisement"],
  },
  {
    id: "ads-en",
    language: "en",
    query: "Do you offer advertising services?",
    expectTypes: ["advertisement"],
  },
  {
    id: "test-contamination",
    language: "ar",
    query: "إيه خدمات إدارة اليخوت عندكم؟",
    forbidIds: /kc-test|طلاء.*ذهب|gold\s*paint/i,
  },
];

async function main() {
  resetKnowledgeCacheForTests();
  console.log(`\n=== VERIFIED GAPS PROBE (retrieval only) ===\n`);

  let pass = 0;
  let fail = 0;

  for (const testCase of CASES) {
    const analysis = analyzeQuery(testCase.query);
    const result = await retrieveKnowledge(testCase.query, testCase.language);
    const types = result.diagnostic.selected.map((item) => item.type);
    const ids = result.diagnostic.selected.map((item) => item.id);
    const testLeak = result.documents.some((doc) => isTestOnlyKnowledgeDocument(doc));
    const issues: string[] = [];

    if (testCase.expectTypes?.length) {
      const ok = testCase.expectTypes.some((type) => types.includes(type as never));
      if (!ok) issues.push(`expected types ${testCase.expectTypes.join("|")}, got [${types.join(",")}]`);
    }

    if (testCase.expectEmpty && result.documents.length > 0) {
      issues.push(`expected empty evidence, got [${ids.join(",")}] types=[${types.join(",")}]`);
    }

    if (testCase.forbidIds) {
      const leaked = [...ids, ...result.documents.map((d) => `${d.id}\n${d.title}\n${d.content}`)].some(
        (value) => testCase.forbidIds!.test(value),
      );
      if (leaked || testLeak) issues.push("test knowledge contamination in retrieval");
    }

    const status = issues.length ? "FAIL" : "PASS";
    if (issues.length) fail += 1;
    else pass += 1;

    console.log(
      `[${status}] ${testCase.id} intent=${analysis.intent} pass=${result.diagnostic.retrievalPass} source=${result.diagnostic.knowledgeSource} fromFallback=${result.fromFallback} types=[${types.join(",")}]`,
    );
    if (issues.length) {
      for (const issue of issues) console.log(`  - ${issue}`);
    }
  }

  console.log(`\nSummary: ${pass} PASS / ${fail} FAIL\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
