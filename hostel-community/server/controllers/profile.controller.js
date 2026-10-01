import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} from '../services/profile.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * GET /api/profile/me
 * Retrieve the authenticated user's private profile
 */
export const getProfile = async (req, res) => {
  try {
    const profile = await getMyProfile(req.user._id);
    return successResponse(res, 'Profile retrieved successfully', { profile });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve profile.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/profile/me
 * Update authenticated user's safe community identity fields (anonymousName, anonymousAvatar, bio)
 */
export const updateProfile = async (req, res) => {
  try {
    const { anonymousName, anonymousAvatar, bio } = req.body;
    const result = await updateMyProfile(req.user._id, {
      anonymousName,
      anonymousAvatar,
      bio,
    });

    return successResponse(res, 'Profile updated successfully', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to update profile.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/profile/me/password
 * Change authenticated user's password securely
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await changeMyPassword(req.user._id, {
      currentPassword,
      newPassword,
    });

    return successResponse(res, 'Password changed successfully', result);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to change password.',
      null,
      error.statusCode || 500
    );
  }
};

export default {
  getProfile,
  updateProfile,
  changePassword,
};
