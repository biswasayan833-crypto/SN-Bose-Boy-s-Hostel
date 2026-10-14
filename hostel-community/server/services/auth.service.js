import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User, { ALLOWED_YEARS } from '../models/User.js';
import {
  generateUniqueAnonymousIdentity,
  validateIdentityAvailability,
} from './identity.service.js';
import { sendLoginOtpEmail } from './email.service.js';

/**
 * Generate a signed JSON Web Token
 */
export const signJwtToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured in the server environment.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn });
};

/**
 * Register a new hostel student
 */
export const registerStudent = async ({
  fullName,
  email,
  password,
  year,
  anonymousName: customName,
  anonymousAvatar: customAvatar,
}) => {
  // Input validations
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    const error = new Error('Full name is required and must be at least 2 characters long.');
    error.statusCode = 400;
    throw error;
  }

  if (!email || typeof email !== 'string') {
    const error = new Error('A valid email address is required.');
    error.statusCode = 400;
    throw error;
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const normalizedEmail = email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    const error = new Error('Please provide a valid email address.');
    error.statusCode = 400;
    throw error;
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    const error = new Error('Password must be at least 6 characters long.');
    error.statusCode = 400;
    throw error;
  }

  // Strict year validation
  if (!year || !ALLOWED_YEARS.includes(year)) {
    const error = new Error(
      `Invalid year selected. Prof. S.N. Bose Boys Hostel accommodates only 2nd Year, 3rd Year, and 4th Year residents.`
    );
    error.statusCode = 400;
    throw error;
  }

  // Duplicate email check
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Determine or generate unique anonymous persona
  let anonymousName;
  let anonymousAvatar;

  if (customName && customAvatar) {
    await validateIdentityAvailability(customName, customAvatar);
    anonymousName = customName.trim();
    anonymousAvatar = customAvatar.trim();
  } else {
    const generated = await generateUniqueAnonymousIdentity();
    anonymousName = generated.anonymousName;
    anonymousAvatar = generated.anonymousAvatar;
  }

  // Create user record
  const newUser = new User({
    fullName: fullName.trim(),
    email: normalizedEmail,
    password,
    year,
    anonymousName,
    anonymousAvatar,
    role: 'student',
    isActive: true,
  });

  try {
    await newUser.save();
  } catch (err) {
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      if (err.keyPattern?.anonymousIdentityKey || err.message?.includes('anonymousIdentityKey')) {
        const error = new Error('This anonymous identity is already in use. Please choose another.');
        error.statusCode = 409;
        throw error;
      }
      const error = new Error('An account with this email address already exists.');
      error.statusCode = 409;
      throw error;
    }
    throw err;
  }

  // Sign JWT token
  const token = signJwtToken(newUser._id);

  return {
    user: newUser.toSafeObject(),
    token,
  };
};

/**
 * Login an existing hostel student - triggers 2FA OTP verification
 */
export const loginStudent = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error('Both email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Explicitly select password for verification
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact hostel authorities.');
    error.statusCode = 403;
    throw error;
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Hash OTP for storage
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpCode = hashedOtp;
  user.otpExpires = otpExpires;
  await user.save();

  // Dispatch OTP email (fire-and-forget so SMTP timeouts or port-blocking never hang login response)
  try {
    sendLoginOtpEmail({
      email: user.email,
      otp,
      fullName: user.fullName,
    }).catch((emailErr) => {
      console.warn(`[2FA Email Background Warning] Failed to dispatch OTP email: ${emailErr.message}`);
    });
  } catch (emailErr) {
    console.warn(`[2FA Email Dispatch Sync Warning]: ${emailErr.message}`);
  }

  const isDevOrTest = process.env.NODE_ENV !== 'production' || !process.env.EMAIL_USER;

  return {
    requires2FA: true,
    email: user.email,
    message: 'Verification code sent to your email',
    ...(isDevOrTest ? { testOtp: otp } : {}),
  };
};

/**
 * Verify 2FA OTP and finalize authentication
 */
export const verifyLoginOtp = async ({ email, otp }) => {
  if (!email || !otp) {
    const error = new Error('Both email and verification code are required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const cleanedOtp = String(otp).trim();

  if (!/^\d{6}$/.test(cleanedOtp)) {
    const error = new Error('Verification code must be a 6-digit numeric code.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+otpCode +otpExpires');
  if (!user) {
    const error = new Error('Invalid email or verification code.');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact hostel authorities.');
    error.statusCode = 403;
    throw error;
  }

  if (!user.otpCode || !user.otpExpires) {
    const error = new Error('No active verification code found. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  if (new Date() > user.otpExpires) {
    // Clear expired code
    user.otpCode = null;
    user.otpExpires = null;
    await user.save();

    const error = new Error('Verification code has expired. Please request a new code.');
    error.statusCode = 400;
    throw error;
  }

  const hashedInputOtp = crypto.createHash('sha256').update(cleanedOtp).digest('hex');
  if (hashedInputOtp !== user.otpCode) {
    const error = new Error('Invalid verification code. Please check and try again.');
    error.statusCode = 400;
    throw error;
  }

  // Clear OTP fields upon successful verification
  user.otpCode = null;
  user.otpExpires = null;
  await user.save();

  // Sign JWT token
  const token = signJwtToken(user._id);

  return {
    user: user.toSafeObject(),
    token,
  };
};

/**
 * Resend 2FA OTP code
 */
export const resendLoginOtp = async ({ email }) => {
  if (!email) {
    const error = new Error('Email address is required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    const error = new Error('No user account found with this email address.');
    error.statusCode = 404;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact hostel authorities.');
    error.statusCode = 403;
    throw error;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  user.otpCode = hashedOtp;
  user.otpExpires = otpExpires;
  await user.save();

  // Dispatch OTP email (fire-and-forget so SMTP timeouts or port-blocking never hang resend response)
  try {
    sendLoginOtpEmail({
      email: user.email,
      otp,
      fullName: user.fullName,
    }).catch((emailErr) => {
      console.warn(`[2FA Email Background Warning] Failed to dispatch OTP email: ${emailErr.message}`);
    });
  } catch (emailErr) {
    console.warn(`[2FA Email Dispatch Sync Warning]: ${emailErr.message}`);
  }

  const isDevOrTest = process.env.NODE_ENV !== 'production' || !process.env.EMAIL_USER;

  return {
    success: true,
    email: user.email,
    message: 'A new verification code has been sent to your email.',
    ...(isDevOrTest ? { testOtp: otp } : {}),
  };
};

/**
 * Get community-facing profile for authenticated user
 */
export const getStudentProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) {
    const error = new Error('User account not found or deactivated.');
    error.statusCode = 404;
    throw error;
  }

  return user.toSafeObject();
};

export default {
  signJwtToken,
  registerStudent,
  loginStudent,
  verifyLoginOtp,
  resendLoginOtp,
  getStudentProfile,
};
