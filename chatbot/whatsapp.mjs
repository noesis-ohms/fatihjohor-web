// WhatsApp auto-reply for Klinik Al-Fatih Johor (WhatsApp Business Platform / Cloud API).
//   GET  /whatsapp/webhook  Meta's webhook verification (hub.challenge)
//   POST /whatsapp/webhook  incoming messages -> Kak Liza reply via the Graph API
// Needs: WA_TOKEN, WA_PHONE_NUMBER_ID, WA_VERIFY_TOKEN, WA_APP_SECRET.
import crypto from "node:crypto";
import { anthropic, systemFor, withLanguage, MODEL, cleanMessages, readBody } from "./server.mjs";

const GRAPH = process.env.WA_GRAPH_BASE || `https://graph.facebook.com/${process.env.WA_GRAPH_VERSION || "v23.0"}`;
const HISTORY_MS = 24 * 60 * 60 * 1000; // same as the website: forget a chat after 24h
const STAFF_PAUSE_MS = Number(process.env.WA_STAFF_PAUSE_HOURS || 12) * 60 * 60 * 1000;
const PER_NUMBER_LIMIT = 40; // replies per number per hour

const chats = new Map(); // phone -> { messages, startedAt, pausedUntil, sent: [timestamps] }
const seen = new Map(); // message id -> time (Meta retries webhooks)

const enabled = () =>
  Boolean(process.env.WA_TOKEN && process.env.WA_PHONE_NUMBER_ID && process.env.WA_VERIFY_TOKEN);

function chatFor(phone) {
  const now = Date.now();
  let c = chats.get(phone);
  if (!c || now - c.startedAt > HISTORY_MS) {
    c = { messages: [], startedAt: now, pausedUntil: c?.pausedUntil || 0, sent: [] };
    chats.set(phone, c);
  }
  return c;
}

function cleanup() {
  const now = Date.now();
  for (const [k, c] of chats) if (now - c.startedAt > HISTORY_MS && now > c.pausedUntil) chats.delete(k);
  for (const [k, t] of seen) if (now - t > 60 * 60 * 1000) seen.delete(k);
}
setInterval(cleanup, 10 * 60 * 1000).unref();

function validSignature(raw, header) {
  const secret = process.env.WA_APP_SECRET;
  if (!secret) return true; // allowed only while testing; set WA_APP_SECRET in production
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const got = header.slice(7);
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

async function graph(path, body) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) console.error(`wa graph ${path} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.ok;
}

const sendText = (to, text) =>
  graph(`${process.env.WA_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text.slice(0, 4000), preview_url: true },
  });

const markRead = (id) =>
  graph(`${process.env.WA_PHONE_NUMBER_ID}/messages`, {
    messaging_product: "whatsapp",
    status: "read",
    message_id: id,
    typing_indicator: { type: "text" },
  });

const NOT_TEXT =
  "Maaf, Kak Liza hanya boleh baca mesej teks buat masa ini. Boleh taip soalan anda? Staf kami juga akan semak mesej anda semasa waktu operasi.";

async function reply(phone, msg) {
  const c = chatFor(phone);
  if (Date.now() < c.pausedUntil) return; // staff is handling this chat
  c.sent = c.sent.filter((t) => Date.now() - t < 60 * 60 * 1000);
  if (c.sent.length >= PER_NUMBER_LIMIT) return;

  markRead(msg.id).catch(() => {});

  if (msg.type !== "text") {
    c.sent.push(Date.now());
    await sendText(phone, NOT_TEXT);
    return;
  }

  c.messages.push({ role: "user", content: msg.text.body });
  const messages = cleanMessages(c.messages);
  if (!messages) return;

  let text = "";
  try {
    const final = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 1500,
      output_config: { effort: "medium" },
      system: systemFor("whatsapp"),
      messages: withLanguage(messages),
    });
    text = final.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const u = final.usage;
    console.log(`wa ok in=${u.input_tokens} cache_read=${u.cache_read_input_tokens} cache_write=${u.cache_creation_input_tokens} out=${u.output_tokens} stop=${final.stop_reason}`);
    if (final.stop_reason === "refusal") text = "";
  } catch (err) {
    console.error("wa claude error:", err?.status || "", err?.message || err);
  }

  if (!text) {
    // No AI answer: stay quiet and let staff reply, rather than send something wrong.
    c.pausedUntil = Date.now() + STAFF_PAUSE_MS;
    return;
  }

  if (text.includes("[[STAFF]]")) {
    text = text.replace(/\s*\[\[STAFF\]\]\s*/g, "").trim();
    c.pausedUntil = Date.now() + STAFF_PAUSE_MS; // bot stays quiet; staff takes over
    console.log("wa handed to staff");
  }
  if (!/salam/i.test(msg.text.body)) text = text.replace(/^\s*Wa'?alaikum(us)?salam[^A-Za-z]*/i, "");

  c.messages.push({ role: "assistant", content: text });
  c.sent.push(Date.now());
  await sendText(phone, text);
}

export async function handleWhatsApp(req, res, url) {
  if (req.method === "GET") {
    const ok =
      url.searchParams.get("hub.mode") === "subscribe" &&
      process.env.WA_VERIFY_TOKEN &&
      url.searchParams.get("hub.verify_token") === process.env.WA_VERIFY_TOKEN;
    res.writeHead(ok ? 200 : 403, { "Content-Type": "text/plain" });
    return res.end(ok ? url.searchParams.get("hub.challenge") || "" : "forbidden");
  }
  if (req.method !== "POST") { res.writeHead(405); return res.end(); }

  let raw;
  try { raw = await readBody(req, 512 * 1024); } catch { res.writeHead(413); return res.end(); }
  if (!validSignature(raw, req.headers["x-hub-signature-256"])) { res.writeHead(401); return res.end(); }
  // Answer Meta at once; reply in the background.
  res.writeHead(200);
  res.end();
  if (!enabled()) return;

  let body;
  try { body = JSON.parse(raw); } catch { return; }
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      // Staff replied from the WhatsApp Business app (coexistence): let them handle this chat.
      if (change.field === "smb_message_echoes") {
        for (const m of v.message_echoes || []) {
          if (m.to) chatFor(m.to).pausedUntil = Date.now() + STAFF_PAUSE_MS;
        }
        continue;
      }
      if (v.metadata?.phone_number_id && v.metadata.phone_number_id !== process.env.WA_PHONE_NUMBER_ID) continue;
      for (const msg of v.messages || []) {
        if (seen.has(msg.id)) continue;
        seen.set(msg.id, Date.now());
        reply(msg.from, msg).catch((e) => console.error("wa reply error:", e?.message || e));
      }
    }
  }
}

export const whatsappEnabled = enabled;
