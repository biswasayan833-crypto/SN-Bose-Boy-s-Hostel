import {
  registerStudent,
  loginStudent,
  verifyLoginOtp,
  resendLoginOtp,
} from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * Handle student registration
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, year, anonymousName, anonymousAvatar } = req.body;
    const result = await registerStudent({
      fullName,
      email,
      password,
      year,
      anonymousName,
      anonymousAvatar,
    });
    return successResponse(res, 'Registration successful', result, 201);
  } catch (error) {
    const isConflict = error.statusCode === 409 || error.code === 11000;
    const statusCode = error.statusCode || (isConflict ? 409 : 400);
    const message =
      error.code === 11000
        ? (error.keyPattern?.anonymousIdentityKey || error.message?.includes('anonymousIdentityKey')
            ? 'This anonymous identity is already in use. Please choose another.'
            : 'An account with this email address already exists.')
        : error.message || 'Registration failed.';
    return errorResponse(res, message, null, statusCode);
  }
};

/**
 * Handle student login (Step 1: Credentials -> Dispatches 2FA OTP)
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginStudent({ email, password });
    return successResponse(res, result.message || 'Verification code sent to your email', result, 200);
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return errorResponse(res, error.message || 'Authentication failed.', null, statusCode);
  }
};

/**
 * Handle 2FA OTP verification (Step 2: OTP -> Returns JWT & Profile)
 * POST /api/auth/verify-otp
 */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyLoginOtp({ email, otp });
    return successResponse(res, 'Authentication successful', result, 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Verification failed.', null, statusCode);
  }
};

/**
 * Handle 2FA OTP resend
 * POST /api/auth/resend-otp
 */
export const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await resendLoginOtp({ email });
    return successResponse(res, result.message || 'Verification code resent successfully', result, 200);
  } catch (error) {
    const statusCode = error.statusCode || 400;
    return errorResponse(res, error.message || 'Failed to resend verification code.', null, statusCode);
  }
};

/**
 * Get authenticated student's profile
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  try {
    // req.user is attached by requireAuth middleware
    return successResponse(
      res,
      'Profile retrieved successfully',
      {
        user: req.user.toSafeObject(),
      },
      200
    );
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user profile.', error.message, 500);
  }
};

/**
 * Handle student logout
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Client-side discards the Bearer JWT token; backend acknowledges cleanly
    return successResponse(res, 'Logged out successfully', {}, 200);
  } catch (error) {
    return errorResponse(res, 'Logout failed.', error.message, 500);
  }
};

export default {
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe,
  logout,
};
