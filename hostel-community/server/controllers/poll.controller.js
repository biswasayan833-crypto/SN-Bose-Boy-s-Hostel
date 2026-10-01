import {
  getPolls,
  getPollById,
  createPoll,
  votePoll,
  retractVote,
  closePoll,
  deletePoll,
} from '../services/poll.service.js';
import { successResponse, errorResponse } from '../utils/responseHelper.js';

/**
 * GET /api/polls
 * Retrieve polls for authorized rooms.
 */
export const getPollsHandler = async (req, res) => {
  try {
    const { roomId } = req.query;
    const polls = await getPolls(req.user, { roomId });
    return successResponse(res, 'Polls retrieved successfully.', { polls });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve polls.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * GET /api/polls/:pollId
 * Retrieve specific poll by ID.
 */
export const getPollByIdHandler = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await getPollById(pollId, req.user);
    return successResponse(res, 'Poll retrieved successfully.', { poll });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retrieve poll.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * POST /api/polls
 * Admin creates a new poll.
 */
export const createPollHandler = async (req, res) => {
  try {
    const { question, options, room, expiresAt, allowVoteChange } = req.body;
    const poll = await createPoll(req.user, {
      question,
      options,
      room,
      expiresAt,
      allowVoteChange,
    });
    return successResponse(res, 'Poll created successfully.', { poll }, 201);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to create poll.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * POST /api/polls/:pollId/vote
 * Cast or change vote on a poll.
 */
export const votePollHandler = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { optionId } = req.body;
    const poll = await votePoll(pollId, req.user, { optionId });
    return successResponse(res, 'Vote recorded successfully.', { poll });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to record vote.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * DELETE /api/polls/:pollId/vote
 * Retract vote on a poll if vote change is allowed.
 */
export const retractVoteHandler = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await retractVote(pollId, req.user);
    return successResponse(res, 'Vote retracted successfully.', { poll });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to retract vote.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * PATCH /api/polls/:pollId/close
 * Admin closes poll.
 */
export const closePollHandler = async (req, res) => {
  try {
    const { pollId } = req.params;
    const poll = await closePoll(req.user, pollId);
    return successResponse(res, 'Poll closed successfully.', { poll });
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to close poll.',
      null,
      error.statusCode || 500
    );
  }
};

/**
 * DELETE /api/polls/:pollId
 * Admin deletes poll.
 */
export const deletePollHandler = async (req, res) => {
  try {
    const { pollId } = req.params;
    const result = await deletePoll(req.user, pollId);
    return successResponse(res, result.message, null);
  } catch (error) {
    return errorResponse(
      res,
      error.message || 'Failed to delete poll.',
      null,
      error.statusCode || 500
    );
  }
};
