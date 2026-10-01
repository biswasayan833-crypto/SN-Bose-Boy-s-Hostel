import User from '../models/User.js';

const ADJECTIVES = [
  'Anonymous',
  'Midnight',
  'Silent',
  'Hidden',
  'Quiet',
  'Mystery',
  'Cosmic',
  'Shadow',
  'Ghost',
  'Silver',
  'Solar',
  'Lunar',
  'Echo',
  'Cyber',
  'Phantom',
  'Swift',
  'Brave',
  'Zen',
  'Frost',
  'Astral',
  'Nebula',
  'Velvet',
  'Iron',
  'Crimson',
  'Storm',
];

const NOUN_AVATARS = [
  { noun: 'Panda', avatar: '🐼' },
  { noun: 'Owl', avatar: '🦉' },
  { noun: 'Rider', avatar: '🏍️' },
  { noun: 'Fox', avatar: '🦊' },
  { noun: 'Wolf', avatar: '🐺' },
  { noun: 'Tiger', avatar: '🐯' },
  { noun: 'Falcon', avatar: '🦅' },
  { noun: 'Lynx', avatar: '🐆' },
  { noun: 'Hawk', avatar: '🦅' },
  { noun: 'Nomad', avatar: '🧭' },
  { noun: 'Bear', avatar: '🐻' },
  { noun: 'Panther', avatar: '🐆' },
  { noun: 'Raven', avatar: '🐦‍⬛' },
  { noun: 'Stag', avatar: '🦌' },
  { noun: 'Phoenix', avatar: '🦅' },
  { noun: 'Badger', avatar: '🦡' },
  { noun: 'Otter', avatar: '🦦' },
  { noun: 'Koala', avatar: '🐨' },
];

/**
 * Generate a unique anonymous pseudonym and avatar for a student.
 * Checks against existing active users in MongoDB to avoid duplicates.
 */
export const generateUniqueAnonymousIdentity = async () => {
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const item = NOUN_AVATARS[Math.floor(Math.random() * NOUN_AVATARS.length)];
    const candidateName = `${adj} ${item.noun}`;

    const exists = await User.exists({ anonymousName: candidateName, isActive: true });
    if (!exists) {
      return {
        anonymousName: candidateName,
        anonymousAvatar: item.avatar,
      };
    }
  }

  // Deterministic fallback with random suffix if name space fills
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const item = NOUN_AVATARS[Math.floor(Math.random() * NOUN_AVATARS.length)];
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  const candidateName = `${adj} ${item.noun} ${randomSuffix}`;

  return {
    anonymousName: candidateName,
    anonymousAvatar: item.avatar,
  };
};

export default {
  generateUniqueAnonymousIdentity,
};
