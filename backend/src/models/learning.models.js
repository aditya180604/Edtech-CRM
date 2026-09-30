import mongoose from 'mongoose';

// ==========================================
// 24. LearningProgress Model (Collection: learning_progress)
// ==========================================
const learningProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', index: true },
    watchedSeconds: { type: Number, default: 0 },
    totalSeconds: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastWatchedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'learning_progress',
    timestamps: true,
  }
);

learningProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
learningProgressSchema.index({ userId: 1, courseId: 1 });

export const LearningProgress =
  mongoose.models.LearningProgress || mongoose.model('LearningProgress', learningProgressSchema);

// ==========================================
// 25. VideoProgress Model (Collection: video_progress)
// ==========================================
const videoProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    watchedSeconds: { type: Number, default: 0 },
    totalSeconds: { type: Number, default: 0 },
    progressPercent: { type: Number, default: 0 },
    maxContinuousSeconds: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    lastPosition: { type: Number, default: 0 }, // Playback resume position in seconds
    lastWatchedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'video_progress',
    timestamps: true,
  }
);

videoProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const VideoProgress =
  mongoose.models.VideoProgress || mongoose.model('VideoProgress', videoProgressSchema);

// ==========================================
// 26. Certificate Model (Collection: certificates)
// ==========================================
const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, unique: true, sparse: true, index: true },
    certificateNumber: { type: String, unique: true, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completionPercentage: { type: Number, default: 100 },
    issueDate: { type: Date, default: Date.now },
    verificationUrl: { type: String, required: true },
    certificateAssetUrl: { type: String },
    status: { type: String, default: 'ISSUED' },
  },
  {
    collection: 'certificates',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

certificateSchema.index({ userId: 1, courseId: 1 });

export const Certificate =
  mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
