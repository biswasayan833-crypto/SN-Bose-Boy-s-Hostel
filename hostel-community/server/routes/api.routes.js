import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import roomRoutes from './room.routes.js';
import messageRoutes from './message.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

// Base health endpoint
router.use('/health', healthRoutes);

// Authentication & Identity endpoints
router.use('/auth', authRoutes);

// Community Rooms & Chat endpoints
router.use('/rooms', roomRoutes);

// Message Reactions, Deletions, and Reporting endpoints
router.use('/messages', messageRoutes);

// Admin Moderation endpoints
router.use('/admin', adminRoutes);

export default router;

