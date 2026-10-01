import Poll from '../models/Poll.js';
import PollVote from '../models/PollVote.js';
import Room from '../models/Room.js';
import { getRoomById, getAccessibleRooms } from './room.service.js';
import { getIO } from '../socket/chat.socket.js';
import { logger } from '../utils/logger.js';

/**
 * Retrieve polls accessible to the requesting user for authorized rooms.
 */
export const getPolls = async (user, { roomId } = {}) => {
  let roomFilter = {};

  if (roomId) {
    await getRoomById(roomId, user);
    roomFilter = { room: roomId };
  } else {
    const accessible = await getAccessibleRooms(user);
    const roomIds = accessible.map((r) => r._id);
    roomFilter = { room: { $in: roomIds } };
  }

  const polls = await Poll.find(roomFilter)
    .populate('room', 'name slug type allowedYear icon')
    .sort({ isClosed: 1, createdAt: -1 });

  // Find user's existing votes to annotate hasVoted / userVotedOptionId
  const pollIds = polls.map((p) => p._id);
  const userVotes = await PollVote.find({
    poll: { $in: pollIds },
    user: user._id,
  });

  const voteMap = {};
  for (const v of userVotes) {
    voteMap[v.poll.toString()] = v.option.toString();
  }

  return polls.map((p) => p.toSafeObject(voteMap[p._id.toString()] || null));
};

/**
 * Retrieve single poll by ID with room authorization check.
 */
export const getPollById = async (pollId, user) => {
  const poll = await Poll.findById(pollId).populate('room', 'name slug type allowedYear icon');

  if (!poll) {
    const error = new Error('Poll not found.');
    error.statusCode = 404;
    throw error;
  }

  await getRoomById(poll.room._id, user);

  const userVote = await PollVote.findOne({ poll: poll._id, user: user._id });
  return poll.toSafeObject(userVote ? userVote.option.toString() : null);
};

/**
 * Admin: Create a new community poll.
 */
export const createPoll = async (
  adminUser,
  { question, options, room: roomId, expiresAt = null, allowVoteChange = false }
) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  if (!question || typeof question !== 'string' || question.trim().length < 3) {
    const error = new Error('Poll question is required and must contain at least 3 characters.');
    error.statusCode = 400;
    throw error;
  }

  const trimmedQuestion = question.trim();
  if (trimmedQuestion.length > 300) {
    const error = new Error('Poll question cannot exceed 300 characters.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 6) {
    const error = new Error('Poll must contain between 2 and 6 options.');
    error.statusCode = 400;
    throw error;
  }

  const cleanOptions = [];
  const seenTexts = new Set();

  for (const opt of options) {
    const text = typeof opt === 'string' ? opt.trim() : (opt?.text || '').trim();
    if (!text || text.length === 0) {
      const error = new Error('Poll options cannot be empty.');
      error.statusCode = 400;
      throw error;
    }
    if (text.length > 100) {
      const error = new Error('Each poll option cannot exceed 100 characters.');
      error.statusCode = 400;
      throw error;
    }

    const lower = text.toLowerCase();
    if (seenTexts.has(lower)) {
      const error = new Error(`Duplicate option '${text}' is not allowed.`);
      error.statusCode = 400;
      throw error;
    }
    seenTexts.add(lower);

    cleanOptions.push({ text, votes: 0 });
  }

  if (!roomId) {
    const error = new Error('Target room is required for poll creation.');
    error.statusCode = 400;
    throw error;
  }

  const room = await Room.findById(roomId);
  if (!room || !room.isActive) {
    const error = new Error('Target room does not exist or is inactive.');
    error.statusCode = 404;
    throw error;
  }

  let parsedExpiresAt = null;
  if (expiresAt) {
    parsedExpiresAt = new Date(expiresAt);
    if (isNaN(parsedExpiresAt.getTime())) {
      const error = new Error('Invalid expiration date format.');
      error.statusCode = 400;
      throw error;
    }
    if (parsedExpiresAt <= new Date()) {
      const error = new Error('Expiration date must be in the future.');
      error.statusCode = 400;
      throw error;
    }
  }

  const poll = new Poll({
    question: trimmedQuestion,
    options: cleanOptions,
    createdBy: adminUser._id,
    room: room._id,
    expiresAt: parsedExpiresAt,
    allowVoteChange: Boolean(allowVoteChange),
    isClosed: false,
  });

  await poll.save();
  await poll.populate('room', 'name slug type allowedYear icon');

  const safePoll = poll.toSafeObject(null);

  // Socket.IO emission to room
  try {
    const io = getIO();
    if (io) {
      io.to(room._id.toString()).emit('poll:new', safePoll);
      if (room.type === 'global') {
        io.emit('poll:new', safePoll);
      } else if (room.allowedYear) {
        io.to(`year:${room.allowedYear}`).emit('poll:new', safePoll);
      }
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit poll:new: ${err.message}`);
  }

  return safePoll;
};

/**
 * Cast or change vote in a poll.
 * Enforces room authorization, 1 vote per user, checks if closed/expired,
 * and respects allowVoteChange.
 */
export const votePoll = async (pollId, user, { optionId }) => {
  if (!optionId) {
    const error = new Error('optionId is required to vote.');
    error.statusCode = 400;
    throw error;
  }

  const poll = await Poll.findById(pollId).populate('room', 'name slug type allowedYear icon');
  if (!poll) {
    const error = new Error('Poll not found.');
    error.statusCode = 404;
    throw error;
  }

  // Enforce room authorization
  await getRoomById(poll.room._id, user);

  // Check if closed or expired
  const isExpired = poll.expiresAt && new Date(poll.expiresAt) <= new Date();
  if (poll.isClosed || isExpired) {
    const error = new Error('This poll is closed and no longer accepting votes.');
    error.statusCode = 400;
    throw error;
  }

  // Find target option
  const targetOption = poll.options.id(optionId);
  if (!targetOption) {
    const error = new Error('Selected option does not exist in this poll.');
    error.statusCode = 400;
    throw error;
  }

  // Check existing vote
  const existingVote = await PollVote.findOne({ poll: poll._id, user: user._id });

  if (existingVote) {
    if (!poll.allowVoteChange) {
      const error = new Error('Vote changes are not allowed for this poll.');
      error.statusCode = 400;
      throw error;
    }

    if (existingVote.option.toString() === optionId.toString()) {
      const error = new Error('You have already voted for this option.');
      error.statusCode = 400;
      throw error;
    }

    // Decrement previous option count
    const oldOption = poll.options.id(existingVote.option);
    if (oldOption && oldOption.votes > 0) {
      oldOption.votes -= 1;
    }

    // Increment new option count
    targetOption.votes += 1;

    existingVote.option = targetOption._id;
    await existingVote.save();
  } else {
    // New vote
    targetOption.votes += 1;
    await PollVote.create({
      poll: poll._id,
      user: user._id,
      option: targetOption._id,
    });
  }

  await poll.save();

  const safePollForCaller = poll.toSafeObject(targetOption._id.toString());
  const safePollForBroadcast = poll.toSafeObject(null);

  // Emit real-time poll update to room (without voter identity)
  try {
    const io = getIO();
    if (io) {
      io.to(poll.room._id.toString()).emit('poll:updated', safePollForBroadcast);
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit poll:updated: ${err.message}`);
  }

  return safePollForCaller;
};

