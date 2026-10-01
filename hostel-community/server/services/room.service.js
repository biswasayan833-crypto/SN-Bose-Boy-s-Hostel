import Room from '../models/Room.js';
import Message from '../models/Message.js';
import RoomReadState from '../models/RoomReadState.js';
import { logger } from '../utils/logger.js';

/**
 * Predefined 4 rooms strictly conforming to the hostel's academic structure:
 * - Global Room (All residents)
 * - 2nd Year (2nd Year residents only)
 * - 3rd Year (3rd Year residents only)
 * - 4th Year (4th Year residents only)
 * NOTE: There is NO 1st Year in this hostel.
 */
export const INITIAL_ROOMS = [
  {
    name: 'Global Room',
    slug: 'global-room',
    description: 'The central town square for all residents of Prof. S.N. Bose Boys Hostel.',
    type: 'global',
    allowedYear: null,
    icon: 'Globe',
    isActive: true,
  },
  {
    name: '2nd Year',
    slug: '2nd-year',
    description: 'Dedicated community channel for 2nd Year residents.',
    type: 'year',
    allowedYear: '2nd Year',
    icon: 'GraduationCap',
    isActive: true,
  },
  {
    name: '3rd Year',
    slug: '3rd-year',
    description: 'Dedicated community channel for 3rd Year residents.',
    type: 'year',
    allowedYear: '3rd Year',
    icon: 'GraduationCap',
    isActive: true,
  },
  {
    name: '4th Year',
    slug: '4th-year',
    description: 'Dedicated community channel for 4th Year residents.',
    type: 'year',
    allowedYear: '4th Year',
    icon: 'GraduationCap',
    isActive: true,
  },
];

/**
 * Idempotently seed the four allowed community rooms.
 * Running this multiple times will never duplicate rooms.
 */
export const seedInitialRooms = async () => {
  try {
    for (const roomData of INITIAL_ROOMS) {
      await Room.findOneAndUpdate(
        { slug: roomData.slug },
        { $set: roomData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    logger.info('[Rooms] Initialized 4 community rooms (Global, 2nd Year, 3rd Year, 4th Year)');
  } catch (error) {
    logger.error('[Rooms] Failed to seed initial rooms:', error.message);
  }
};

/**
 * Get all rooms accessible to the authenticated user.
 * A 2nd Year student receives Global + 2nd Year.
 * Inaccessible year rooms are NOT returned.
 */
export const getAccessibleRooms = async (user) => {
  if (!user || !user.isActive) {
    return [];
  }

  const query = {
    isActive: true,
    $or: [{ type: 'global' }, { allowedYear: user.year }],
  };

  const rooms = await Room.find(query).sort({ type: 1, name: 1 });
  return rooms;
};

/**
 * Get room by slug and enforce backend authorization
 */
export const getRoomBySlug = async (slug, user) => {
  const room = await Room.findOne({ slug: slug.toLowerCase(), isActive: true });
  if (!room) {
    const error = new Error(`Room '${slug}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (!room.isUserAuthorized(user)) {
    const error = new Error(
      `Access denied: You are in ${user.year}, which cannot access the ${room.name} room.`
    );
    error.statusCode = 403;
    throw error;
  }

  return room;
};

/**
 * Get room by ID and enforce backend authorization
 */
export const getRoomById = async (roomId, user) => {
  const room = await Room.findOne({ _id: roomId, isActive: true });
  if (!room) {
    const error = new Error('Room not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!room.isUserAuthorized(user)) {
    const error = new Error(
      `Access denied: You are in ${user.year}, which cannot access the ${room.name} room.`
    );
    error.statusCode = 403;
    throw error;
  }

  return room;
};

/**
 * Calculate unread message counts for all rooms accessible to the authenticated user.
 * Excludes:
 * - messages sent by the user themselves
 * - soft-deleted messages
 * - inaccessible year rooms (a 2nd Year student NEVER gets 3rd or 4th Year data)
 */
export const getUnreadCountsForUser = async (user) => {
  const accessibleRooms = await getAccessibleRooms(user);
  const unreadMap = {};
  const countsByRoomName = {};

  for (const room of accessibleRooms) {
    const readState = await RoomReadState.findOne({
      user: user._id,
      room: room._id,
    });

    const lastReadAt = readState?.lastReadAt || new Date(0);

    const count = await Message.countDocuments({
      room: room._id,
      sender: { $ne: user._id },
      isDeleted: { $ne: true },
      createdAt: { $gt: lastReadAt },
    });

    unreadMap[room._id.toString()] = count;
    unreadMap[room.slug] = count;
    unreadMap[room.name] = count;
    countsByRoomName[room.name] = count;
  }

  return {
    unread: unreadMap,
    ...countsByRoomName,
  };
};

/**
 * Mark a room as actively read by the authenticated user.
 * Enforces room authorization.
 */
export const markRoomAsRead = async ({ roomIdOrSlug, user }) => {
  if (!roomIdOrSlug) {
    const error = new Error('Room identifier is required.');
    error.statusCode = 400;
    throw error;
  }

  let room;
  if (roomIdOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
    room = await Room.findById(roomIdOrSlug);
  } else {
    room = await Room.findOne({ slug: roomIdOrSlug.toLowerCase(), isActive: true });
  }

  if (!room) {
    const error = new Error(`Room '${roomIdOrSlug}' not found.`);
    error.statusCode = 404;
    throw error;
  }

  if (!room.isUserAuthorized(user)) {
    const error = new Error(
      `Access denied: You are in ${user.year}, which cannot access the ${room.name} room.`
    );
    error.statusCode = 403;
    throw error;
  }

  const now = new Date();
  await RoomReadState.findOneAndUpdate(
    { user: user._id, room: room._id },
    { $set: { lastReadAt: now } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return {
    roomId: room._id.toString(),
    slug: room.slug,
    name: room.name,
    lastReadAt: now,
    unreadCount: 0,
  };
};

export default {
  INITIAL_ROOMS,
  seedInitialRooms,
  getAccessibleRooms,
  getRoomBySlug,
  getRoomById,
  getUnreadCountsForUser,
  markRoomAsRead,
};
