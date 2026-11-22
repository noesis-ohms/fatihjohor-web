const MALE_AVATAR = '/assets/img/generated/locum-ai-a.webp';
const FEMALE_AVATAR = '/assets/img/generated/locum-ai-b.webp';

const stableHash = (value = '') => [...String(value)].reduce(
  (sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0,
  0,
);

export function inferLocumAvatarType(name = '') {
  const normalized = String(name)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const femaleMarker = /\bbinti\b/.test(normalized) || /\ba\s*\/\s*p\b/.test(normalized);
  const maleMarker = /\bbin\b/.test(normalized) || /\ba\s*\/\s*l\b/.test(normalized);

  // Do not force an avatar type when the name is ambiguous or contradictory.
  if (femaleMarker === maleMarker) return null;
  return femaleMarker ? 'female' : 'male';
}

export function locumAiAvatar(name = '') {
  const type = inferLocumAvatarType(name);
  if (type === 'male') return MALE_AVATAR;
  if (type === 'female') return FEMALE_AVATAR;

  // Unknown names keep the previous deterministic fallback behavior.
  return stableHash(name) % 2 === 0 ? MALE_AVATAR : FEMALE_AVATAR;
}
