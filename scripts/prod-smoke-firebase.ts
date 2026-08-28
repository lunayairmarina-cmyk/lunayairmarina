/**
 * Production smoke test for chatbot contact + gemini + admin path.
 * No secrets logged.
 */
const BASE = "https://www.lunayairmarina.com";
const CONTACT_FN = "71ee1b2d5bcee28397bac002390976f1aae24bf2ed21859bff6241cc56524269";
const CHAT_FN = "8c3a24bfc2c03a6dbfec2ea9285c2a0884d1f92e8df4a37e1e4d4d4fd0e5b57a";
const ADMIN_FN = "f0495a528fb95f3f8374c1a04dce150b578189c3d60af2ba68bd2bd28754516e";

const SESSION = "prod" + Date.now().toString(36).slice(-14);
const NAME = "Production Firebase Test";
const PHONE = "+966500000002";
const EMAIL = "production-firebase-test@example.com";

const headers = {
  "content-type": "application/json",
  accept: "application/x-tss-framed, application/x-ndjson, application/json",
  "x-tsr-serverfn": "true",
  referer: `${BASE}/`,
};

function payload(data) {
  const keys = Object.keys(data);
  const vals = keys.map((k) => {
    const v = data[k];
    if (Array.isArray(v)) return { t: 9, i: 1, a: [], o: 0 };
    return { t: 1, s: String(v) };
  });
  return JSON.stringify({
    t: { t: 10, i: 0, p: { k: ["data"], v: [{ t: 10, i: 1, p: { k: keys, v: vals }, o: 0 }] }, o: 0 },
    f: 127,
    m: [],
  });
}

async function call(fn, body) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/_serverFn/${fn}`, { method: "POST", headers, body });
  const text = await res.text();
  return { ms: Date.now() - t0, status: res.status, text };
}

function okTrue(text) {
  return text.includes('"ok"') && (text.includes('s":2') || text.includes('"reply"'));
}

(async () => {
  const out = { sessionId: SESSION };

  out.adminProbe = await call(ADMIN_FN, payload({}));
  out.adminConfigured = !out.adminProbe.text.includes("not configured");

  out.contact = await call(
    CONTACT_FN,
    payload({ sessionId: SESSION, language: "ar", name: NAME, phone: PHONE, email: EMAIL }),
  );
  out.contactPass = okTrue(out.contact.text) && !out.contact.text.includes("SERVICE");

  out.chat = await call(
    CHAT_FN,
    payload({ sessionId: SESSION, language: "ar", message: "مرحبا، اختبار Firebase Admin", history: [] }),
  );
  out.chatPass = okTrue(out.chat.text) && !out.chat.text.includes("VALIDATION");

  console.log(JSON.stringify(out, null, 2));
})();
