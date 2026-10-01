import mongoose from 'mongoose';

const pollVoteSchema = new mongoose.Schema(
  {
    poll: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Poll',
      required: [true, 'Vote must belong to a poll'],
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vote must belong to a user'],
      index: true,
    },
    option: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Vote must reference an option ID'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensures 1 vote per user per poll
pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });

const PollVote = mongoose.model('PollVote', pollVoteSchema);

export default PollVote;