/**
 * Retract vote if allowVoteChange is enabled.
 */
export const retractVote = async (pollId, user) => {
  const poll = await Poll.findById(pollId).populate('room', 'name slug type allowedYear icon');
  if (!poll) {
    const error = new Error('Poll not found.');
    error.statusCode = 404;
    throw error;
  }

  await getRoomById(poll.room._id, user);

  const isExpired = poll.expiresAt && new Date(poll.expiresAt) <= new Date();
  if (poll.isClosed || isExpired) {
    const error = new Error('This poll is closed.');
    error.statusCode = 400;
    throw error;
  }

  if (!poll.allowVoteChange) {
    const error = new Error('Vote retraction is not allowed for this poll.');
    error.statusCode = 400;
    throw error;
  }

  const existingVote = await PollVote.findOne({ poll: poll._id, user: user._id });
  if (!existingVote) {
    const error = new Error('You have not voted in this poll.');
    error.statusCode = 404;
    throw error;
  }

  const opt = poll.options.id(existingVote.option);
  if (opt && opt.votes > 0) {
    opt.votes -= 1;
  }

  await PollVote.deleteOne({ _id: existingVote._id });
  await poll.save();

  const safePoll = poll.toSafeObject(null);

  try {
    const io = getIO();
    if (io) {
      io.to(poll.room._id.toString()).emit('poll:updated', safePoll);
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit poll:updated: ${err.message}`);
  }

  return safePoll;
};

/**
 * Admin: Close poll manually.
 */
export const closePoll = async (adminUser, pollId) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  const poll = await Poll.findById(pollId).populate('room', 'name slug type allowedYear icon');
  if (!poll) {
    const error = new Error('Poll not found.');
    error.statusCode = 404;
    throw error;
  }

  poll.isClosed = true;
  await poll.save();

  const safePoll = poll.toSafeObject(null);

  try {
    const io = getIO();
    if (io) {
      io.to(poll.room._id.toString()).emit('poll:closed', safePoll);
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit poll:closed: ${err.message}`);
  }

  return safePoll;
};

/**
 * Admin: Delete poll.
 */
export const deletePoll = async (adminUser, pollId) => {
  if (adminUser.role !== 'admin') {
    const error = new Error('Access denied: Administrator privileges required.');
    error.statusCode = 403;
    throw error;
  }

  const poll = await Poll.findById(pollId);
  if (!poll) {
    const error = new Error('Poll not found.');
    error.statusCode = 404;
    throw error;
  }

  const roomIdStr = poll.room.toString();
  await PollVote.deleteMany({ poll: poll._id });
  await Poll.deleteOne({ _id: poll._id });

  try {
    const io = getIO();
    if (io) {
      io.to(roomIdStr).emit('poll:deleted', { id: pollId, room: roomIdStr });
    }
  } catch (err) {
    logger.debug(`[Socket] Could not emit poll:deleted: ${err.message}`);
  }

  return { success: true, message: 'Poll deleted successfully.' };
};

export default {
  getPolls,
  getPollById,
  createPoll,
  votePoll,
  retractVote,
  closePoll,
  deletePoll,
};
