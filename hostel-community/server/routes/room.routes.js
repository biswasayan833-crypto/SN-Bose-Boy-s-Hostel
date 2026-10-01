import { Router } from 'express';
import {
  getRooms,
  getUnreadRooms,
  getRoom,
  markRoomRead,
  getMessages,
  sendMessage,
  getPinned,
} from '../controllers/room.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All room and chat routes require valid JWT authentication
router.use(requireAuth);

router.get('/', getRooms);
router.get('/unread', getUnreadRooms);
router.get('/:slug', getRoom);
router.patch('/:roomId/read', markRoomRead);
router.get('/:roomId/messages', getMessages);
router.post('/:roomId/messages', sendMessage);
router.get('/:roomId/pinned', getPinned);

export default router;
