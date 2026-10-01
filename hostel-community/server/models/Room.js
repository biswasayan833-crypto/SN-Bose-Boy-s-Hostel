import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Room slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Room description is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Room type is required'],
      enum: ['global', 'year'],
    },
    allowedYear: {
      type: String,
      enum: {
        values: ['2nd Year', '3rd Year', '4th Year', null],
        message: '{VALUE} is not an allowed year for this hostel',
      },
      default: null,
    },
    icon: {
      type: String,
      default: 'Globe',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to verify if a given user is allowed to access this room
roomSchema.methods.isUserAuthorized = function (user) {
  if (!user || !user.isActive) return false;
  if (user.role === 'admin') return true;
  if (this.type === 'global') return true;
  if (this.type === 'year') {
    return user.year === this.allowedYear;
  }
  return false;
};

const Room = mongoose.model('Room', roomSchema);

export default Room;
