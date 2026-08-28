/**
 * Production sequential chat probe — no secrets logged.
 * Usage: npx tsx scripts/probe-chat-sequential.ts [baseUrl] [turnCount]
 */
const BASE = process.argv[2] ?? process.env.PROD_BASE_URL ?? "https://www.lunayairmarina.com";
const TURNS = Number.parseInt(process.argv[3] ?? "20", 10);
const CHAT_FN = "8c3a24bfc2c03a6dbfec2ea9285c2a0884d1f92e8df4a37e1e4d4d4fd0e5b57a";
const CONTACT_FN = "71ee1b2d5bcee28397bac002390976f1aae24bf2ed21859bff6241cc56524269";

const TEST_MESSAGES = [
  "اهلا",
  "حجز يخت",
  "تفاصيل",
  "إدارة يخوت",
  "هل توفرون تدريب",
  "ممكن ترسلي الرقم والعنوان",
  "كيف حالك",
  "What services do you offer?",
  "واتساب",
];

type HistoryItem = { role: "user" | "assistant"; content: string };

function tsrString(s: string) {
  return { t: 1, s };
}

function tsrHistory(history: HistoryItem[]) {
  const items = history.map((item) => ({
    t: 10,
    i: 1,
    p: { k: ["role", "content"], v: [tsrString(item.role), tsrString(item.content)] },
    o: 0,
  }));
  return { t: 9, i: 1, a: items, o: 0 };
}

function buildPayload(data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const vals = keys.map((k) => {
    const v = data[k];
    if (Array.isArray(v)) return tsrHistory(v as HistoryItem[]);
    return tsrString(String(v));
  });
  return JSON.stringify({
    t: {
      t: 10,
      i: 0,
      p: { k: ["data"], v: [{ t: 10, i: 1, p: { k: keys, v: vals }, o: 0 }] },
      o: 0,
    },
    f: 127,
    m: [],
  });
}

const headers = {
  "content-type": "application/json",
  accept: "application/json",
  "x-tsr-serverfn": "true",
  referer: `${BASE}/`,
};

function parseCode(text: string): string {
  for (const c of [
    "VALIDATION",
    "RATE_LIMIT",
    "GEMINI",
    "FIRESTORE",
    "CONTEXT",
    "TIMEOUT",
    "CONFIG",
    "INTERNAL",
  ]) {
    if (text.includes(`"${c}"`) && text.includes('"code"')) return c;
  }
  return text.includes('"reply"') || text.includes('s":2') ? "OK" : "UNKNOWN";
}

async function contact(sessionId: string) {
  await fetch(`${BASE}/_serverFn/${CONTACT_FN}`, {
    method: "POST",
    headers,
    body: buildPayload({
      sessionId,
      language: "ar",
      name: "Probe User",
      phone: "+966500005555",
    }),
  });
}

async function chat(
  sessionId: string,
  message: string,
  legacyHistory: HistoryItem[] = [],
) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/_serverFn/${CHAT_FN}`, {
    method: "POST",
    headers,
    body: buildPayload({ sessionId, language: "ar", message, history: legacyHistory }),
  });
  const text = await res.text();
  return {
    status: res.status,
    ms: Date.now() - t0,
    code: parseCode(text),
    hasReply: text.includes('"reply"'),
  };
}

async function clientPattern(): Promise<string> {
  try {
    const html = await (await fetch(BASE)).text();
    const site = html.match(/SiteLayout-[A-Za-z0-9_-]+\.js/)?.[0];
    if (!site) return "no-sitelayout";
    const siteJs = await (await fetch(`${BASE}/assets/${site}`)).text();
    const chunk = siteJs.match(/ChatbotWidget-[A-Za-z0-9_-]+\.js/)?.[0];
    if (!chunk) return "no-chatbot-chunk";
    const widget = await (await fetch(`${BASE}/assets/${chunk}`)).text();
    if (widget.includes("history:[]")) return "history:[]";
    if (/history:[a-z]/.test(widget)) return "legacy-history-var";
    if (!widget.includes("history")) return "no-history-field";
    return "unknown";
  } catch {
    return "fetch-failed";
  }
}

async function main() {
  const sessionId = `probe${Date.now().toString(36).slice(-12)}`;
  await contact(sessionId);

  const results: Array<Record<string, unknown>> = [];
  for (let turn = 1; turn <= TURNS; turn += 1) {
    const message = TEST_MESSAGES[(turn - 1) % TEST_MESSAGES.length]!;
    const r = await chat(sessionId, message, []);
    results.push({ turn, message, sessionId, ...r });
    console.log(JSON.stringify({ turn, message, code: r.code, ms: r.ms, status: r.status }));
    if (r.code !== "OK") break;
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  const legacyHistory = Array.from({ length: 12 }, (_, i) => ({
    role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
    content: `legacy item ${i}`,
  }));
  const legacy = await chat(`leg${Date.now().toString(36).slice(-8)}`, "test legacy", legacyHistory);

  console.log(
    JSON.stringify(
      {
        base: BASE,
        sessionId,
        turnsRequested: TURNS,
        turnsOk: results.filter((r) => r.code === "OK").length,
        firstFail: results.find((r) => r.code !== "OK") ?? null,
        legacyHistory12: legacy,
        clientPattern: await clientPattern(),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("PROBE_FATAL", error instanceof Error ? error.message : error);
  process.exit(1);
});
