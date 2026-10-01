import { Router } from 'express';
import { getRooms, getRoom, getMessages, sendMessage } from '../controllers/room.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All room and chat routes require valid JWT authentication
router.use(requireAuth);

router.get('/', getRooms);
router.get('/:slug', getRoom);
router.get('/:roomId/messages', getMessages);
router.post('/:roomId/messages', sendMessage);

export default router;
