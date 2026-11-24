// AI chat assistant bubble. Talks to the chat server on the clinic VPS.
(() => {
  if (window.__alfatihChat) return;
  window.__alfatihChat = true;

  const API = "https://srv2175084.hstgr.cloud/chat";
  const STORE = "alfatih-chat-v1";
  const AVATAR = "/assets/img/kak-liza.svg";
  const GREETING =
    "Assalamualaikum! Saya Kak Liza, pembantu AI Klinik Al-Fatih. Tanya Kak Liza tentang servis, waktu operasi, panel atau temujanji ya.\n\nHi! I'm Kak Liza. Ask me anything about our clinic.";

  const css = `
  .afc-btn{position:fixed;left:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:13px 17px;background:linear-gradient(135deg,#0759e8,#0000ff);color:#fff;font:800 15px/1 Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 14px 34px rgba(0,0,255,.28);cursor:pointer}
  .afc-btn{padding:7px 18px 7px 7px}.afc-av{width:38px;height:38px;border-radius:50%;border:2px solid #fff;flex:none;background:#fff}
  .afc-head .afc-av{width:44px;height:44px}
  .afc-who{display:flex;align-items:center;gap:10px}
  .afc-row{display:flex;align-items:flex-end;gap:8px;align-self:flex-start;max-width:92%}
  .afc-row .afc-av{width:28px;height:28px;border:1px solid #dbe7f5}
  .afc-row .afc-m{max-width:none}
  .afc-panel{position:fixed;left:18px;bottom:18px;z-index:310;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100dvh - 36px));display:none;flex-direction:column;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(10,30,50,.28);overflow:hidden;font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif;color:#071d52;border:1px solid #dbe7f5}
  .afc-panel.open{display:flex}
  .afc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:linear-gradient(135deg,#04165f,#0b3b89);color:#fff;border-bottom:3px solid #00c9ff}
  .afc-head b{font-size:15px}.afc-head small{display:block;opacity:.8;font-size:12px}
  .afc-x{border:0;background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer;padding:2px 6px}
  .afc-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6faff}
  .afc-m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}
  .afc-m a{color:inherit;text-decoration:underline;word-break:break-all}
  .afc-bot{align-self:flex-start;background:#fff;border:1px solid #dbe7f5;color:#071d52}
  .afc-me{align-self:flex-end;background:#0000ff;color:#fff}
  .afc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #dbe7f5;background:#fff}
  .afc-in{flex:1;min-width:0;border:1px solid #dbe7f5;border-radius:12px;padding:10px 12px;font:16px Inter,ui-sans-serif,system-ui,sans-serif;color:#071d52;resize:none;max-height:110px}
  .afc-send{border:0;border-radius:12px;padding:0 16px;background:#0000ff;color:#fff;font-weight:800;font-family:inherit;cursor:pointer}
  .afc-send:disabled{opacity:.5}
  .afc-note{font-size:11px;color:#62728d;text-align:center;padding:0 10px 8px;background:#fff}
  @media (max-width:760px){.afc-btn{bottom:86px;left:12px}.afc-panel{left:12px;bottom:12px}}
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "afc-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Tanya Kak Liza, pembantu AI klinik");
  btn.innerHTML = '<img src="' + AVATAR + '" alt="" class="afc-av">Tanya Kak Liza';

  const panel = document.createElement("div");
  panel.className = "afc-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Tanya Kak Liza");
  panel.innerHTML = `
    <div class="afc-head"><div class="afc-who"><img src="${AVATAR}" alt="" class="afc-av"><div><b>Tanya Kak Liza</b><small>Pembantu AI Klinik Al-Fatih</small></div></div><button class="afc-x" type="button" aria-label="Tutup">×</button></div>
    <div class="afc-log" aria-live="polite"></div>
    <form class="afc-form"><textarea class="afc-in" rows="1" placeholder="Taip soalan anda…" aria-label="Mesej"></textarea><button class="afc-send" type="submit">Hantar</button></form>
    <div class="afc-note">Jawapan AI mungkin tidak tepat. Untuk kecemasan, hubungi 999.</div>`;

  document.body.append(btn, panel);
  const log = panel.querySelector(".afc-log");
  const form = panel.querySelector(".afc-form");
  const input = panel.querySelector(".afc-in");
  const sendBtn = panel.querySelector(".afc-send");

  let history = [];
  try { history = JSON.parse(sessionStorage.getItem(STORE) || "[]"); } catch { history = []; }
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-20))); } catch {} };

  const linkify = (el, text) => {
    el.textContent = "";
    const re = /(https?:\/\/[^\s)]+)/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      el.append(text.slice(last, m.index));
      const a = document.createElement("a");
      a.href = m[1]; a.textContent = m[1]; a.target = "_blank"; a.rel = "noopener";
      el.append(a);
      last = m.index + m[1].length;
    }
    el.append(text.slice(last));
  };
  const bubble = (role, text) => {
    const el = document.createElement("div");
    el.className = "afc-m " + (role === "user" ? "afc-me" : "afc-bot");
    linkify(el, text);
    if (role === "user") log.appendChild(el);
    else {
      const row = document.createElement("div");
      row.className = "afc-row";
      row.innerHTML = '<img src="' + AVATAR + '" alt="" class="afc-av">';
      row.appendChild(el);
      log.appendChild(row);
    }
    log.scrollTop = log.scrollHeight;
    return el;
  };

  const render = () => {
    log.textContent = "";
    bubble("assistant", GREETING);
    history.forEach((m) => bubble(m.role, m.content));
  };

  const open = () => { panel.classList.add("open"); btn.style.display = "none"; render(); input.focus(); };
  const close = () => { panel.classList.remove("open"); btn.style.display = ""; btn.focus(); };
  btn.addEventListener("click", open);
  panel.querySelector(".afc-x").addEventListener("click", close);
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || sendBtn.disabled) return;
    input.value = "";
    history.push({ role: "user", content: text });
    save();
    bubble("user", text);
    const out = bubble("assistant", "…");
    sendBtn.disabled = true;
    let reply = "";
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const line = buf.slice(0, i); buf = buf.slice(i + 2);
          if (!line.startsWith("data: ")) continue;
          const msg = JSON.parse(line.slice(6));
          if (msg.text) { reply += msg.text; linkify(out, reply); log.scrollTop = log.scrollHeight; }
        }
      }
    } catch {
      reply = "";
    }
    if (!reply) {
      reply = "Maaf, sambungan terputus. Sila WhatsApp klinik: Teratai (Skudai) https://wa.me/60126009137 atau Tropika (JB) https://wa.me/60175204224";
      linkify(out, reply);
    }
    history.push({ role: "assistant", content: reply });
    save();
    sendBtn.disabled = false;
    input.focus();
  });
})();
