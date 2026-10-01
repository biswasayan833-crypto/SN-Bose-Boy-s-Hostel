import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
} from '../controllers/profile.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All profile endpoints require valid JWT authentication
router.use(requireAuth);

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.patch('/me/password', changePassword);

export default router;
