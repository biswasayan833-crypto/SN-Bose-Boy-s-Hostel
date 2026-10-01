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
      required: [true, 'Message content cannot be empty'],
      trim: true,
      minlength: [1, 'Message must contain at least 1 character'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
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
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast room message retrieval
messageSchema.index({ room: 1, createdAt: 1 });
messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ 'reactions.user': 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;

