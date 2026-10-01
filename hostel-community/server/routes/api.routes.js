import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import roomRoutes from './room.routes.js';
import messageRoutes from './message.routes.js';
import adminRoutes from './admin.routes.js';
import notificationRoutes from './notification.routes.js';
import profileRoutes from './profile.routes.js';
import announcementRoutes from './announcement.routes.js';
import pollRoutes from './poll.routes.js';

const router = Router();

// Base health endpoint
router.use('/health', healthRoutes);

// Authentication & Identity endpoints
router.use('/auth', authRoutes);

// Profile & Identity Management endpoints
router.use('/profile', profileRoutes);

// Community Rooms & Chat endpoints
router.use('/rooms', roomRoutes);

// Message Reactions, Deletions, and Reporting endpoints
router.use('/messages', messageRoutes);

// In-app Notifications endpoints
router.use('/notifications', notificationRoutes);

// Announcements endpoints
router.use('/announcements', announcementRoutes);

// Community Polls endpoints
router.use('/polls', pollRoutes);

// Admin Moderation endpoints
router.use('/admin', adminRoutes);

export default router;

