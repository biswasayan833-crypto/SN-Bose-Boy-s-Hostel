import mongoose from 'mongoose';

const roomReadStateSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Read state must belong to a user'],
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Read state must belong to a room'],
      index: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// One read state document per user per room
roomReadStateSchema.index({ user: 1, room: 1 }, { unique: true });

const RoomReadState = mongoose.model('RoomReadState', roomReadStateSchema);

export default RoomReadState;
