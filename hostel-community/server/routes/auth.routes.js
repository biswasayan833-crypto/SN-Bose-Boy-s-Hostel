import { Router } from 'express';
import {
  register,
  login,
  verifyOtp,
  resendOtp,
  getMe,
  logout,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/logout', logout);

// Protected auth endpoints
router.get('/me', requireAuth, getMe);

export default router;
