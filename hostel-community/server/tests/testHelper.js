import dotenv from 'dotenv';
import http from 'http';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

dotenv.config();

import app from '../app.js';
import { initSocket } from '../socket/chat.socket.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Report from '../models/Report.js';
import Notification from '../models/Notification.js';
import RoomReadState from '../models/RoomReadState.js';
import Announcement from '../models/Announcement.js';
import Poll from '../models/Poll.js';
import PollVote from '../models/PollVote.js';
import { seedInitialRooms } from '../services/room.service.js';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/sn_bose_test';
const JWT_SECRET = process.env.JWT_SECRET || 'sn_bose_hostel_super_secure_jwt_secret_key_2026_dev';

let serverInstance = null;
let baseUrl = '';

export const setupTestEnvironment = async () => {
  // Connect to test database if not already connected
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }

  // Clear test collections
  await User.deleteMany({});
  await Message.deleteMany({});
  await Report.deleteMany({});
  await Room.deleteMany({});
  await Notification.deleteMany({});
  await RoomReadState.deleteMany({});

  // Seed rooms
  await seedInitialRooms();

  // Create test students with unique emails to avoid parallel run collisions
  const uid = Math.random().toString(36).substring(2, 7);
  const student2 = await User.create({
    fullName: 'Second Year Student',
    email: `second_${uid}@snbose.edu`,
    password: 'Password123!',
    year: '2nd Year',
    anonymousName: 'MysticFalcon',
    anonymousAvatar: '🦅',
    role: 'student',
  });

  const student3 = await User.create({
    fullName: 'Third Year Student',
    email: `third_${uid}@snbose.edu`,
    password: 'Password123!',
    year: '3rd Year',
    anonymousName: 'ShadowTiger',
    anonymousAvatar: '🐅',
    role: 'student',
  });

  const admin = await User.create({
    fullName: 'Hostel Warden Admin',
    email: `admin_${uid}@snbose.edu`,
    password: 'Password123!',
    year: '4th Year',
    anonymousName: 'HostelWarden',
    anonymousAvatar: '🛡️',
    role: 'admin',
  });


  // Generate tokens
  const student2Token = jwt.sign({ id: student2._id }, JWT_SECRET, { expiresIn: '1d' });
  const student3Token = jwt.sign({ id: student3._id }, JWT_SECRET, { expiresIn: '1d' });
  const adminToken = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '1d' });

  // Start HTTP server on random port
  if (!serverInstance) {
    serverInstance = http.createServer(app);
    initSocket(serverInstance);

    await new Promise((resolve) => {
      serverInstance.listen(0, () => {
        const port = serverInstance.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  }

  // Find rooms
  const globalRoom = await Room.findOne({ slug: 'global-room' });
  const secondYearRoom = await Room.findOne({ slug: '2nd-year' });
  const thirdYearRoom = await Room.findOne({ slug: '3rd-year' });

  return {
    baseUrl,
    student2,
    student3,
    admin,
    student2Token,
    student3Token,
    adminToken,
    globalRoom,
    secondYearRoom,
    thirdYearRoom,
    server: serverInstance,
  };
};

export const teardownTestEnvironment = async () => {
  if (mongoose.connection.readyState !== 0) {
    await User.deleteMany({});
    await Message.deleteMany({});
    await Report.deleteMany({});
    await Room.deleteMany({});
    await Notification.deleteMany({});
    await RoomReadState.deleteMany({});
    await Announcement.deleteMany({});
    await Poll.deleteMany({});
    await PollVote.deleteMany({});
    await mongoose.disconnect();
  }

  if (serverInstance) {
    await new Promise((resolve) => serverInstance.close(resolve));
    serverInstance = null;
  }
};
