import mongoose from 'mongoose';

export const ALLOWED_NOTIFICATION_TYPES = ['reaction', 'moderation', 'system', 'announcement'];

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification must have a recipient'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ALLOWED_NOTIFICATION_TYPES,
        message: '{VALUE} is not a valid notification type',
      },
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Notification content is required'],
      trim: true,
      maxlength: [500, 'Content cannot exceed 500 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast querying of user notifications and unread badges
notificationSchema.index({ recipient: 1, readAt: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
