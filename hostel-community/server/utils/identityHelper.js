/**
 * Curated list of predefined anonymous avatars.
 * Canonical mapping between avatar IDs (e.g. 'avatar-01') and icon symbols (e.g. '🦅').
 */
export const ALLOWED_AVATARS = [
  { id: 'avatar-01', icon: '🦅', label: 'Falcon' },
  { id: 'avatar-02', icon: '🐺', label: 'Wolf' },
  { id: 'avatar-03', icon: '🐯', label: 'Tiger' },
  { id: 'avatar-04', icon: '🦊', label: 'Fox' },
  { id: 'avatar-05', icon: '🦉', label: 'Owl' },
  { id: 'avatar-06', icon: '🐼', label: 'Panda' },
  { id: 'avatar-07', icon: '🐆', label: 'Panther' },
  { id: 'avatar-08', icon: '🐻', label: 'Bear' },
];

export const ALLOWED_AVATAR_KEYS = [
  'avatar-01',
  'avatar-02',
  'avatar-03',
  'avatar-04',
  'avatar-05',
  'avatar-06',
  'avatar-07',
  'avatar-08',
  '🦅', '🐺', '🐯', '🦊', '🦉', '🐼', '🐆', '🐻', '🦌', '🐨', '🦦', '🦡', '🛡️', '🎭', '🏍️', '🧭', '🐦‍⬛'
];

/**
 * Maps any avatar string (ID or emoji) to its canonical identifier.
 * Example: 'avatar-01' -> 'avatar-01', '🦅' -> 'avatar-01'
 */
export const canonicalizeAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return '';
  const trimmed = avatar.trim();
  const matched = ALLOWED_AVATARS.find(
    (a) => a.id.toLowerCase() === trimmed.toLowerCase() || a.icon === trimmed
  );
  return matched ? matched.id : trimmed.toLowerCase();
};

/**
 * Computes the normalized identity key for an anonymous identity.
 * Key format: `<normalizedAnonymousName>::<canonicalAvatar>`
 * Example: 'Quiet Tiger' + 'avatar-01' -> 'quiet tiger::avatar-01'
 *          'quiet tiger' + '🦅'         -> 'quiet tiger::avatar-01'
 */
export const computeIdentityKey = (anonymousName, anonymousAvatar) => {
  const normName = (anonymousName || '').trim().toLowerCase();
  const normAvatar = canonicalizeAvatar(anonymousAvatar);
  return `${normName}::${normAvatar}`;
};

export default {
  ALLOWED_AVATARS,
  ALLOWED_AVATAR_KEYS,
  canonicalizeAvatar,
  computeIdentityKey,
};
