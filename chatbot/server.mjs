// Website chat assistant for Klinik Al-Fatih Johor.
// POST /chat  { messages: [{role, content}] }  -> streams the reply as Server-Sent Events.
import http from "node:http";
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { handleWhatsApp, whatsappEnabled } from "./whatsapp.mjs";

const PORT = Number(process.env.PORT || 8080);
const MODEL = process.env.CHAT_MODEL || "claude-haiku-5-5";
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ||
  "https://klinikalfatihjohor.com,https://www.klinikalfatihjohor.com")
  .split(",").map((s) => s.trim()).filter(Boolean);

const MAX_TURNS = 12;            // messages kept from the conversation
const MAX_CHARS = 1500;          // per visitor message
const RATE_LIMIT = 30;           // messages per IP ...
const RATE_WINDOW_MS = 60 * 60 * 1000; // ... per hour

const knowledge = fs.readFileSync(new URL("./knowledge.txt", import.meta.url), "utf8");

const INSTRUCTIONS = `You are "Kak Liza", the friendly online AI assistant for Klinik Al-Fatih Johor, a GP and panel clinic with two branches in Johor:
- Klinik Teratai Al-Fatih, Taman Teratai, Skudai. Phone/WhatsApp 012-600 9137 (https://wa.me/60126009137)
- Klinik Tropika Al-Fatih, Setia Tropika, Johor Bahru. Phone/WhatsApp 017-520 4224 (https://wa.me/60175204224)

You chat with patients and visitors (on the clinic website or on WhatsApp). Your job: answer questions about the clinic's services, branches, opening hours, doctors, panels/insurance, prices and programmes, and help visitors book.

Rules:
- Introduce yourself as Kak Liza only in your first reply of a conversation, not in later replies. Answer "Waalaikumussalam" only if the visitor said "Assalamualaikum"; never in reply to a plain question. If asked, say plainly that you are an AI assistant, not a staff member. Speak like a kind, helpful clinic "kakak".
- Always reply in the language the visitor writes in. You speak: Bahasa Melayu, English, Mandarin Chinese (简体中文), Tamil (தமிழ்), Bengali/Bangla (বাংলা), Nepali (नेपाली), Burmese/Myanmar (မြန်မာ) and Bahasa Indonesia. Match their script too (e.g. Romanised Malay/Nepali stays Romanised). If they mix Malay and English, mix the same way. An English question gets an English answer even though the clinic information is in Malay.
- When replying in a language other than Malay or English: use simple, short sentences; keep clinic names, addresses, prices (RM), phone numbers and links exactly as written; and add one short line in English if a detail is important (e.g. emergency 999, a price) so it cannot be misread.
- Be warm, short and clear: 1-4 short sentences or a few bullets. They read on a phone screen.
- Use ONLY the clinic information below. If something is not there (a price, an hour, whether a panel covers something), say you are not sure and give the branch WhatsApp link so staff can confirm. Never invent facts.
- To book: send them to https://klinikalfatihjohor.com/booking.html, or WhatsApp the branch they prefer. Ask which branch is nearer if it matters.
- You are not a doctor. Do not diagnose, prescribe or give dosages. For symptoms, give general guidance at most and encourage them to see a doctor at the clinic.
- Emergencies (chest pain, difficulty breathing, severe bleeding, stroke signs, unconscious, suicidal thoughts): tell them to call 999 or go to the nearest emergency department now. For suicidal thoughts also mention Talian HEAL 15555.
- Do not ask for IC numbers, full medical history or other sensitive data in chat.
- Always link to the most specific page. When you mention a service, branch, doctor or panel, include the full URL of its own page, taken from the "=== PAGE:" lines (for example https://klinikalfatihjohor.com/sunat.html for circumcision, https://klinikalfatihjohor.com/panel/aia.html for AIA). Never give only the home page when a specific page exists. At most 3 links per reply.
- Put each link on its own line, as a bare URL with nothing around it (no brackets, no markdown, no full stop after it).
- Use plain text. No markdown headings or tables.
- The channel rules after the clinic information tell you where this chat is happening.

Clinic information, taken from the clinic website:
`;

