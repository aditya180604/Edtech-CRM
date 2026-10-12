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
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
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
    headline: { type: String, trim: true },
    bio: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    websiteUrl: { type: String, trim: true },
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
    registrationFeePaid: { type: Boolean, default: false },
    registrationFeePaidAt: { type: Date },
    registrationFeeOrderId: { type: String },
    registrationFeePaymentId: { type: String },
    registrationFeeAmount: { type: Number, default: 0 },
    instructorId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    refreshTokenHash: { type: String, select: false },
    previousRefreshTokenHash: { type: String, select: false },
    refreshTokenRotatedAt: { type: Date, select: false },
    previousRefreshTokenExpiresAt: { type: Date, select: false },
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
    instructorId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      index: true,
    },
    bio: { type: String },
    headline: { type: String },
    expertise: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    experience: { type: String },
    workExperience: { type: String },
    yearsOfExperience: { type: String },
    currentOrganization: { type: String },
    currentJobTitle: { type: String, trim: true },
    isEmployed: { type: Boolean, default: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },
    teachingSubjects: { type: [String], default: [] },
    qualification: { type: String, default: '' },
    profilePhoto: { type: String },
    country: { type: String },
    phone: { type: String },
    isCompleted: { type: Boolean, default: false },
    registrationFeePaid: { type: Boolean, default: false },
    registrationFeePaidAt: { type: Date },
    registrationFeeOrderId: { type: String },
    registrationFeePaymentId: { type: String },
    registrationFeeAmount: { type: Number, default: 0 },
    identityStatus: { type: String, default: 'PENDING' },
    verificationStatus: { type: String, default: 'PENDING' },
    rejectionReason: { type: String },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    kycStatus: { type: String, default: 'PENDING' },
    payoutStatus: { type: String, default: 'PENDING' },
    paymentAccount: { type: mongoose.Schema.Types.Mixed, default: {} },
    providerOnboardingState: { type: String, default: 'NOT_STARTED' },
    governmentId: {
      idType: { type: String, trim: true },
      documentUrl: { type: String },
      fileName: { type: String },
      fileType: { type: String },
      fileSize: { type: Number },
      uploadedAt: { type: Date },
      status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'INVALID', 'REJECTED'],
        default: 'PENDING',
      },
    },
    verificationDocuments: [
      {
        documentType: {
          type: String,
          enum: ['RESUME_CV', 'EMPLOYMENT_PROOF', 'EXPERIENCE_LETTER', 'CERTIFICATION', 'OTHER'],
          default: 'RESUME_CV',
        },
        title: { type: String },
        fileUrl: { type: String },
        fileName: { type: String },
        fileType: { type: String },
        fileSize: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['PENDING', 'VERIFIED', 'INVALID', 'REJECTED'],
          default: 'PENDING',
        },
        rejectionReason: { type: String },
      },
    ],
    readinessReport: {
      score: { type: Number, default: 0 },
      breakdown: {
        coreProfile: { type: Number, default: 0 },
        skillsAndSubjects: { type: Number, default: 0 },
        experienceAndBio: { type: Number, default: 0 },
        professionalLinks: { type: Number, default: 0 },
        governmentIdAndRequiredDocs: { type: Number, default: 0 },
        supportingEvidence: { type: Number, default: 0 },
      },
      missingItems: { type: [String], default: [] },
      recommendations: { type: [String], default: [] },
      scoringRuleVersion: { type: String, default: '1.0' },
      calculatedAt: { type: Date },
      revision: { type: Number, default: 1 },
    },
    reviewHistory: [
      {
        decision: {
          type: String,
          enum: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
        },
        reason: { type: String },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date, default: Date.now },
        notificationSent: { type: Boolean, default: false },
        notificationMessageId: { type: String },
        idempotencyKey: { type: String },
      },
    ],
    // 1-on-1 Consultation Settings & Weekly Schedule
    consultationEnabled: { type: Boolean, default: false, index: true },
    consultationFee: { type: Number, default: 0 },
    consultationDuration: { type: Number, default: 45 },
    consultationTimezone: { type: String, default: 'Asia/Kolkata' },
    consultationBufferMinutes: { type: Number, default: 15 },
    consultationSetupCompleted: { type: Boolean, default: false },
    consultationPublished: { type: Boolean, default: false },
    weeklyAvailability: [
      {
        dayOfWeek: {
          type: String,
          enum: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'],
          required: true,
        },
        isEnabled: { type: Boolean, default: false },
        slots: [
          {
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
    ],
    unavailableDates: [{ type: String }],
  },
  {
    collection: 'instructor_profiles',
    timestamps: true,
  }
);

export const InstructorProfile =
  mongoose.models.InstructorProfile || mongoose.model('InstructorProfile', instructorProfileSchema);
