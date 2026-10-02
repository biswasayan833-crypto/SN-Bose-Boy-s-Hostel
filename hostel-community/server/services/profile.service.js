import User from '../models/User.js';
import { validateIdentityAvailability } from './identity.service.js';

/**
 * Curated list of predefined anonymous avatars.
 * Strict control: no arbitrary external image URLs allowed.
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

// Complete set of valid avatar keys (supports both avatar IDs and approved emoji symbols)
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
 * Reserved anonymous identities that cannot be chosen by students.
 * Prevents spoofing of staff, administration, or automated system notices.
 */
export const RESERVED_ANONYMOUS_NAMES = [
  'admin',
  'administrator',
  'system',
  'moderator',
  'mod',
  'warden',
  'hostelwarden',
  'superuser',
  'root',
  'staff',
];

/**
 * Retrieve the authenticated resident's private profile.
 * Contains real account information for the owner's private view only.
 * NEVER exposes passwords or password hashes.
 */
export const getMyProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User profile not found or account is inactive.');
    error.statusCode = 404;
    throw error;
  }

  return user.toPrivateProfileObject();
};

/**
 * Update safe profile fields for the authenticated student.
 * STRICT SECURITY: Never allows modification of:
 * - fullName
 * - email
 * - year
 * - role
 * - isActive
 * - password
 */
export const updateMyProfile = async (userId, payload = {}) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User profile not found or account is inactive.');
    error.statusCode = 404;
    throw error;
  }

  const { anonymousName, anonymousAvatar, bio } = payload;
  let targetName = user.anonymousName;
  let targetAvatar = user.anonymousAvatar;
  let identityModified = false;

  // 1. Validate anonymousName if provided
  if (anonymousName !== undefined) {
    if (typeof anonymousName !== 'string') {
      const error = new Error('Anonymous name must be a string.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = anonymousName.trim();
    if (!trimmedName) {
      const error = new Error('Anonymous name cannot be empty.');
      error.statusCode = 400;
      throw error;
    }

    if (trimmedName.length < 3 || trimmedName.length > 30) {
      const error = new Error('Anonymous name must be between 3 and 30 characters.');
      error.statusCode = 400;
      throw error;
    }

    // HTML / Script injection check
    if (/[<>]/.test(trimmedName)) {
      const error = new Error('Anonymous name cannot contain HTML or angle brackets.');
      error.statusCode = 400;
      throw error;
    }

    // Reserved name check
    const normalized = trimmedName.toLowerCase().replace(/[\s_-]/g, '');
    const isReserved = RESERVED_ANONYMOUS_NAMES.some((res) => normalized === res || normalized.startsWith(res));
    if (isReserved) {
      const error = new Error(`The anonymous name '${trimmedName}' is reserved for administration.`);
      error.statusCode = 400;
      throw error;
    }

    targetName = trimmedName;
    identityModified = true;
  }

  // 2. Validate anonymousAvatar if provided
  if (anonymousAvatar !== undefined) {
    if (typeof anonymousAvatar !== 'string') {
      const error = new Error('Anonymous avatar must be a string.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedAvatar = anonymousAvatar.trim();
    if (!trimmedAvatar || !ALLOWED_AVATAR_KEYS.includes(trimmedAvatar)) {
      const error = new Error(
        `Invalid avatar selection '${trimmedAvatar}'. Please choose a valid avatar.`
      );
      error.statusCode = 400;
      throw error;
    }

    targetAvatar = trimmedAvatar;
    identityModified = true;
  }

  // Check unique community identity (name + avatar combination) across active students
  if (identityModified) {
    await validateIdentityAvailability(targetName, targetAvatar, userId);
    user.anonymousName = targetName;
    user.anonymousAvatar = targetAvatar;
  }

  // 3. Validate bio if provided
  if (bio !== undefined) {
    if (typeof bio !== 'string') {
      const error = new Error('Bio must be a string.');
      error.statusCode = 400;
      throw error;
    }

    const trimmedBio = bio.trim();
    if (trimmedBio.length > 160) {
      const error = new Error('Bio cannot exceed 160 characters.');
      error.statusCode = 400;
      throw error;
    }

    if (/[<>]/.test(trimmedBio)) {
      const error = new Error('Bio cannot contain HTML or script characters.');
      error.statusCode = 400;
      throw error;
    }

    user.bio = trimmedBio;
  }

  // Save changes (pre-save handles timestamps and anonymousIdentityKey normalization)
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      const error = new Error('This anonymous identity is already in use. Please choose another.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  return {
    profile: user.toPrivateProfileObject(),
    user: user.toSafeObject(),
  };
};

/**
 * Change authenticated user's password securely.
 * Enforces current password verification and bcryptjs hashing.
 */
export const changeMyPassword = async (userId, { currentPassword, newPassword } = {}) => {
  if (!currentPassword || typeof currentPassword !== 'string') {
    const error = new Error('Current password is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!newPassword || typeof newPassword !== 'string') {
    const error = new Error('New password is required.');
    error.statusCode = 400;
    throw error;
  }

  if (newPassword.length < 8) {
    const error = new Error('New password must be at least 8 characters long.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId).select('+password');
  if (!user || !user.isActive) {
    const error = new Error('User not found or account is inactive.');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password does not match.');
    error.statusCode = 400;
    throw error;
  }

  if (currentPassword === newPassword) {
    const error = new Error('New password must be different from your current password.');
    error.statusCode = 400;
    throw error;
  }

  // Assign new password; mongoose pre('save') hook hashes it with bcrypt
  user.password = newPassword;
  await user.save();

  return {
    message: 'Password changed successfully.',
  };
};

export default {
  ALLOWED_AVATARS,
  ALLOWED_AVATAR_KEYS,
  RESERVED_ANONYMOUS_NAMES,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
};
