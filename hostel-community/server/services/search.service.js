import Message from '../models/Message.js';
import Room from '../models/Room.js';
import Announcement from '../models/Announcement.js';
import Poll from '../models/Poll.js';
import { getAccessibleRooms, getRoomById } from './room.service.js';

/**
 * Escapes characters with special meaning in regular expressions
 * to prevent ReDoS and regex syntax errors.
 */
export const escapeRegex = (string = '') => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Builds a regex supporting case-insensitive partial keyword and multi-word matching.
 */
export const buildSearchRegex = (query = '') => {
  const words = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(escapeRegex);

  if (words.length === 0) return null;
  if (words.length === 1) {
    return new RegExp(words[0], 'i');
  }

  // Lookahead for each word anywhere in the string to support out-of-order multi-word queries
  const lookaheads = words.map((w) => `(?=.*${w})`).join('');
  return new RegExp(`^${lookaheads}.*$`, 'i');
};

/**
 * Resolves the authorized rooms for the user, optionally scoping to a specific room.
 * Throws 403 / 404 if the requested roomId is not authorized for the user.
 */
export const resolveAuthorizedRooms = async (user, requestedRoomId = null) => {
  const accessible = await getAccessibleRooms(user);
  const roomMap = new Map();
  for (const r of accessible) {
    roomMap.set(r._id.toString(), r);
  }

  if (requestedRoomId) {
    const specificRoom = await getRoomById(requestedRoomId, user);
    return {
      authorizedRoomIds: [specificRoom._id],
      roomMap: new Map([[specificRoom._id.toString(), specificRoom]]),
    };
  }

  return {
    authorizedRoomIds: accessible.map((r) => r._id),
    roomMap,
  };
};

/**
 * Format message into privacy-safe search result.
 * STRICT PRIVACY: NEVER exposes email, fullName, password, internal user IDs, storedName, or server filesystem paths.
 */
export const formatSearchMessage = (msg, roomMap) => {
  const roomDoc = roomMap.get(msg.room?.toString?.() || String(msg.room)) || msg.room || {};
  return {
    id: msg._id.toString(),
    content: msg.content || '',
    room: {
      id: roomDoc._id ? roomDoc._id.toString() : String(roomDoc),
      name: roomDoc.name || 'Community Room',
      slug: roomDoc.slug || '',
      type: roomDoc.type || 'global',
      allowedYear: roomDoc.allowedYear || null,
      icon: roomDoc.icon || 'Globe',
    },
    sender: {
      anonymousName: msg.anonymousName || 'Anonymous Student',
      anonymousAvatar: msg.anonymousAvatar || '🎭',
      year: msg.senderYear || 'Hostel Resident',
    },
    hasAttachment: Boolean(msg.attachment && (msg.attachment.originalName || msg.attachment.url)),
    attachment:
      msg.attachment && (msg.attachment.originalName || msg.attachment.url)
        ? {
            originalName: msg.attachment.originalName || 'Attachment',
            mimeType: msg.attachment.mimeType || 'application/octet-stream',
            size: msg.attachment.size || 0,
            url: msg.attachment.url || `/api/messages/${msg._id}/attachment`,
          }
        : null,
    createdAt: msg.createdAt,
  };
};

/**
 * Format room into safe search result.
 */
export const formatSearchRoom = (room) => {
  return {
    id: room._id.toString(),
    name: room.name,
    slug: room.slug,
    description: room.description,
    type: room.type,
    allowedYear: room.allowedYear,
    icon: room.icon || 'Globe',
  };
};

/**
 * Format announcement into privacy-safe search result.
 */
export const formatSearchAnnouncement = (announcement, roomMap) => {
  const targetId = announcement.targetRoom?._id
    ? announcement.targetRoom._id.toString()
    : announcement.targetRoom?.toString?.() || String(announcement.targetRoom);
  const roomDoc = roomMap.get(targetId) || announcement.targetRoom || {};

  return {
    id: announcement._id.toString(),
    title: announcement.title,
    content: announcement.content,
    priority: announcement.priority,
    isPinned: Boolean(announcement.isPinned),
    author: 'Hostel Administration',
    room: {
      id: roomDoc._id ? roomDoc._id.toString() : String(roomDoc),
      name: roomDoc.name || 'Community Room',
      slug: roomDoc.slug || '',
      type: roomDoc.type || 'global',
      allowedYear: roomDoc.allowedYear || null,
    },
    createdAt: announcement.createdAt,
  };
};

