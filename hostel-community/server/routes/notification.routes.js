import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All notification endpoints require JWT authentication
router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:notificationId/read', markRead);

export default router;
