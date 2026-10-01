import { Router } from 'express';
import {
  getAnnouncementsHandler,
  getAnnouncementByIdHandler,
  createAnnouncementHandler,
  updateAnnouncementHandler,
  deleteAnnouncementHandler,
} from '../controllers/announcement.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All announcement endpoints require authentication
router.use(requireAuth);

router.get('/', getAnnouncementsHandler);
router.get('/:announcementId', getAnnouncementByIdHandler);

// Admin-only management endpoints
router.post('/', requireAdmin, createAnnouncementHandler);
router.patch('/:announcementId', requireAdmin, updateAnnouncementHandler);
router.delete('/:announcementId', requireAdmin, deleteAnnouncementHandler);

export default router;
