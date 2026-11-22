import { createSnapshot, applyLivePayload, createRatingViewModel, isLegacyRatingText } from './phase34-rating-core.mjs';

const ENDPOINT = 'https://ufgelclsicoomxiavozp.supabase.co/functions/v1/branch-google-place';
const BRANCHES = {
  teratai: {
    selectors: ['#teratai', '[data-branch="teratai"]', '[data-branch-key="teratai"]'],
    cues: ['klinik teratai al-fatih', '012-600 9137', 'jalan enau 15'],
  },
  tropika: {
    selectors: ['#tropika', '[data-branch="tropika"]', '[data-branch-key="tropika"]'],
    cues: ['klinik tropika al-fatih', '017-520 4224', 'jalan setia tropika 1/30'],
  },
};

function ensureStyles() {
  if (document.getElementById('phase345-rating-style')) return;
  const style = document.createElement('style');
  style.id = 'phase345-rating-style';
  style.textContent = `
    .phase345-rating{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;width:100%;min-width:0;padding:.45rem 0 .25rem;color:#0b1538}
    .phase345-rating__score{font-size:clamp(1.85rem,3.2vw,2.25rem);font-weight:900;line-height:1;letter-spacing:-.045em}
    .phase345-rating__stars{color:#f4a900;letter-spacing:.045em;font-size:1.08rem;white-space:nowrap;line-height:1}
    .phase345-rating__count{font-size:.94rem;font-weight:800;white-space:nowrap;color:#172246}
    .phase345-rating__badge{margin-left:auto;display:inline-flex;align-items:center;border-radius:999px;padding:.28rem .55rem;background:#eef4ff;color:#3150c9;font-size:.7rem;font-weight:850;white-space:nowrap}
    .phase345-rating__badge[data-live="true"]{background:#e9f8ef;color:#08783a}
    @media(max-width:560px){.phase345-rating{gap:.5rem}.phase345-rating__score{font-size:1.75rem}.phase345-rating__count{font-size:.88rem}.phase345-rating__badge{margin-left:0}}
  `;
  document.head.appendChild(style);
}

function normalizedText(el) {
  return String(el?.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findBranchRoot(branch) {
  const config = BRANCHES[branch];
  for (const selector of config.selectors) {
    const direct = document.querySelector(selector);
    if (direct) return direct;
  }

  const candidates = [...document.querySelectorAll('section, article, main > div, .branch-section, .branch-card')]
    .filter((el) => {
      const text = normalizedText(el);
      return text.includes('google reviews') && config.cues.some((cue) => text.includes(cue));
    })
    .sort((a, b) => normalizedText(a).length - normalizedText(b).length);
  return candidates[0] || null;
}

function findReviewCard(root) {
  if (!root) return null;
  const explicit = root.querySelector('[data-google-review-card], [data-google-rating-card], .google-review-card, .branch-review-card, .branch-google-review');
  if (explicit) return explicit;

  const candidates = [...root.querySelectorAll('section, article, div')]
    .filter((el) => {
      const text = normalizedText(el);
      if (!text.includes('google reviews')) return false;
      const hasReviewLinks = [...el.querySelectorAll('a')].some((a) => /baca semua ulasan|tulis review/i.test(a.textContent || ''));
      return hasReviewLinks || /memuatkan|lihat rating|snapshot google|ulasan/.test(text);
    })
    .sort((a, b) => normalizedText(a).length - normalizedText(b).length);
  return candidates[0] || null;
}

function findLinkRow(card) {
  const link = [...card.querySelectorAll('a')].find((a) => /baca semua ulasan|tulis review/i.test(a.textContent || ''));
  if (!link) return null;
  let row = link.parentElement;
  while (row && row.parentElement !== card && row.parentElement?.querySelectorAll('a').length <= 3) row = row.parentElement;
  return row && card.contains(row) ? row : null;
}

function cleanupLegacy(card) {
  for (const el of [...card.querySelectorAll('.phase344-rating, .phase343-static-rating-inline, .phase345-rating, [data-google-rating-summary], [data-google-rating], [data-review-summary]')]) {
    el.remove();
  }

  const textNodes = [...card.querySelectorAll('div, p, span, small')];
  for (const el of textNodes) {
    if (!el.isConnected || el.querySelector('a')) continue;
    const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text || /google reviews/i.test(text)) continue;
    if (isLegacyRatingText(text)) el.remove();
  }

  for (const small of card.querySelectorAll('small')) {
    if (/semakan rating live/i.test(small.textContent || '')) small.textContent = 'Rating & ulasan Google';
  }
}

function render(branch, model) {
  const root = findBranchRoot(branch);
  const card = findReviewCard(root);
  const vm = createRatingViewModel(model);
  if (!card || !vm) return false;

  cleanupLegacy(card);

  const rating = document.createElement('div');
  rating.className = 'phase345-rating';
  rating.dataset.ratingBranch = branch;
  rating.dataset.ratingSource = vm.live ? 'live' : 'snapshot';
  rating.setAttribute('aria-live', 'polite');
  rating.innerHTML = `
    <strong class="phase345-rating__score">${vm.score}</strong>
    <span class="phase345-rating__stars" aria-label="${vm.score} daripada 5 bintang">${vm.stars}</span>
    <span class="phase345-rating__count">${vm.count}</span>
    <span class="phase345-rating__badge" data-live="${vm.live ? 'true' : 'false'}">${vm.badge}</span>`;

  const linkRow = findLinkRow(card);
  if (linkRow) card.insertBefore(rating, linkRow);
  else card.appendChild(rating);

  const links = [...card.querySelectorAll('a')];
  const readLink = links.find((a) => /baca semua ulasan/i.test(a.textContent || ''));
  const writeLink = links.find((a) => /tulis review/i.test(a.textContent || ''));
  if (readLink && model.googleMapsUri) readLink.href = model.googleMapsUri;
  if (writeLink && model.writeReviewUri) writeLink.href = model.writeReviewUri;
  return true;
}

async function fetchLive(branch) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5500);
  try {
    const response = await fetch(`${ENDPOINT}?branch=${encodeURIComponent(branch)}`, {
      method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.ok === true ? payload : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function hydrate(branch) {
  const snapshot = createSnapshot(branch);
  if (!snapshot) return;
  render(branch, snapshot);
  const payload = await fetchLive(branch);
  const next = applyLivePayload(snapshot, payload);
  if (next.source === 'live') render(branch, next);
}

function init() {
  ensureStyles();
  void hydrate('teratai');
  void hydrate('tropika');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
