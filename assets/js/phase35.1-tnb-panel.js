(() => {
  'use strict';

  const path = (window.location.pathname || '').toLowerCase();
  if (!path.includes('panel-klinik')) return;

  const PANEL_NAME = 'Tenaga Nasional Berhad (TNB)';
  const IMG = '/assets/img/panel-partners/tenaga-nasional-berhad.jpg';

  function alreadyPresent() {
    return !!document.querySelector('[data-tnb-panel]') ||
      Array.from(document.querySelectorAll('main, body')).some(el =>
        /Tenaga\s+Nasional\s+Berhad\s*\(TNB\)/i.test(el.textContent || '')
      );
  }

  function installStyle() {
    if (document.getElementById('phase35-1-tnb-style')) return;
    const style = document.createElement('style');
    style.id = 'phase35-1-tnb-style';
    style.textContent = `
      .phase35-1-tnb-card{position:relative;box-sizing:border-box;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.7rem;padding:1rem;border:1px solid #e3e8f4;border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(19,43,91,.06);text-align:center;overflow:visible}
      .phase35-1-tnb-card img{display:block;width:min(100%,220px)!important;height:86px!important;object-fit:contain!important;margin:auto;background:#fff}
      .phase35-1-tnb-card figcaption,.phase35-1-tnb-card .phase35-1-tnb-name{font:700 .86rem/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#142348;margin:0}
      .phase35-1-tnb-badge{position:absolute;top:-9px;right:10px;display:inline-flex;align-items:center;padding:.28rem .55rem;border-radius:999px;background:#eef3ff;border:1px solid #cad6ff;color:#1641bd;font:800 .62rem/1 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;white-space:nowrap}
      .phase35-1-fallback{margin:1.25rem 0;padding:1rem;border-radius:20px;border:1px solid #e2e8f6;background:#f8faff}
      .phase35-1-fallback-title{margin:0 0 .8rem;font:800 1rem/1.25 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#10234d}
      @media(max-width:640px){.phase35-1-tnb-card{padding:.8rem;border-radius:15px}.phase35-1-tnb-card img{height:72px!important}.phase35-1-tnb-badge{top:-8px;right:8px;font-size:.58rem}}
    `;
    document.head.appendChild(style);
  }

  function makeCard() {
    const card = document.createElement('figure');
    card.className = 'phase35-1-tnb-card';
    card.setAttribute('data-tnb-panel', 'true');
    card.innerHTML = `
      <span class="phase35-1-tnb-badge">Panel Baharu</span>
      <img src="${IMG}" alt="${PANEL_NAME}" loading="lazy" decoding="async" />
      <figcaption>${PANEL_NAME}</figcaption>
    `;
    return card;
  }

  function imageChildCount(el) {
    let count = 0;
    for (const child of Array.from(el.children || [])) {
      if (child.querySelector && child.querySelector('img')) count++;
    }
    return count;
  }

  function nearestMalaysiaScope() {
    const headings = Array.from(document.querySelectorAll('main h1, main h2, main h3, main h4'));
    const h = headings.find(el => /malaysia/i.test(el.textContent || '') && /(panel|rakan|partner)/i.test(el.textContent || ''));
    if (!h) return null;
    return h.closest('section,article,div') || h.parentElement;
  }

  function gridCandidates(root) {
    const explicit = Array.from(root.querySelectorAll('.p8-logo-grid,[class*="logo-grid"],[class*="panel-grid"],[class*="partner-grid"],[data-panel-grid]'));
    const generic = Array.from(root.querySelectorAll('div,ul,ol,section')).filter(el => {
      if (el.closest('header,footer,nav')) return false;
      return imageChildCount(el) >= 3;
    });
    return [...new Set([...explicit, ...generic])];
  }

  function scoreGrid(el) {
    const cls = `${el.className || ''} ${el.id || ''}`.toLowerCase();
    const count = imageChildCount(el);
    let score = count * 10;
    if (/logo|panel|partner|rakan/.test(cls)) score += 30;
    const text = (el.textContent || '').toLowerCase();
    if (text.includes('singapore')) score -= 20;
    if (text.includes('malaysia')) score += 10;
    return score;
  }

  function findBestLogoGrid() {
    const main = document.querySelector('main') || document.body;
    const malaysia = nearestMalaysiaScope();
    const scoped = malaysia ? gridCandidates(malaysia) : [];
    const all = gridCandidates(main);
    const candidates = scoped.length ? scoped : all;
    candidates.sort((a,b) => scoreGrid(b) - scoreGrid(a));
    const best = candidates[0];
    return best && imageChildCount(best) >= 3 ? best : null;
  }

  function fallbackTnbSection() {
    const main = document.querySelector('main') || document.body;
    const section = document.createElement('section');
    section.className = 'phase35-1-fallback';
    section.setAttribute('data-phase35-1-fallback', 'true');
    section.innerHTML = '<h2 class="phase35-1-fallback-title">Panel Baharu</h2>';
    section.appendChild(makeCard());

    const singaporeHeading = Array.from(main.querySelectorAll('h1,h2,h3,h4')).find(el => /singapore/i.test(el.textContent || ''));
    const anchor = singaporeHeading?.closest('section,article,div') || singaporeHeading;
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(section, anchor);
    else main.appendChild(section);
  }

  function mount() {
    if (alreadyPresent()) return true;
    installStyle();
    const grid = findBestLogoGrid();
    if (grid) grid.appendChild(makeCard());
    else fallbackTnbSection();
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, {once:true});
  } else {
    mount();
  }

  // Astro/client scripts may finish after DOMContentLoaded; one guarded retry ensures
  // the panel survives late page hydration without creating duplicates.
  window.setTimeout(mount, 900);
})();
