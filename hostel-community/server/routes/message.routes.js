import { Router } from 'express';
import {
  postReaction,
  deleteReaction,
  deleteUserMessage,
  reportUserMessage,
  pinUserMessage,
  unpinUserMessage,
} from '../controllers/message.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All message interaction and moderation routes require authentication
router.use(requireAuth);

// Reaction endpoints
router.post('/:messageId/reactions', postReaction);
router.delete('/:messageId/reactions/:type', deleteReaction);

// Message deletion endpoint
router.delete('/:messageId', deleteUserMessage);

// Message report endpoint
router.post('/:messageId/report', reportUserMessage);

// Pinned message endpoints (Admin only)
router.patch('/:messageId/pin', requireAdmin, pinUserMessage);
router.patch('/:messageId/unpin', requireAdmin, unpinUserMessage);

export default router;
