import mongoose from 'mongoose';

// ==========================================
// 27. Review Model (Collection: reviews)
// ==========================================
const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String },
    comment: { type: String, required: true },
    status: { type: String, default: 'PUBLISHED' },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  {
    collection: 'reviews',
    timestamps: true,
  }
);

reviewSchema.index({ courseId: 1, rating: -1 });

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

// ==========================================
// 28. Rating Model (Collection: ratings)
// ==========================================
const ratingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  {
    collection: 'ratings',
    timestamps: true,
  }
);

ratingSchema.index({ userId: 1, courseId: 1 }, { unique: true, sparse: true });

export const Rating = mongoose.models.Rating || mongoose.model('Rating', ratingSchema);

// ==========================================
// 29. Community Question Model (Collection: community_questions)
// ==========================================
const communityQuestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true },
    lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', index: true },
    question: { type: String, required: true },
    status: { type: String, default: 'OPEN' },
  },
  {
    collection: 'community_questions',
    timestamps: true,
  }
);

export const CommunityQuestion =
  mongoose.models.CommunityQuestion || mongoose.model('CommunityQuestion', communityQuestionSchema);

// ==========================================
// 30. Answer Model (Collection: answers)
// ==========================================
const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityQuestion', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    answer: { type: String, required: true },
    isAccepted: { type: Boolean, default: false },
  },
  {
    collection: 'answers',
    timestamps: true,
  }
);

export const Answer = mongoose.models.Answer || mongoose.model('Answer', answerSchema);

// ==========================================
// 31. Wishlist Model (Collection: wishlists)
// ==========================================
const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productType: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  {
    collection: 'wishlists',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

wishlistSchema.index({ userId: 1, productType: 1, productId: 1 }, { unique: true });

export const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
