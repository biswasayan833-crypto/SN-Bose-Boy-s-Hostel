import mongoose from 'mongoose';

export const ALLOWED_REACTION_TYPES = ['like', 'love', 'laugh', 'fire', 'clap'];

const messageSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Message must belong to a room'],
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender'],
      index: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
      validate: {
        validator: function (value) {
          // If message has an attachment, content can be empty or a caption
          if (this.attachment && (this.attachment.storedName || this.attachment.originalName)) {
            return true;
          }
          return typeof value === 'string' && value.trim().length >= 1;
        },
        message: 'Message content cannot be empty when no attachment is provided',
      },
    },
    attachment: {
      originalName: {
        type: String,
        trim: true,
      },
      storedName: {
        type: String,
        trim: true,
      },
      mimeType: {
        type: String,
        trim: true,
      },
      size: {
        type: Number,
      },
      url: {
        type: String,
        trim: true,
      },
    },
    // Historical persona snapshot at time of posting (preserves sender identity if user later updates profile)
    anonymousName: {
      type: String,
      trim: true,
    },
    anonymousAvatar: {
      type: String,
      trim: true,
    },
    senderYear: {
      type: String,
      trim: true,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        type: {
          type: String,
          required: true,
          enum: {
            values: ALLOWED_REACTION_TYPES,
            message: '{VALUE} is not an allowed reaction type',
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: automatically snapshot sender persona if not explicitly set
messageSchema.pre('save', async function (next) {
  if ((!this.anonymousName || !this.anonymousAvatar || !this.senderYear) && this.sender) {
    try {
      const User = mongoose.model('User');
      const senderUser = await User.findById(this.sender).select('anonymousName anonymousAvatar year');
      if (senderUser) {
        if (!this.anonymousName) this.anonymousName = senderUser.anonymousName;
        if (!this.anonymousAvatar) this.anonymousAvatar = senderUser.anonymousAvatar;
        if (!this.senderYear) this.senderYear = senderUser.year;
      }
    } catch (err) {
      // Non-blocking fallback
    }
  }
  next();
});

// Compound indexes for fast room message retrieval
messageSchema.index({ room: 1, createdAt: 1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ room: 1, isPinned: 1, pinnedAt: -1 });
messageSchema.index({ 'reactions.user': 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

