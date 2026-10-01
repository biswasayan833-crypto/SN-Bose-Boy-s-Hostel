import { Router } from 'express';
import { getReports, patchReport } from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// All admin routes require valid authentication and administrator role
router.use(requireAuth);
router.use(requireAdmin);

// Reports management
router.get('/reports', getReports);
router.patch('/reports/:reportId', patchReport);

export default router;
