export const BRANCH_SNAPSHOTS = Object.freeze({
  teratai: Object.freeze({
    rating: 4.8,
    reviewCount: 700,
    reviewCountApproximate: true,
    asOf: '2026-09-19',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=Klinik%20Teratai%20Al-Fatih&query_place_id=ChIJMVB8ITt32jERXrkPOPE0DLY',
    writeReviewUri: 'https://search.google.com/local/writereview?placeid=ChIJMVB8ITt32jERXrkPOPE0DLY',
  }),
  tropika: Object.freeze({
    rating: 5.0,
    reviewCount: 60,
    reviewCountApproximate: true,
    asOf: '2026-09-19',
    googleMapsUri: 'https://www.google.com/maps/search/?api=1&query=Klinik%20Tropika%20Al-Fatih&query_place_id=ChIJG1JzNtNm6KARGPSOX5718cY',
    writeReviewUri: 'https://search.google.com/local/writereview?placeid=ChIJG1JzNtNm6KARGPSOX5718cY',
  }),
});

export function createSnapshot(branch) {
  const snapshot = BRANCH_SNAPSHOTS[branch];
  if (!snapshot) return null;
  return { ...snapshot, branch, source: 'snapshot' };
}

export function applyLivePayload(current, payload) {
  if (!current || payload?.ok !== true) return current;
  if (payload.rating === null || payload.rating === undefined || payload.rating === '') return current;
  if (payload.userRatingCount === null || payload.userRatingCount === undefined || payload.userRatingCount === '') return current;

  const rating = Number(payload.rating);
  const reviewCount = Number(payload.userRatingCount);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return current;
  if (!Number.isInteger(reviewCount) || reviewCount < 0) return current;

  return {
    ...current,
    rating,
    reviewCount,
    reviewCountApproximate: false,
    source: 'live',
    fetchedAt: typeof payload.fetchedAt === 'string' ? payload.fetchedAt : new Date().toISOString(),
    googleMapsUri: typeof payload.googleMapsUri === 'string' && payload.googleMapsUri ? payload.googleMapsUri : current.googleMapsUri,
    writeReviewUri: typeof payload.writeReviewUri === 'string' && payload.writeReviewUri ? payload.writeReviewUri : current.writeReviewUri,
  };
}

export function isLegacyRatingText(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!text) return false;
  if (text === 'google reviews') return false;
  if (/baca semua ulasan di google|tulis review di google/.test(text)) return false;
  return /memuatkan|lihat rating.*ulasan.*google|google rating snapshot|snapshot google|dikemas kini automatik daripada google places|semakan rating live/.test(text);
}

export function createRatingViewModel(model) {
  if (!model) return null;
  const score = Number(model.rating).toFixed(1);
  const formatted = new Intl.NumberFormat('ms-MY').format(Number(model.reviewCount));
  const approximate = Boolean(model.reviewCountApproximate);
  const live = model.source === 'live';
  return {
    score,
    stars: '★★★★★',
    count: `${formatted}${approximate ? '+' : ''} ulasan`,
    badge: live ? 'Live Google' : 'Google snapshot',
    live,
  };
}
