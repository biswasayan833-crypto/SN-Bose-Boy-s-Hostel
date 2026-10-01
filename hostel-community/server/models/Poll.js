import mongoose from 'mongoose';

const pollOptionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    minlength: [1, 'Option text cannot be empty'],
    maxlength: [100, 'Option text cannot exceed 100 characters'],
  },
  votes: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true,
      minlength: [3, 'Question must contain at least 3 characters'],
      maxlength: [300, 'Question cannot exceed 300 characters'],
    },
    options: {
      type: [pollOptionSchema],
      validate: [
        {
          validator: function (opts) {
            return Array.isArray(opts) && opts.length >= 2 && opts.length <= 6;
          },
          message: 'Poll must have between 2 and 6 options',
        },
        {
          validator: function (opts) {
            if (!Array.isArray(opts)) return false;
            const normalized = opts.map((o) => (o.text || '').toLowerCase().trim());
            return new Set(normalized).size === normalized.length;
          },
          message: 'Poll options cannot contain duplicates',
        },
      ],
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Poll must have a creator'],
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Poll must belong to a room'],
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    allowVoteChange: {
      type: Boolean,
      default: false,
    },
    isClosed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

pollSchema.index({ room: 1, isClosed: 1, createdAt: -1 });

/**
 * Format poll to safe public payload.
 * STRICT PRIVACY: NEVER reveals who voted for which option, voter IDs, names, or emails.
 * Only option vote counts and percentages are calculated.
 * If userVotedOptionId is provided, returns that specific user's choice to their own client.
 */
pollSchema.methods.toSafeObject = function (userVotedOptionId = null) {
  const room = this.room;
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

  const totalVotes = this.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

  const safeOptions = this.options.map((opt) => {
    const votes = opt.votes || 0;
    const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
    return {
      id: opt._id.toString(),
      text: opt.text,
      votes,
      percentage,
    };
  });

  const isExpired = Boolean(this.expiresAt && new Date(this.expiresAt) <= new Date());
  const effectiveClosed = Boolean(this.isClosed) || isExpired;

  return {
    id: this._id.toString(),
    question: this.question,
    room: safeRoom,
    options: safeOptions,
    totalVotes,
    allowVoteChange: Boolean(this.allowVoteChange),
    isClosed: effectiveClosed,
    isExpired,
    expiresAt: this.expiresAt || null,
    userVotedOptionId: userVotedOptionId ? userVotedOptionId.toString() : null,
    hasVoted: Boolean(userVotedOptionId),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Poll = mongoose.model('Poll', pollSchema);

export default Poll;
