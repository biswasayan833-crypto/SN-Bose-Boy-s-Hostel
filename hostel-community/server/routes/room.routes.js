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
import { postAttachmentMessage } from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadAttachmentMiddleware } from '../middleware/upload.middleware.js';

const router = Router();

// All room and chat routes require valid JWT authentication
router.use(requireAuth);

router.get('/', getRooms);
router.get('/unread', getUnreadRooms);
router.get('/:slug', getRoom);
router.patch('/:roomId/read', markRoomRead);
router.get('/:roomId/messages', getMessages);
router.post('/:roomId/messages', sendMessage);
router.post('/:roomId/attachments', uploadAttachmentMiddleware, postAttachmentMessage);
router.get('/:roomId/pinned', getPinned);

export default router;
