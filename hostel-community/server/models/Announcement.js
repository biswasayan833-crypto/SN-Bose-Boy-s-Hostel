import mongoose from 'mongoose';

export const ALLOWED_ANNOUNCEMENT_PRIORITIES = ['normal', 'important', 'urgent'];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      minlength: [3, 'Title must contain at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    content: {
      type: String,
      required: [true, 'Announcement content is required'],
      trim: true,
      minlength: [5, 'Content must contain at least 5 characters'],
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Announcement must have a creator'],
      index: true,
    },
    targetRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Announcement must target a valid room'],
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ALLOWED_ANNOUNCEMENT_PRIORITIES,
        message: '{VALUE} is not a valid announcement priority',
      },
      default: 'normal',
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed retrieval of room announcements and expiration checks
announcementSchema.index({ targetRoom: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ targetRoom: 1, expiresAt: 1 });

/**
 * Format announcement into a privacy-guaranteed community payload.
 * STRICT PRIVACY: Creator's real name, email, role, and password hash are NEVER exposed.
 * The author is presented uniformly as "Hostel Administration".
 */
announcementSchema.methods.toSafeObject = function () {
  const room = this.targetRoom;
  const safeRoom =
    room && typeof room === 'object' && room.name
      ? {
          id: room._id ? room._id.toString() : room.id || String(room),
          name: room.name,
          slug: room.slug || '',
          type: room.type || 'global',
          allowedYear: room.allowedYear || null,
        }
      : {
          id: room ? (room._id ? room._id.toString() : String(room)) : null,
        };

  return {
    id: this._id.toString(),
    title: this.title,
    content: this.content,
    priority: this.priority,
    isPinned: Boolean(this.isPinned),
    expiresAt: this.expiresAt || null,
    targetRoom: safeRoom,
    author: 'Hostel Administration',
    isExpired: Boolean(this.expiresAt && new Date(this.expiresAt) <= new Date()),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;
