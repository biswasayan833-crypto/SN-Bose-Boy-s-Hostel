import { globalSearch } from '../services/search.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

export const ALLOWED_SEARCH_TYPES = ['all', 'messages', 'rooms', 'announcements', 'polls'];

/**
 * GET /api/search
 * Global Search endpoint across messages, rooms, announcements, and polls.
 * Query Parameters:
 *   - q (string): search query keywords (max 100 chars)
 *   - type (string): 'all' | 'messages' | 'rooms' | 'announcements' | 'polls' (default: 'all')
 *   - roomId (string, optional): scope search to a specific authorized room
 *   - page (number, optional): page number (default: 1)
 *   - limit (number, optional): items per page (default: 20, max: 50)
 */
export const searchContent = async (req, res) => {
  try {
    const rawQuery = (req.query.q !== undefined ? req.query.q : req.query.query) || '';
    const trimmedQuery = typeof rawQuery === 'string' ? rawQuery.trim() : '';

    // Validate query length to prevent abusive resource consumption
    if (trimmedQuery.length > 100) {
      return errorResponse(
        res,
        'Search query cannot exceed 100 characters.',
        null,
        400
      );
    }

    const type = (req.query.type || 'all').toLowerCase().trim();
    if (!ALLOWED_SEARCH_TYPES.includes(type)) {
      return errorResponse(
        res,
        `Invalid search type '${type}'. Allowed types: ${ALLOWED_SEARCH_TYPES.join(', ')}`,
        null,
        400
      );
    }

    // Validate pagination parameters
    let page = 1;
    if (req.query.page !== undefined) {
      page = parseInt(req.query.page, 10);
      if (isNaN(page) || page < 1) {
        return errorResponse(res, 'Page parameter must be a positive integer.', null, 400);
      }
    }

    let limit = 20;
    if (req.query.limit !== undefined) {
      const parsedLimit = parseInt(req.query.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return errorResponse(res, 'Limit parameter must be a positive integer.', null, 400);
      }
      if (parsedLimit > 100) {
        return errorResponse(res, 'Limit cannot exceed 100 items per page.', null, 400);
      }
      limit = Math.min(50, parsedLimit);
    }

    let roomId = req.query.roomId || null;
    if (roomId && !roomId.match(/^[0-9a-fA-F]{24}$/)) {
      return errorResponse(res, 'Invalid roomId format.', null, 400);
    }

    const data = await globalSearch({
      user: req.user,
      query: trimmedQuery,
      type,
      roomId,
      page,
      limit,
    });

    return successResponse(res, 'Search completed successfully', data);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'An error occurred while executing search.',
      null,
      error.statusCode || 500
    );
  }
};

export default {
  searchContent,
};
