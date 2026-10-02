import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { searchContent } from '../controllers/search.controller.js';

const router = Router();

// Enforce authentication on all search endpoints
router.use(requireAuth);

/**
 * GET /api/search
 * Global search across messages, rooms, announcements, and polls
 */
router.get('/', searchContent);

export default router;
