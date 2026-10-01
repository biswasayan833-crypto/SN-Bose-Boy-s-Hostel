import Report, { ALLOWED_REPORT_REASONS, ALLOWED_REPORT_STATUSES } from '../models/Report.js';
import Message from '../models/Message.js';
import { getRoomById } from './room.service.js';
import { deleteMessage, formatSafeMessage } from './message.service.js';

export { ALLOWED_REPORT_REASONS, ALLOWED_REPORT_STATUSES };

/**
 * Format report into a safe community response.
 * Guarantees that neither reporter's nor sender's real fullName or email are exposed.
 */
export const formatSafeReport = (report) => {
  const reportedBy = report.reportedBy || {};
  const messageDoc = report.message || {};
  const sender = messageDoc.sender || {};
  const room = messageDoc.room || {};

  return {
    id: report._id.toString(),
    reason: report.reason,
    status: report.status,
    notes: report.notes || '',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    reportedBy: {
      id: reportedBy._id ? reportedBy._id.toString() : reportedBy.id || String(reportedBy),
      anonymousName: reportedBy.anonymousName || 'Anonymous Student',
      anonymousAvatar: reportedBy.anonymousAvatar || '🎭',
      year: reportedBy.year || 'Hostel Resident',
    },
    message: {
      id: messageDoc._id ? messageDoc._id.toString() : messageDoc.id || String(messageDoc),
      content: messageDoc.isDeleted ? 'Message deleted' : messageDoc.content || '',
      isDeleted: Boolean(messageDoc.isDeleted),
      deletedAt: messageDoc.deletedAt || null,
      createdAt: messageDoc.createdAt,
      room: {
        id: room._id ? room._id.toString() : room.id || String(room),
        name: room.name || 'Unknown Room',
        slug: room.slug || '',
      },
      sender: {
        id: sender._id ? sender._id.toString() : sender.id || String(sender),
        anonymousName: sender.anonymousName || 'Anonymous Student',
        anonymousAvatar: sender.anonymousAvatar || '🎭',
        year: sender.year || 'Hostel Resident',
      },
    },
  };
};

/**
 * Create a new report for an inappropriate message.
 * Enforces authenticated user, valid reason, room access, and duplicate report prevention.
 */
export const createReport = async ({ messageId, user, reason, notes = '' }) => {
  if (!reason || !ALLOWED_REPORT_REASONS.includes(reason.toLowerCase())) {
    const error = new Error(
      `Invalid report reason '${reason}'. Allowed: ${ALLOWED_REPORT_REASONS.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  const message = await Message.findById(messageId);
  if (!message) {
    const error = new Error('Message not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify that the reporting user has authorization to access the message's room
  await getRoomById(message.room, user);

  // Check for duplicate report from same user for same message
  const existingReport = await Report.findOne({
    message: message._id,
    reportedBy: user._id,
  });

  if (existingReport) {
    const error = new Error('You have already reported this message. Our team is reviewing it.');
    error.statusCode = 409;
    throw error;
  }

  const report = new Report({
    message: message._id,
    reportedBy: user._id,
    reason: reason.toLowerCase(),
    notes: typeof notes === 'string' ? notes.trim() : '',
  });

  await report.save();

  return {
    id: report._id.toString(),
    messageId: message._id.toString(),
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt,
  };
};

/**
 * Get paginated reports for administrators.
 * Only anonymous identity fields are returned.
 */
export const getAdminReports = async ({ status, page = 1, limit = 50 } = {}) => {
  const query = {};
  if (status && ALLOWED_REPORT_STATUSES.includes(status.toLowerCase())) {
    query.status = status.toLowerCase();
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (parsedPage - 1) * parsedLimit;

  const total = await Report.countDocuments(query);

  const rawReports = await Report.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parsedLimit)
    .populate({
      path: 'reportedBy',
      select: 'anonymousName anonymousAvatar year role',
    })
    .populate({
      path: 'message',
      populate: [
        {
          path: 'sender',
          select: 'anonymousName anonymousAvatar year role',
        },
        {
          path: 'room',
          select: 'name slug type allowedYear',
        },
      ],
    })
    .lean();

  const formattedReports = rawReports.map(formatSafeReport);

  // Compute counts per status for admin dashboard summary
  const counts = {
    total: await Report.countDocuments({}),
    pending: await Report.countDocuments({ status: 'pending' }),
    reviewed: await Report.countDocuments({ status: 'reviewed' }),
    dismissed: await Report.countDocuments({ status: 'dismissed' }),
    actioned: await Report.countDocuments({ status: 'actioned' }),
  };

  return {
    reports: formattedReports,
    counts,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
      hasMore: skip + rawReports.length < total,
    },
  };
};

/**
 * Update report status and optionally take moderation actions (e.g., delete message).
 */
export const updateReport = async ({ reportId, status, notes, action, adminUser }) => {
  if (status && !ALLOWED_REPORT_STATUSES.includes(status.toLowerCase())) {
    const error = new Error(
      `Invalid report status '${status}'. Allowed: ${ALLOWED_REPORT_STATUSES.join(', ')}`
    );
    error.statusCode = 400;
    throw error;
  }

  const report = await Report.findById(reportId)
    .populate({
      path: 'reportedBy',
      select: 'anonymousName anonymousAvatar year role',
    })
    .populate({
      path: 'message',
      populate: [
        {
          path: 'sender',
          select: 'anonymousName anonymousAvatar year role',
        },
        {
          path: 'room',
          select: 'name slug type allowedYear',
        },
      ],
    });

  if (!report) {
    const error = new Error('Report not found.');
    error.statusCode = 404;
    throw error;
  }

  if (status) {
    report.status = status.toLowerCase();
  }

  if (typeof notes === 'string') {
    report.notes = notes.trim();
  }

  let messageModerated = false;
  let safeDeletedMessage = null;

  // Moderation action: remove message
  if (action === 'delete_message' || action === 'remove_message') {
    if (report.message) {
      safeDeletedMessage = await deleteMessage({
        messageId: report.message._id || report.message,
        user: adminUser,
      });
      report.status = 'actioned';
      messageModerated = true;
    }
  }

  await report.save();

  return {
    report: formatSafeReport(report),
    messageModerated,
    deletedMessage: safeDeletedMessage,
  };
};

export default {
  ALLOWED_REPORT_REASONS,
  ALLOWED_REPORT_STATUSES,
  formatSafeReport,
  createReport,
  getAdminReports,
  updateReport,
};
