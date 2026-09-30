import mongoose from 'mongoose';
import { VIDEO_PROCESSING_STATUS } from '../config/constants.js';

// ==========================================
// 3. Course Model (Collection: courses)
// ==========================================
const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, index: true, lowercase: true, trim: true },
    description: { type: String },
    shortDescription: { type: String },
    thumbnail: { type: String },
    banner: { type: String },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    category: { type: String, index: true },
    subcategory: { type: String },
    level: { type: String, default: 'ALL_LEVELS' },
    language: { type: String, default: 'English' },
    skills: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    coursePrice: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    status: { type: String, default: 'DRAFT', index: true },
    visibility: { type: String, default: 'PUBLIC', index: true },
    publishedAt: { type: Date },
    syllabusUrl: { type: String },
    syllabusFileName: { type: String },
  },
  {
    collection: 'courses',
    timestamps: true,
  }
);

courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructorId: 1, status: 1 });

export const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

// ==========================================
// 4. Module Model (Collection: modules)
// ==========================================
const moduleSchema = new mongoose.Schema(
  {
    moduleId: { type: String, unique: true, sparse: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    order: { type: Number, default: 1 },
    status: { type: String, default: 'DRAFT' },
  },
  {
    collection: 'modules',
    timestamps: true,
  }
);

moduleSchema.index({ courseId: 1, order: 1 });

export const Module = mongoose.models.Module || mongoose.model('Module', moduleSchema);

// ==========================================
// 5. Topic Model (Collection: topics) - Atomic learning product
// ==========================================
const topicSchema = new mongoose.Schema(
  {
    topicId: { type: String, unique: true, sparse: true, index: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, index: true },
    description: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    duration: { type: Number, default: 0 }, // in seconds or minutes
    difficulty: { type: String, default: 'BEGINNER' },
    skills: { type: [String], default: [] },
    prerequisites: { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    isFree: { type: Boolean, default: false },
    status: { type: String, default: 'DRAFT', index: true },
    order: { type: Number, default: 1 },
  },
  {
    collection: 'topics',
    timestamps: true,
  }
);

topicSchema.index({ moduleId: 1, order: 1 });
topicSchema.index({ courseId: 1, isFree: 1 });

export const Topic = mongoose.models.Topic || mongoose.model('Topic', topicSchema);

// ==========================================
// 6. Lesson Model (Collection: lessons)
// ==========================================
const lessonSchema = new mongoose.Schema(
  {
    lessonId: { type: String, unique: true, sparse: true, index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true, index: true },
    title: { type: String, required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    playbackReference: { type: String },
    duration: { type: Number, default: 0 },
    transcript: { type: String },
    resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    order: { type: Number, default: 1 },
    status: { type: String, default: 'DRAFT' },
  },
  {
    collection: 'lessons',
    timestamps: true,
  }
);

lessonSchema.index({ topicId: 1, order: 1 });

export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);

// ==========================================
// 7. Resource Model (Collection: resources)
// ==========================================
const resourceSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
    name: { type: String, required: true },
    type: { type: String, default: 'PDF' },
    objectKey: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number, default: 0 },
    isDownloadable: { type: Boolean, default: true },
    status: { type: String, default: 'ACTIVE' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'resources',
    timestamps: true,
  }
);

export const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);

// ==========================================
// 8. Video Model (Collection: videos)
// ==========================================
const videoSchema = new mongoose.Schema(
  {
    videoId: { type: String, unique: true, sparse: true, index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', index: true },
    sourceObjectKey: { type: String, required: true },
    processingStatus: {
      type: String,
      enum: Object.values(VIDEO_PROCESSING_STATUS),
      default: VIDEO_PROCESSING_STATUS.UPLOADING,
      index: true,
    },
    duration: { type: Number, default: 0 },
    thumbnailObjectKey: { type: String },
    hlsManifestObjectKey: { type: String },
    availableQualities: { type: [String], default: [] },
    captions: { type: mongoose.Schema.Types.Mixed, default: {} },
    transcript: { type: String },
  },
  {
    collection: 'videos',
    timestamps: true,
  }
);

export const Video = mongoose.models.Video || mongoose.model('Video', videoSchema);

// ==========================================
// 9. LearningPath Model (Collection: learning_paths)
// ==========================================
const learningPathSchema = new mongoose.Schema(
  {
    learningPathId: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true, index: true, lowercase: true },
    description: { type: String },
    skills: { type: [String], default: [] },
    career: { type: String },
    level: { type: String, default: 'ALL_LEVELS' },
    estimatedDuration: { type: String },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    certificate: { type: Boolean, default: true },
    status: { type: String, default: 'DRAFT', index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'learning_paths',
    timestamps: true,
  }
);

export const LearningPath =
  mongoose.models.LearningPath || mongoose.model('LearningPath', learningPathSchema);
