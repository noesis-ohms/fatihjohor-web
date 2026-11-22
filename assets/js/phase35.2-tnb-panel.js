(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.boot(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const PANEL_NAME = 'Tenaga Nasional Berhad (TNB)';
  const SHORT_NAME = 'TNB';
  const IMAGE = '/assets/img/panel-partners/tenaga-nasional-berhad.jpg';
  const DESCRIPTION = 'Semak eligibility dan cawangan sebelum lawatan.';
  const CATEGORY = 'MALAYSIA PANEL';
  const REFERENCES = ['Aon', 'iXchange', 'MHC', 'Raffles Health', 'Singapore Partner Network'];
  const MALAYSIA_ANCHORS = ['Jabatan Laut Malaysia', 'FOMEMA', 'IHP Malaysia', 'ASP Medical Group', 'PMCare'];

  const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const esc = (v) => String(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function adaptHref(href, referenceName) {
    if (!href) return href;
    const ref = clean(referenceName);
    const encodedRef = encodeURIComponent(ref).replace(/%20/g, '+');
    const lowerRef = ref.toLowerCase();
    let out = String(href);

    const qIndex = out.indexOf('?');
    if (qIndex >= 0) {
      const base = out.slice(0, qIndex);
      const tail = out.slice(qIndex + 1);
      const hashIndex = tail.indexOf('#');
      const query = hashIndex >= 0 ? tail.slice(0, hashIndex) : tail;
      const hash = hashIndex >= 0 ? tail.slice(hashIndex) : '';
      const params = new URLSearchParams(query);

      if (params.has('text')) {
        const text = params.get('text') || '';
        const replaced = ref
          ? text.replace(new RegExp(esc(ref), 'ig'), 'TNB / Tenaga Nasional Berhad')
          : text;
        params.set('text', replaced === text && !/tnb|tenaga nasional/i.test(text)
          ? `${text} TNB / Tenaga Nasional Berhad`.trim()
          : replaced);
      }

      for (const key of ['panel', 'provider', 'network', 'partner']) {
        if (!params.has(key)) continue;
        const value = params.get(key) || '';
        if (!ref || value.toLowerCase() === lowerRef || value.toLowerCase() === lowerRef.replace(/\s+/g, '-')) {
          params.set(key, 'tnb');
        } else {
          params.set(key, value.replace(new RegExp(esc(ref), 'ig'), 'TNB'));
        }
      }

      out = `${base}?${params.toString().replace(/\+/g, '%20')}${hash}`;
    }

    if (ref) {
      out = out
        .replace(new RegExp(esc(encodeURIComponent(ref)), 'ig'), 'tnb')
        .replace(new RegExp(esc(encodedRef), 'ig'), 'tnb')
        .replace(new RegExp(`(^|[\\/=_-])${esc(lowerRef.replace(/\s+/g, '-'))}([&#?/]|$)`, 'ig'), '$1tnb$2');
    }
    return out;
  }

  function exactTextElements(doc, label) {
    const selectors = 'h1,h2,h3,h4,h5,h6,strong,b,figcaption,span,small,p,a';
    return Array.from(doc.querySelectorAll(selectors)).filter((el) => clean(el.textContent) === label);
  }

  function closestCard(el, requireLink = true) {
    let cur = el;
    for (let i = 0; cur && i < 7; i += 1, cur = cur.parentElement) {
      if (!cur.querySelector) continue;
      const hasImg = !!cur.querySelector('img');
      const hasLink = !!cur.querySelector('a');
      if (hasImg && (!requireLink || hasLink) && /^(ARTICLE|LI|FIGURE|DIV)$/.test(cur.tagName || '')) return cur;
    }
    return null;
  }

  function findCard(doc, label, requireLink = true) {
    for (const el of exactTextElements(doc, label)) {
      const card = closestCard(el, requireLink);
      if (card) return card;
    }
    return null;
  }

  function removeLegacyTnb(doc) {
    const doomed = new Set(Array.from(doc.querySelectorAll('[data-tnb-panel],.phase35-1-tnb-card,[data-phase35-1-fallback]')));
    for (const el of exactTextElements(doc, PANEL_NAME)) {
      const card = closestCard(el, false);
      if (card && !card.querySelector('a')) doomed.add(card);
    }
    doomed.forEach((el) => el.remove());
  }

  function removeIds(node) {
    if (node.removeAttribute) node.removeAttribute('id');
    if (node.querySelectorAll) node.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  }

  function replaceReferenceText(node, referenceName) {
    const walker = node.ownerDocument.createTreeWalker(node, 4 /* SHOW_TEXT */);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const rx = new RegExp(esc(referenceName), 'ig');
    nodes.forEach((textNode) => {
      const original = textNode.nodeValue || '';
      if (rx.test(original)) textNode.nodeValue = original.replace(rx, PANEL_NAME);
      rx.lastIndex = 0;
    });
  }

  function setCategory(card) {
    const candidates = Array.from(card.querySelectorAll('small,span,p,div'));
    const target = candidates.find((el) => /^(SINGAPORE[\s-]*LINKED|MALAYSIA[\s-]*(PANEL|LINKED))$/i.test(clean(el.textContent)));
    if (target) target.textContent = CATEGORY;
  }

  function setTitle(card, referenceName) {
    const candidates = Array.from(card.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,figcaption,span'));
    const target = candidates.find((el) => {
      const t = clean(el.textContent);
      return t === referenceName || t === PANEL_NAME || t === SHORT_NAME;
    });
    if (target) target.textContent = PANEL_NAME;
  }

  function setDescription(card) {
    const paras = Array.from(card.querySelectorAll('p'));
    const target = paras.find((p) => /eligibility|cawangan sebelum lawatan/i.test(p.textContent || '')) || paras[0];
    if (target) target.textContent = DESCRIPTION;
  }

  function setImage(card) {
    const img = card.querySelector('img');
    if (!img) return;
    img.src = IMAGE;
    img.alt = `${PANEL_NAME} panel Klinik Al-Fatih Johor`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.style.objectFit = 'contain';
  }

  function setLink(card, referenceName) {
    const link = Array.from(card.querySelectorAll('a')).find((a) => /^Semak\b/i.test(clean(a.textContent))) || card.querySelector('a');
    if (!link) return false;
    link.href = adaptHref(link.getAttribute('href') || link.href || '', referenceName);
    link.textContent = 'Semak TNB →';
    return true;
  }

  function addBadge(card) {
    if (card.querySelector('[data-phase35-2-badge]')) return;
    card.style.position = card.style.position || 'relative';
    const badge = card.ownerDocument.createElement('span');
    badge.setAttribute('data-phase35-2-badge', 'true');
    badge.textContent = 'Panel Baharu';
    card.appendChild(badge);
  }

  function installStyle(doc) {
    if (doc.getElementById('phase35-2-style')) return;
    const style = doc.createElement('style');
    style.id = 'phase35-2-style';
    style.textContent = `
      [data-phase35-2-badge]{position:absolute;top:8px;right:8px;z-index:2;display:inline-flex;align-items:center;padding:.24rem .5rem;border-radius:999px;background:#eef3ff;border:1px solid #cad6ff;color:#1641bd;font:800 .58rem/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap;pointer-events:none}
      @media(max-width:640px){[data-phase35-2-badge]{top:6px;right:6px;font-size:.54rem}}
    `;
    doc.head.appendChild(style);
  }

  function normalizeCard(card, referenceName) {
    card.setAttribute('data-phase35-2-tnb-card', 'true');
    removeIds(card);
    if (referenceName) replaceReferenceText(card, referenceName);
    setCategory(card);
    setTitle(card, referenceName || PANEL_NAME);
    setDescription(card);
    setImage(card);
    setLink(card, referenceName || '');
    addBadge(card);
    return card;
  }

  function findReference(doc) {
    for (const name of REFERENCES) {
      const card = findCard(doc, name, true);
      if (card) return { name, card };
    }
    return null;
  }

  function findMalaysiaAnchor(doc) {
    for (const name of MALAYSIA_ANCHORS) {
      const card = findCard(doc, name, true) || findCard(doc, name, false);
      if (card) return card;
    }
    return null;
  }

  function registerOptions(doc, referenceName) {
    for (const select of Array.from(doc.querySelectorAll('select,datalist'))) {
      const options = Array.from(select.querySelectorAll('option'));
      if (options.some((o) => /Tenaga Nasional|\bTNB\b/i.test(`${o.textContent || ''} ${o.value || ''}`))) continue;
      const ref = options.find((o) => clean(o.textContent) === referenceName || clean(o.value).toLowerCase() === referenceName.toLowerCase());
      if (!ref) continue;
      const clone = ref.cloneNode(true);
      clone.textContent = PANEL_NAME;
      clone.value = 'tnb';
      select.appendChild(clone);
    }
  }

  function mount(win) {
    const doc = win.document;
    const path = (win.location?.pathname || '').toLowerCase();
    if (!path.includes('panel-klinik')) return false;
    installStyle(doc);
    removeLegacyTnb(doc);

    let standard = findCard(doc, PANEL_NAME, true);
    if (standard) {
      normalizeCard(standard, PANEL_NAME);
      registerOptions(doc, 'Aon');
      return true;
    }

    const ref = findReference(doc);
    if (!ref) return false;

    const clone = ref.card.cloneNode(true);
    normalizeCard(clone, ref.name);
    const anchor = findMalaysiaAnchor(doc);
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(clone, anchor.nextSibling);
    else if (ref.card.parentNode) ref.card.parentNode.appendChild(clone);
    registerOptions(doc, ref.name);
    return true;
  }

  function boot(win) {
    const run = () => mount(win);
    if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
    win.setTimeout(run, 650);
    win.setTimeout(run, 1500);
  }

  return { adaptHref, mount, boot };
});