/**
 * Format poll into privacy-safe search result.
 */
export const formatSearchPoll = (poll, roomMap) => {
  const targetId = poll.room?._id
    ? poll.room._id.toString()
    : poll.room?.toString?.() || String(poll.room);
  const roomDoc = roomMap.get(targetId) || poll.room || {};

  const totalVotes = Array.isArray(poll.options)
    ? poll.options.reduce((sum, o) => sum + (o.votes || 0), 0)
    : 0;

  const isExpired = Boolean(poll.expiresAt && new Date(poll.expiresAt) <= new Date());
  const isClosed = Boolean(poll.isClosed) || isExpired;

  return {
    id: poll._id.toString(),
    question: poll.question,
    room: {
      id: roomDoc._id ? roomDoc._id.toString() : String(roomDoc),
      name: roomDoc.name || 'Community Room',
      slug: roomDoc.slug || '',
      type: roomDoc.type || 'global',
      allowedYear: roomDoc.allowedYear || null,
    },
    totalVotes,
    optionsCount: Array.isArray(poll.options) ? poll.options.length : 0,
    options: Array.isArray(poll.options)
      ? poll.options.map((o) => ({ id: o._id.toString(), text: o.text, votes: o.votes || 0 }))
      : [],
    isClosed,
    expiresAt: poll.expiresAt || null,
    createdAt: poll.createdAt,
  };
};

/**
 * Search messages with keyword, authorization, pagination, and privacy sanitization.
 */
