import { registerStudent, loginStudent } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * Handle student registration
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { fullName, email, password, year } = req.body;
    const result = await registerStudent({ fullName, email, password, year });
    return successResponse(res, 'Registration successful', result, 201);
  } catch (error) {
    const statusCode = error.statusCode || (error.code === 11000 ? 409 : 400);
    const message =
      error.code === 11000
        ? 'An account with this email address already exists.'
        : error.message || 'Registration failed.';
    return errorResponse(res, message, null, statusCode);
  }
};

/**
 * Handle student login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginStudent({ email, password });
    return successResponse(res, 'Login successful', result, 200);
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return errorResponse(res, error.message || 'Authentication failed.', null, statusCode);
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
  getMe,
  logout,
};
