import { Router } from 'express';
import {
  getPollsHandler,
  getPollByIdHandler,
  createPollHandler,
  votePollHandler,
  retractVoteHandler,
  closePollHandler,
  deletePollHandler,
} from '../controllers/poll.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All poll endpoints require authentication
router.use(requireAuth);

router.get('/', getPollsHandler);
router.get('/:pollId', getPollByIdHandler);
router.post('/:pollId/vote', votePollHandler);
router.delete('/:pollId/vote', retractVoteHandler);

// Admin-only management endpoints
router.post('/', requireAdmin, createPollHandler);
router.patch('/:pollId/close', requireAdmin, closePollHandler);
router.delete('/:pollId', requireAdmin, deletePollHandler);

export default router;
