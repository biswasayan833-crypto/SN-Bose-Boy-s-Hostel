import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { errorResponse } from '../utils/responseHelper.js';

/**
 * Reusable JWT Authentication Middleware.
 * Verifies Bearer token from Authorization header and attaches authenticated user to req.user.
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(
        res,
        'Authentication required. Please provide a valid Bearer token.',
        null,
        401
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token || token.trim() === '') {
      return errorResponse(res, 'Authentication token is empty.', null, 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return errorResponse(res, 'Server configuration error (JWT_SECRET).', null, 500);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, 'Session has expired. Please sign in again.', null, 401);
      }
      return errorResponse(res, 'Invalid authentication token.', null, 401);
    }

    // Retrieve active user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return errorResponse(
        res,
        'The account associated with this token no longer exists.',
        null,
        401
      );
    }

    if (!user.isActive) {
      return errorResponse(
        res,
        'This account is currently deactivated.',
        null,
        403
      );
    }

    // Attach verified user to request
    req.user = user;
    next();
  } catch (error) {
    return errorResponse(res, 'Authentication failed.', error.message, 401);
  }
};

/**
 * Admin Authorization Middleware.
 * Enforces role === 'admin' on authenticated req.user.
 * Students receive 403 Forbidden.
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required.', null, 401);
  }

  if (req.user.role !== 'admin') {
    return errorResponse(
      res,
      'Access denied: Administrator privileges required for this action.',
      null,
      403
    );
  }

  next();
};

export default requireAuth;