export const CHANNEL_RULES = {
  web: `Channel: the chat box on the clinic website. Links show as buttons. No bold.`,
  whatsapp: `Channel: WhatsApp, the visitor is messaging the clinic number directly. Do not tell them to "WhatsApp the clinic" (they already are); the WhatsApp links above are only for the other branch.
You may use *bold* sparingly. Keep it shorter than on the website.
If the visitor asks for a human or staff, wants to confirm or change a booking or appointment slot, has a complaint, sends a medical result, or you cannot help: tell them a staff member will reply here during opening hours, and end your reply with the exact marker [[STAFF]] on its own line.`,
};

let client = null; // created on first chat, once ANTHROPIC_API_KEY is set
export function anthropic() {
  // Reads ANTHROPIC_API_KEY. A key not scoped to a workspace also needs ANTHROPIC_WORKSPACE_ID.
  client ??= new Anthropic(
    process.env.ANTHROPIC_WORKSPACE_ID
      ? { defaultHeaders: { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID } }
      : {},
  );
  return client;
}
// Shared, cached clinic prompt first; the small channel rules after the cache breakpoint.
export function systemFor(channel) {
  return [
    { type: "text", text: INSTRUCTIONS + knowledge, cache_control: { type: "ephemeral" } },
    { type: "text", text: CHANNEL_RULES[channel] },
  ];
}
export { MODEL, cleanMessages, readBody };

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 10000) hits.clear();
  return list.length > RATE_LIMIT;
}

function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS).trim() }))
    .filter((m) => m.content)
    .slice(-MAX_TURNS);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  // Merge consecutive same-role messages so roles alternate.
  const merged = [];
  for (const m of msgs) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += "\n" + m.content;
    else merged.push({ ...m });
  }
  return merged;
}

function readBody(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) { reject(new Error("too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

const FALLBACK_TEXT =
  "Maaf, saya tidak dapat menjawab sekarang. Sila WhatsApp klinik terus: Teratai (Skudai) https://wa.me/60126009137 atau Tropika (JB) https://wa.me/60175204224";

async function handleChat(req, res) {
  const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (rateLimited(ip)) {
    res.writeHead(429, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Too many messages. Please WhatsApp the clinic." }));
  }
  let messages;
  try {
    messages = cleanMessages(JSON.parse(await readBody(req)).messages);
  } catch {
    messages = null;
  }
  if (!messages) {
    res.writeHead(400, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "Bad request" }));
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  let sentText = false;
  try {
    const stream = anthropic().messages.stream({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: "low" },
      system: systemFor("web"),
      messages,
    });
    req.on("close", () => stream.abort());
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        sentText = true;
        send({ text: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal" && !sentText) send({ text: FALLBACK_TEXT });
    const u = final.usage;
    console.log(`chat ok in=${u.input_tokens} cache_read=${u.cache_read_input_tokens} cache_write=${u.cache_creation_input_tokens} out=${u.output_tokens} stop=${final.stop_reason}`);
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) return;
    if (err instanceof Anthropic.AuthenticationError) console.error("chat error: API key missing or invalid");
    else if (err instanceof Anthropic.RateLimitError) console.error("chat error: Anthropic rate limit");
    else if (err instanceof Anthropic.AnthropicError && !(err instanceof Anthropic.APIError)) console.error("chat error:", err.message);
    else if (err instanceof Anthropic.APIError) console.error(`chat error: API ${err.status} ${err.message}`);
    else console.error("chat error:", err?.message || err);
    if (!sentText) send({ text: FALLBACK_TEXT });
  }
  send({ done: true });
  res.end();
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  const url = new URL(req.url, "http://x");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, model: MODEL, key: Boolean(process.env.ANTHROPIC_API_KEY), whatsapp: whatsappEnabled() }));
  }
  if (url.pathname === "/whatsapp/webhook") return handleWhatsApp(req, res, url);
  if (req.method === "POST" && url.pathname === "/chat") {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) { res.writeHead(403); return res.end(); }
    return handleChat(req, res);
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, async () => {
  console.log(`chat server on :${PORT}, model ${MODEL}, knowledge ${knowledge.length} chars`);
  if (!process.env.ANTHROPIC_API_KEY) return;
  try {
    const { input_tokens } = await anthropic().messages.countTokens({
      model: MODEL,
      system: INSTRUCTIONS + knowledge,
      messages: [{ role: "user", content: "hi" }],
    });
    console.log(`prompt size: ${input_tokens} tokens`);
  } catch (err) {
    console.error("token count failed:", err?.message || err);
  }
});
