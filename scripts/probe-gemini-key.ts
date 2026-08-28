import "dotenv/config";

const key = process.env.GEMINI_API_KEY?.trim() ?? "";
const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";

console.log("keyPrefix", key.slice(0, 6), "len", key.length, "model", model);

const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": key,
  },
  body: JSON.stringify({
    contents: [{ role: "user", parts: [{ text: "hi" }] }],
    generationConfig: { maxOutputTokens: 16 },
  }),
});

console.log("status", res.status);
console.log((await res.text()).slice(0, 1200));
