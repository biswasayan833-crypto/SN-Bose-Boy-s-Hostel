import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { migrateIdentities } from '../utils/identityMigration.js';
import { logger } from '../utils/logger.js';

dotenv.config();

const runMigration = async () => {
  try {
    logger.info('====================================================');
    logger.info('  Prof. S.N. Bose Hostel - Anonymous Identity Migration');
    logger.info('====================================================');

    await connectDB();
    const result = await migrateIdentities();

    logger.info('Migration summary:');
    logger.info(`  Total users scanned: ${result.totalUsers}`);
    logger.info(`  Keys updated/set: ${result.updatedKeys}`);
    logger.info(`  Duplicates resolved: ${result.resolvedDuplicates}`);
    logger.info('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
};

runMigration();
