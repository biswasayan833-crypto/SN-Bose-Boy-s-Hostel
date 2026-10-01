import mongoose from 'mongoose';

/**
 * Connect to MongoDB with resilient fallback logging.
 * Does not terminate process on initial connection failure to allow
 * offline UI preview and health checking during initial development stages.
 */
export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sn_bose_hostel';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB (${mongoURI}): ${error.message}`);
    console.warn('[Database Warning] Server running in offline-DB mode. Health endpoint and UI preview remain functional.');
    return null;
  }
};

/**
 * Helper to get human-readable connection status for health check
 */
export const getDatabaseStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  return {
    state: states[readyState] || 'unknown',
    isOnline: readyState === 1,
  };
};

export default connectDB;
