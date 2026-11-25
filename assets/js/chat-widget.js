// AI chat assistant bubble. Talks to the chat server on the clinic VPS.
(() => {
  if (window.__alfatihChat) return;
  window.__alfatihChat = true;

  const API = "https://srv2175084.hstgr.cloud/chat";
  const STORE = "alfatih-chat-v1";
  const AVATAR = "/assets/img/kak-liza.webp";
  const GREETING =
    "Assalamualaikum! Saya Kak Liza, pembantu AI Klinik Al-Fatih. Tanya Kak Liza tentang servis, waktu operasi, panel atau temujanji ya.\n\nHi! Ask me in your language:\nEnglish · 中文 · தமிழ் · বাংলা · नेपाली · မြန်မာ · Indonesia";

  const css = `
  .afc-btn{position:fixed;right:18px;bottom:18px;z-index:70;display:flex;align-items:center;gap:8px;border:0;border-radius:999px;padding:13px 17px;background:linear-gradient(135deg,#0759e8,#0000ff);color:#fff;font:800 15px/1 Inter,ui-sans-serif,system-ui,sans-serif;box-shadow:0 14px 34px rgba(0,0,255,.28);cursor:pointer}
  .afc-btn{padding:7px 18px 7px 7px}.afc-av{width:38px;height:38px;border-radius:50%;border:2px solid #fff;flex:none;background:#fff}
  .afc-head .afc-av{width:44px;height:44px}
  .afc-who{display:flex;align-items:center;gap:10px}
  .afc-row{display:flex;align-items:flex-end;gap:8px;align-self:flex-start;max-width:92%}
  .afc-row .afc-av{width:28px;height:28px;border:1px solid #dbe7f5}
  .afc-row .afc-m{max-width:none}
  .afc-panel{position:fixed;right:18px;bottom:18px;z-index:310;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100dvh - 36px));display:none;flex-direction:column;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(10,30,50,.28);overflow:hidden;font:15px/1.5 Inter,ui-sans-serif,system-ui,sans-serif;color:#071d52;border:1px solid #dbe7f5}
  .afc-panel.open{display:flex}
  .afc-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:linear-gradient(135deg,#04165f,#0b3b89);color:#fff;border-bottom:3px solid #00c9ff}
  .afc-head b{font-size:15px}.afc-head small{display:block;opacity:.8;font-size:12px}
  .afc-x{border:0;background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer;padding:2px 6px}
  .afc-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:#f6faff}
  .afc-m{max-width:85%;padding:9px 12px;border-radius:14px;white-space:pre-wrap;word-wrap:break-word}
  .afc-m a{color:inherit;text-decoration:underline}
  .afc-bot .afc-link{display:inline-block;margin:3px 0;padding:4px 10px;border-radius:999px;background:#eaf2ff;color:#0000ff;font-weight:700;font-size:14px;text-decoration:none;white-space:nowrap}
  .afc-bot .afc-link:hover{background:#dbe7ff}
  .afc-bot{align-self:flex-start;background:#fff;border:1px solid #dbe7f5;color:#071d52}
  .afc-me{align-self:flex-end;background:#0000ff;color:#fff}
  .afc-form{display:flex;gap:8px;padding:10px;border-top:1px solid #dbe7f5;background:#fff}
  .afc-in{flex:1;min-width:0;border:1px solid #dbe7f5;border-radius:12px;padding:10px 12px;font:16px Inter,ui-sans-serif,system-ui,sans-serif;color:#071d52;resize:none;max-height:110px}
  .afc-send{border:0;border-radius:12px;padding:0 16px;background:#0000ff;color:#fff;font-weight:800;font-family:inherit;cursor:pointer}
  .afc-send:disabled{opacity:.5}
  .afc-note{font-size:11px;color:#62728d;text-align:center;padding:0 10px 8px;background:#fff}
  .afc-chips{display:flex;gap:8px;overflow-x:auto;padding:8px 12px 2px;background:#fff;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .afc-chips::-webkit-scrollbar{display:none}
  .afc-chip{flex:none;border:1px solid #c9dafc;background:#f3f7ff;color:#0b3b89;border-radius:999px;padding:8px 13px;font:700 13px Inter,ui-sans-serif,system-ui,sans-serif;cursor:pointer;white-space:nowrap}
  .afc-send{display:flex;align-items:center;justify-content:center;min-width:46px}
  .afc-send svg{width:20px;height:20px;fill:currentColor}
  .afc-typing{display:inline-flex;gap:4px;align-items:center;height:18px}
  .afc-typing i{width:6px;height:6px;border-radius:50%;background:#8aa4c8;animation:afc-b 1s infinite}
  .afc-typing i:nth-child(2){animation-delay:.15s}.afc-typing i:nth-child(3){animation-delay:.3s}
  @keyframes afc-b{0%,60%,100%{opacity:.3;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}
  html.afc-lock,html.afc-lock body{overflow:hidden!important}
  .afc-backdrop{display:none}
  @media (max-width:760px){
    /* White sheet behind the chat so the page never shows through around the keyboard */
    html.afc-lock .afc-backdrop{display:block;position:fixed;left:0;right:0;top:-50vh;height:200vh;background:#f6faff;z-index:305}
    .afc-panel.afc-kb .afc-note{display:none}
    .afc-panel.afc-kb .afc-head{padding-top:8px;padding-bottom:8px}
    .afc-panel.afc-kb .afc-head .afc-av{width:36px;height:36px}
  }
  @media (max-width:760px){
    /* Launcher: compact round avatar above the bottom bar */
    .afc-btn{right:12px;bottom:calc(84px + env(safe-area-inset-bottom));padding:4px;border-radius:50%;font-size:0;gap:0;box-shadow:0 10px 26px rgba(0,0,255,.35)}
    .afc-btn .afc-av{width:56px;height:56px}
    .afc-btn::after{content:"Tanya";position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);background:#0000ff;color:#fff;font:800 11px/1 Inter,ui-sans-serif,system-ui,sans-serif;padding:4px 8px;border-radius:999px;border:2px solid #fff}
    /* Panel: full screen, sized to the visible area (keyboard-aware via JS) */
    .afc-panel{inset:0 auto auto 0;right:auto;bottom:auto;width:100vw;height:var(--afc-vh,100dvh);max-height:none;border-radius:0;border:0;box-shadow:none}
    .afc-head{padding:calc(10px + env(safe-area-inset-top)) 8px 10px 14px}
    .afc-x{width:44px;height:44px;font-size:30px}
    .afc-log{padding:12px 10px}
    .afc-m{font-size:15.5px}
    .afc-row{max-width:94%}
    .afc-form{padding:8px 10px}
    .afc-note{font-size:10.5px;padding:0 12px calc(6px + env(safe-area-inset-bottom))}
  }
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
    <div class="afc-chips"></div>
    <form class="afc-form"><textarea class="afc-in" rows="1" placeholder="Taip soalan anda…" aria-label="Mesej"></textarea><button class="afc-send" type="submit" aria-label="Hantar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.2 15 12 3.4 13.8z"/></svg></button></form>
    <div class="afc-note">Kak Liza hanya pembantu maya klinik. Untuk rawatan, anda masih perlu berjumpa dengan profesional.</div>`;

  const backdrop = document.createElement("div");
  backdrop.className = "afc-backdrop";
  document.body.append(btn, backdrop, panel);
  const log = panel.querySelector(".afc-log");
  const form = panel.querySelector(".afc-form");
  const input = panel.querySelector(".afc-in");
  const sendBtn = panel.querySelector(".afc-send");

  // Chat history is kept on this device for 24 hours from the first message, then wiped.
  const TTL_MS = 24 * 60 * 60 * 1000;
  let history = [];
  let startedAt = Date.now();
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "null");
    if (saved && Array.isArray(saved.messages) && Date.now() - saved.startedAt < TTL_MS) {
      history = saved.messages;
      startedAt = saved.startedAt;
    } else {
      localStorage.removeItem(STORE);
    }
    sessionStorage.removeItem(STORE); // old format
  } catch { history = []; }
  const save = () => {
    try {
      if (!history.length) startedAt = Date.now();
      localStorage.setItem(STORE, JSON.stringify({ startedAt, messages: history.slice(-20) }));
    } catch {}
  };

  // Show links as short labels instead of long raw URLs.
  const WA = { "60126009137": "WhatsApp Teratai (Skudai)", "60175204224": "WhatsApp Tropika (JB)" };
  const PAGE_NAMES = { "": "Laman utama", "booking": "Tempah temujanji", "cawangan-klinik": "Lokasi cawangan", "panel-klinik": "Senarai panel", "doktor": "Doktor kami", "servis": "Semua servis", "klinik-skudai-taman-teratai": "Cawangan Teratai (Skudai)", "klinik-setia-tropika-kempas": "Cawangan Tropika (JB)", "medical-checkup": "Medical checkup", "std-clinic": "Klinik STD" };
  const linkLabel = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname === "wa.me") return WA[u.pathname.slice(1)] || "WhatsApp";
      if (u.hostname.endsWith("klinikalfatihjohor.com")) {
        const slug = u.pathname.replace(/^\/|\.html$|\/$/g, "");
        const last = slug.split("/").pop();
        const name = PAGE_NAMES[slug] ?? last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        return "Lihat: " + name;
      }
      return u.hostname;
    } catch { return url; }
  };
  const linkify = (el, text) => {
    el.textContent = "";
    const re = /https?:\/\/[^\s)\]>"']+/g;
    let last = 0, m;
    while ((m = re.exec(text))) {
      const url = m[0].replace(/[.,;:!?]+$/, ""); // drop sentence punctuation after a link
      el.append(text.slice(last, m.index));
      const a = document.createElement("a");
      a.href = url;
      a.textContent = linkLabel(url) + " ›";
      a.className = "afc-link";
      if (!url.includes("klinikalfatihjohor.com")) { a.target = "_blank"; a.rel = "noopener"; }
      else a.addEventListener("click", () => { try { sessionStorage.setItem(STORE + "-open", "1"); } catch {} });
      el.append(a);
      last = m.index + m[0].length; // also swallow punctuation right after the link
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

  const chips = panel.querySelector(".afc-chips");
  const QUICK = ["Waktu operasi", "Tempah temujanji", "Semak panel saya", "Harga medical checkup", "Lokasi klinik"];
  const renderChips = () => {
    chips.textContent = "";
    if (history.length) { chips.style.display = "none"; return; } // only before the first question
    chips.style.display = "";
    QUICK.forEach((q) => {
      const c = document.createElement("button");
      c.type = "button"; c.className = "afc-chip"; c.textContent = q;
      c.addEventListener("click", () => { input.value = q; form.requestSubmit(); });
      chips.appendChild(c);
    });
  };
  const render = () => {
    log.textContent = "";
    bubble("assistant", GREETING);
    history.forEach((m) => bubble(m.role, m.content));
    renderChips();
  };

  // Phone: fit the panel to the visible area so the keyboard never covers the input.
  const mobile = () => window.matchMedia("(max-width:760px)").matches;
  const vv = window.visualViewport;
  let fullH = 0;
  const fit = () => {
    if (!panel.classList.contains("open") || !mobile() || !vv) return;
    panel.style.setProperty("--afc-vh", Math.round(vv.height) + "px");
    panel.style.top = Math.round(vv.offsetTop) + "px";
    // Keyboard is up when the visible area is much shorter than the screen.
    fullH = Math.max(fullH, vv.height, window.innerHeight);
    panel.classList.toggle("afc-kb", vv.height < fullH * 0.75);
    log.scrollTop = log.scrollHeight;
  };
  // iOS animates the keyboard and does not always fire a final resize: re-check for a moment.
  const settle = () => {
    const end = Date.now() + 1000;
    const tick = () => { fit(); if (Date.now() < end) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  };
  if (vv) { vv.addEventListener("resize", fit); vv.addEventListener("scroll", fit); }
  input.addEventListener("focus", settle);
  input.addEventListener("blur", settle);

  const grow = () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 110) + "px"; };
  input.addEventListener("input", grow);

  let savedY = 0;
  const lockScroll = () => {
    if (document.documentElement.classList.contains("afc-lock")) return;
    savedY = window.scrollY;
    document.documentElement.classList.add("afc-lock");
    Object.assign(document.body.style, { position: "fixed", top: -savedY + "px", left: "0", right: "0", width: "100%" });
  };
  const unlockScroll = () => {
    if (!document.documentElement.classList.contains("afc-lock")) return;
    document.documentElement.classList.remove("afc-lock");
    Object.assign(document.body.style, { position: "", top: "", left: "", right: "", width: "" });
    window.scrollTo(0, savedY);
  };

  let pushed = false;
  const show = () => {
    panel.classList.add("open"); btn.style.display = "none"; render();
    if (mobile()) {
      lockScroll();
      // Phone back button closes the chat instead of leaving the page.
      try { window.history.pushState({ afc: 1 }, ""); pushed = true; } catch {}
    }
    fit();
    log.scrollTop = log.scrollHeight;
  };
  const open = () => { show(); if (!mobile()) input.focus(); };
  const close = (fromBack) => {
    panel.classList.remove("open"); btn.style.display = "";
    unlockScroll();
    panel.style.removeProperty("--afc-vh"); panel.style.top = ""; panel.classList.remove("afc-kb");
    if (pushed && fromBack !== true) { pushed = false; try { window.history.back(); } catch {} }
    pushed = false;
  };
  window.addEventListener("popstate", () => { if (panel.classList.contains("open")) { pushed = false; close(true); } });
  btn.addEventListener("click", open);
  // Visitor tapped a clinic page link in the chat: keep the chat open on the new page.
  try {
    if (sessionStorage.getItem(STORE + "-open")) {
      sessionStorage.removeItem(STORE + "-open");
      show();
    }
  } catch {}
  panel.querySelector(".afc-x").addEventListener("click", () => close());
  panel.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey && !mobile()) { e.preventDefault(); form.requestSubmit(); }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || sendBtn.disabled) return;
    input.value = ""; grow();
    history.push({ role: "user", content: text });
    save();
    bubble("user", text);
    renderChips();
    const out = bubble("assistant", "");
    out.innerHTML = '<span class="afc-typing" aria-label="Kak Liza sedang menaip"><i></i><i></i><i></i></span>';
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
          if (msg.text) {
            reply += msg.text;
            // Only answer a salam that was actually given.
            if (!/salam/i.test(text)) reply = reply.replace(/^\s*Wa'?alaikum(us)?salam[^A-Za-z]*/i, "");
            linkify(out, reply); log.scrollTop = log.scrollHeight;
          }
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
    if (!mobile()) input.focus();
  });
})();
