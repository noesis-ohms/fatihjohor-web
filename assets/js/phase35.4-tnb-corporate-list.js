(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) api.boot(root);
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const TNB_NAME = 'Tenaga Nasional Berhad (TNB)';
  const TNB_IMAGE = '/assets/img/panel-partners/tenaga-nasional-berhad.jpg';
  const TNB_HREF = '/panel/tnb.html';
  const REFERENCE_NAMES = [
    'Jabatan Laut Malaysia',
    'Pharmaniaga',
    'YADIM',
    'Universiti Teknologi Malaysia',
    'PIJ Holdings',
    'FWG',
    'Majlis Bandaraya Iskandar Puteri',
    'Majlis Bandaraya Johor Bahru',
    'Majlis Perbandaran Pontian'
  ];

  const clean = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const isCorporateHeading = (v) => /\bkorporat\b\s*\/\s*\borganisasi\b/i.test(clean(v)) || /\bcorporate\b\s*\/\s*\borgani[sz]ation\b/i.test(clean(v));
  const isTnbName = (v) => /tenaga\s+nasional|\btnb\b/i.test(clean(v));
  const panelHref = () => TNB_HREF;

  function exactTextElements(root, label) {
    return Array.from(root.querySelectorAll('span,figcaption,h2,h3,h4,h5,strong,b,p,a')).filter((el) => clean(el.textContent) === label);
  }

  function closestLogoCard(el) {
    let cur = el;
    for (let i = 0; cur && i < 7; i += 1, cur = cur.parentElement) {
      if (!cur.querySelector) continue;
      if (!cur.querySelector('img')) continue;
      const className = typeof cur.className === 'string' ? cur.className : '';
      const isLikelyCard = /card|logo|partner|panel|item/i.test(className) || cur.tagName === 'A' || cur.tagName === 'ARTICLE' || cur.tagName === 'FIGURE' || cur.tagName === 'LI';
      if (isLikelyCard) return cur;
    }
    return null;
  }

  function findCardByName(root, name) {
    for (const el of exactTextElements(root, name)) {
      const card = closestLogoCard(el);
      if (card) return card;
    }
    return null;
  }

  function findCorporateRoot(doc) {
    const headings = Array.from(doc.querySelectorAll('h2,h3,h4'));
    const heading = headings.find((el) => isCorporateHeading(el.textContent));
    if (heading) {
      let cur = heading.parentElement;
      for (let i = 0; cur && i < 5; i += 1, cur = cur.parentElement) {
        const refs = REFERENCE_NAMES.filter((name) => !!findCardByName(cur, name));
        if (refs.length >= 2) return cur;
      }
    }

    // Fallback for builds where the heading text is generated differently.
    const known = REFERENCE_NAMES.map((name) => findCardByName(doc, name)).filter(Boolean);
    if (known.length < 2) return null;
    let parent = known[0].parentElement;
    while (parent && !known.every((card) => parent.contains(card))) parent = parent.parentElement;
    return parent;
  }

  function removeIds(node) {
    if (node.removeAttribute) node.removeAttribute('id');
    if (node.querySelectorAll) node.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  }

  function setHref(card) {
    if (card.tagName === 'A') card.setAttribute('href', TNB_HREF);
    card.querySelectorAll('a[href]').forEach((a) => a.setAttribute('href', TNB_HREF));
  }

  function setImage(card) {
    const img = card.querySelector('img');
    if (!img) return false;
    img.setAttribute('src', TNB_IMAGE);
    img.setAttribute('alt', `${TNB_NAME} panel Klinik Al-Fatih Johor`);
    img.setAttribute('loading', 'lazy');
    img.style.objectFit = 'contain';
    return true;
  }

  function setName(card, oldName) {
    const exact = Array.from(card.querySelectorAll('span,figcaption,h3,h4,h5,strong,b,p')).find((el) => clean(el.textContent) === oldName);
    if (exact) {
      exact.textContent = TNB_NAME;
      return true;
    }
    const candidates = Array.from(card.querySelectorAll('span,figcaption,h3,h4,h5,strong,b,p'));
    const target = candidates[candidates.length - 1];
    if (target) {
      target.textContent = TNB_NAME;
      return true;
    }
    return false;
  }

  function normalizeExisting(card) {
    card.setAttribute('data-phase35-4-tnb-corporate', 'true');
    removeIds(card);
    setHref(card);
    setImage(card);
    const names = Array.from(card.querySelectorAll('span,figcaption,h3,h4,h5,strong,b,p'));
    const label = names.find((el) => isTnbName(el.textContent));
    if (label) label.textContent = TNB_NAME;
    return card;
  }

  function mount(win) {
    const doc = win.document;
    const path = String(win.location?.pathname || '').toLowerCase();
    if (!path.includes('panel-klinik')) return false;

    const root = findCorporateRoot(doc);
    if (!root) return false;

    const existing = Array.from(root.querySelectorAll('[data-phase35-4-tnb-corporate],a,article,figure,li,div'))
      .find((el) => el.querySelector && el.querySelector('img') && isTnbName(el.textContent));
    if (existing) {
      normalizeExisting(existing);
      return true;
    }

    let reference = null;
    let referenceName = '';
    for (const name of REFERENCE_NAMES) {
      const card = findCardByName(root, name);
      if (card) {
        reference = card;
        referenceName = name;
        break;
      }
    }
    if (!reference || !reference.parentElement) return false;

    const clone = reference.cloneNode(true);
    clone.setAttribute('data-phase35-4-tnb-corporate', 'true');
    removeIds(clone);
    setHref(clone);
    if (!setImage(clone)) return false;
    setName(clone, referenceName);

    reference.parentElement.insertBefore(clone, reference.nextSibling);
    return true;
  }

  function boot(win) {
    const run = () => mount(win);
    if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();

    [300, 800, 1600, 3000].forEach((ms) => win.setTimeout(run, ms));

    if (win.MutationObserver) {
      const observer = new win.MutationObserver(() => {
        if (mount(win)) observer.disconnect();
      });
      const startObserver = () => {
        if (!win.document.body) return;
        observer.observe(win.document.body, { childList: true, subtree: true });
        win.setTimeout(() => observer.disconnect(), 5000);
      };
      if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', startObserver, { once: true });
      else startObserver();
    }
  }

  return { isCorporateHeading, isTnbName, panelHref, mount, boot };
});
