import mongoose from 'mongoose';

export const ALLOWED_REPORT_REASONS = [
  'spam',
  'harassment',
  'hate',
  'inappropriate',
  'threat',
  'other',
];

export const ALLOWED_REPORT_STATUSES = [
  'pending',
  'reviewed',
  'dismissed',
  'actioned',
];

const reportSchema = new mongoose.Schema(
  {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      required: [true, 'Reported message is required'],
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporting user is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
      enum: {
        values: ALLOWED_REPORT_REASONS,
        message: '{VALUE} is not a valid report reason',
      },
    },
    status: {
      type: String,
      enum: {
        values: ALLOWED_REPORT_STATUSES,
        message: '{VALUE} is not a valid report status',
      },
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate reports from the same user on the same message
reportSchema.index({ message: 1, reportedBy: 1 }, { unique: true });

const Report = mongoose.model('Report', reportSchema);

export default Report;
