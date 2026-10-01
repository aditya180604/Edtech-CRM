import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../config/constants.js';

// ==========================================
// 1. User Model (Collection: users)
// ==========================================
const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: {
      type: String,
      select: false, // Never return password hash in normal queries
    },
    profilePhoto: { type: String },
    country: { type: String },
    state: { type: String },
    city: { type: String },
    timezone: { type: String, default: 'UTC' },
    preferredLanguage: { type: String, default: 'en' },
    learningPreferences: { type: mongoose.Schema.Types.Mixed, default: {} },
    qualification: { type: String },
    institution: { type: String },
    graduationYear: { type: Number },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.STUDENT,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    emailVerified: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false },
    verificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  {
    collection: 'users',
    timestamps: true,
  }
);

// Method to verify password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash password
userSchema.statics.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);

// ==========================================
// 2. Instructor Profile (Collection: instructor_profiles)
// ==========================================
const instructorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bio: { type: String },
    expertise: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    experience: { type: String },
    workExperience: { type: String },
    yearsOfExperience: { type: String },
    currentOrganization: { type: String },
    profilePhoto: { type: String },
    country: { type: String },
    isCompleted: { type: Boolean, default: false },
    identityStatus: { type: String, default: 'PENDING' },
    verificationStatus: { type: String, default: 'PENDING' },
    kycStatus: { type: String, default: 'PENDING' },
    payoutStatus: { type: String, default: 'PENDING' },
    paymentAccount: { type: mongoose.Schema.Types.Mixed, default: {} },
    providerOnboardingState: { type: String, default: 'NOT_STARTED' },
  },
  {
    collection: 'instructor_profiles',
    timestamps: true,
  }
);

export const InstructorProfile =
  mongoose.models.InstructorProfile || mongoose.model('InstructorProfile', instructorProfileSchema);
