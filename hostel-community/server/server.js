import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket/chat.socket.js';
import { seedInitialRooms } from './services/room.service.js';
import { migrateIdentities } from './utils/identityMigration.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
initSocket(server);

// Initialize database, seed rooms, and start listening
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Idempotently seed the four community rooms (Global, 2nd, 3rd, 4th Year)
    await seedInitialRooms();

    // Idempotently ensure unique identity integrity and database index synchronization
    await migrateIdentities();

    server.listen(PORT, () => {
      logger.info('====================================================');
      logger.info('  Prof. S.N. Bose Boys Hostel - Backend Server');
      logger.info(`  Mode: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`  Server URL: http://localhost:${PORT}`);
      logger.info(`  Health Endpoint: http://localhost:${PORT}/api/health`);
      logger.info('  Socket.IO: Active & Authenticated via JWT');
      logger.info('====================================================');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const handleGracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();
