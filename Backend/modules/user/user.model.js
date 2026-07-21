import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type:      String,
      required:  [true, 'Full name is required'],
      trim:      true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },

    // Optional: Google OAuth users may not have a password
    password: {
      type:     String,
      minlength: [8, 'Password must be at least 8 characters'],
      select:   false, // never returned in queries unless explicitly requested
    },

    // Set when the user signs up via Google OAuth
    googleId: {
      type:   String,
      unique:  true,
      sparse: true, // allows multiple null values (email users have no googleId)
      select: false,
    },

    profileImageUrl: {
      type:    String,
      default: null,
    },

    bio: {
      type:      String,
      trim:      true,
      maxlength: [200, 'Bio cannot exceed 200 characters'],
      default:   '',
    },

    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },

    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },

    isEmailVerified: {
      type:    Boolean,
      default: false,
      // Google OAuth users are considered verified by default (set in auth service)
    },

    isActive: {
      type:    Boolean,
      default: true,
      // Set to false on account deactivation instead of hard-deleting
    },

    // Stored hashed for refresh token rotation.
    // On logout or token theft detected → set to null to invalidate all sessions.
    refreshToken: {
      type:   String,
      select: false,
    },

    lastSeenAt: {
      type:    Date,
      default: null,
      // Updated on every authenticated request by auth middleware
    },
  },
  {
    timestamps: true,
  }
);

//  Indexes 
// email is already indexed via `unique: true`
// Search users by name (for the board invite feature)
userSchema.index({ fullName: 'text' });


//  Pre-save Hook 
// Hash password only when it has been set or changed and not already hashed.
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return;
  this.password = await bcrypt.hash(this.password, 12);
});

//  Instance Methods 
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google-only account has no password
  return bcrypt.compare(candidatePassword, this.password);
};


userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.googleId;
  delete obj.__v;
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;