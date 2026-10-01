import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ALLOWED_YEARS = ['2nd Year', '3rd Year', '4th Year'];

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Omit from default queries
    },
    year: {
      type: String,
      required: [true, 'Hostel year is required'],
      enum: {
        values: ALLOWED_YEARS,
        message: '{VALUE} is not a valid year. S.N. Bose Boys Hostel only has 2nd Year, 3rd Year, and 4th Year residents.',
      },
    },
    anonymousName: {
      type: String,
      required: [true, 'Anonymous pseudonym is required'],
      trim: true,
    },
    anonymousAvatar: {
      type: String,
      required: [true, 'Anonymous avatar is required'],
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      trim: true,
      maxlength: [160, 'Bio cannot exceed 160 characters'],
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
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

// Pre-save hook to hash password with bcryptjs
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password helper method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe community-facing object serializer (real fullName, email, and password never exposed)
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id.toString(),
    anonymousName: this.anonymousName,
    anonymousAvatar: this.anonymousAvatar,
    bio: this.bio || '',
    year: this.year,
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Private profile object serializer (for authenticated owner's private view only)
userSchema.methods.toPrivateProfileObject = function () {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    year: this.year,
    anonymousName: this.anonymousName,
    anonymousAvatar: this.anonymousAvatar,
    bio: this.bio || '',
    role: this.role,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User = mongoose.model('User', userSchema);

export default User;