export const searchMessages = async ({
  user,
  query = '',
  roomId = null,
  page = 1,
  limit = 20,
}) => {
  const { authorizedRoomIds, roomMap } = await resolveAuthorizedRooms(user, roomId);

  if (!query || query.trim() === '') {
    return {
      messages: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const regex = buildSearchRegex(query);
  if (!regex) {
    return {
      messages: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }

  const filter = {
    room: { $in: authorizedRoomIds },
    isDeleted: { $ne: true },
    $or: [
      { content: { $regex: regex } },
      { 'attachment.originalName': { $regex: regex } },
    ],
  };

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, rawMessages] = await Promise.all([
    Message.countDocuments(filter),
    Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / parsedLimit);

  return {
    messages: rawMessages.map((msg) => formatSearchMessage(msg, roomMap)),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Discover rooms authorized to the requesting user matching the search query.
 */
export const searchRooms = async ({ user, query = '', page = 1, limit = 20 }) => {
  const accessible = await getAccessibleRooms(user);

  let filteredRooms = accessible;
  if (query && query.trim() !== '') {
    const trimmed = query.trim().toLowerCase();
    filteredRooms = accessible.filter((r) => {
      const matchName = (r.name || '').toLowerCase().includes(trimmed);
      const matchDesc = (r.description || '').toLowerCase().includes(trimmed);
      const matchSlug = (r.slug || '').toLowerCase().includes(trimmed);
      const matchYear = (r.allowedYear || '').toLowerCase().includes(trimmed);
      return matchName || matchDesc || matchSlug || matchYear;
    });
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const total = filteredRooms.length;
  const paginated = filteredRooms.slice(skip, skip + parsedLimit);
  const totalPages = Math.ceil(total / parsedLimit);

  return {
    rooms: paginated.map(formatSearchRoom),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Search announcements across authorized rooms.
 */
export const searchAnnouncements = async ({
  user,
  query = '',
  roomId = null,
  page = 1,
  limit = 20,
}) => {
  const { authorizedRoomIds, roomMap } = await resolveAuthorizedRooms(user, roomId);

  const now = new Date();
  const notExpiredQuery = {
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };

  const filter = {
    targetRoom: { $in: authorizedRoomIds },
    ...notExpiredQuery,
  };

  if (query && query.trim() !== '') {
    const regex = buildSearchRegex(query);
    if (regex) {
      filter.$or = [{ title: { $regex: regex } }, { content: { $regex: regex } }];
    }
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, rawAnnouncements] = await Promise.all([
    Announcement.countDocuments(filter),
    Announcement.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / parsedLimit);

  return {
    announcements: rawAnnouncements.map((a) => formatSearchAnnouncement(a, roomMap)),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Search polls across authorized rooms.
 */
export const searchPolls = async ({
  user,
  query = '',
  roomId = null,
  page = 1,
  limit = 20,
}) => {
  const { authorizedRoomIds, roomMap } = await resolveAuthorizedRooms(user, roomId);

  const filter = {
    room: { $in: authorizedRoomIds },
  };

  if (query && query.trim() !== '') {
    const regex = buildSearchRegex(query);
    if (regex) {
      filter.$or = [{ question: { $regex: regex } }, { 'options.text': { $regex: regex } }];
    }
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, rawPolls] = await Promise.all([
    Poll.countDocuments(filter),
    Poll.find(filter)
      .sort({ isClosed: 1, createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .lean(),
  ]);

  const totalPages = Math.ceil(total / parsedLimit);

  return {
    polls: rawPolls.map((p) => formatSearchPoll(p, roomMap)),
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages,
      hasNextPage: parsedPage < totalPages,
      hasPrevPage: parsedPage > 1,
    },
  };
};

/**
 * Unified Global Search Handler
 * Supports types: 'all', 'messages', 'rooms', 'announcements', 'polls'.
 */
export const globalSearch = async ({
  user,
  query = '',
  type = 'all',
  roomId = null,
  page = 1,
  limit = 20,
}) => {
  const normalizedType = (type || 'all').toLowerCase().trim();

  // If specific category requested, return paginated results for that category
  if (normalizedType === 'messages') {
    const result = await searchMessages({ user, query, roomId, page, limit });
    return {
      query,
      type: 'messages',
      results: result.messages,
      pagination: result.pagination,
    };
  }

  if (normalizedType === 'rooms') {
    const result = await searchRooms({ user, query, page, limit });
    return {
      query,
      type: 'rooms',
      results: result.rooms,
      pagination: result.pagination,
    };
  }

  if (normalizedType === 'announcements') {
    const result = await searchAnnouncements({ user, query, roomId, page, limit });
    return {
      query,
      type: 'announcements',
      results: result.announcements,
      pagination: result.pagination,
    };
  }

  if (normalizedType === 'polls') {
    const result = await searchPolls({ user, query, roomId, page, limit });
    return {
      query,
      type: 'polls',
      results: result.polls,
      pagination: result.pagination,
    };
  }

  // Type === 'all': Return aggregate results across all 4 categories with reasonable limits
  const [messagesData, roomsData, announcementsData, pollsData] = await Promise.all([
    searchMessages({ user, query, roomId, page: 1, limit: 10 }),
    searchRooms({ user, query, page: 1, limit: 10 }),
    searchAnnouncements({ user, query, roomId, page: 1, limit: 5 }),
    searchPolls({ user, query, roomId, page: 1, limit: 5 }),
  ]);

  const totalMatches =
    messagesData.pagination.total +
    roomsData.pagination.total +
    announcementsData.pagination.total +
    pollsData.pagination.total;

  return {
    query,
    type: 'all',
    total: totalMatches,
    counts: {
      messages: messagesData.pagination.total,
      rooms: roomsData.pagination.total,
      announcements: announcementsData.pagination.total,
      polls: pollsData.pagination.total,
    },
    results: {
      messages: messagesData.messages,
      rooms: roomsData.rooms,
      announcements: announcementsData.announcements,
      polls: pollsData.polls,
    },
  };
};

export default {
  escapeRegex,
  buildSearchRegex,
  resolveAuthorizedRooms,
  formatSearchMessage,
  formatSearchRoom,
  formatSearchAnnouncement,
  formatSearchPoll,
  searchMessages,
  searchRooms,
  searchAnnouncements,
  searchPolls,
  globalSearch,
};
