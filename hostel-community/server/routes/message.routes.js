import { Router } from 'express';
import {
  postReaction,
  deleteReaction,
  deleteUserMessage,
  reportUserMessage,
} from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

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

export default router;
