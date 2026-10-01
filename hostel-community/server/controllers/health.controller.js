import { getDatabaseStatus } from '../config/db.js';
import { successResponse } from '../utils/responseHelper.js';

/**
 * Health check controller
 * Returns service status, database connectivity, and uptime.
 */
export const checkHealth = (req, res) => {
  const dbStatus = getDatabaseStatus();

  const healthData = {
    service: 'Prof. S.N. Bose Boys Hostel Community API',
    status: 'healthy',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.state,
      isOnline: dbStatus.isOnline,
    },
    environment: process.env.NODE_ENV || 'development',
    serverTime: new Date().toISOString(),
  };

  return successResponse(res, 'Backend service is online and operating smoothly', healthData);
};
