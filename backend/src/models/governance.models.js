import mongoose from 'mongoose';
import { CONTENT_ACCESS_TYPES, ROLES } from '../config/constants.js';

// ==========================================
// 44. ContentVersion Model (Collection: content_versions)
// ==========================================
const contentVersionSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    contentType: { type: String, required: true, index: true }, // COURSE, TOPIC, LESSON
    version: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changeSummary: { type: String },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, default: 'PUBLISHED' },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewNotes: { type: String },
  },
  {
    collection: 'content_versions',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

contentVersionSchema.index({ contentId: 1, version: 1 }, { unique: true });

export const ContentVersion =
  mongoose.models.ContentVersion || mongoose.model('ContentVersion', contentVersionSchema);

// ==========================================
// 45. ContentAccessRule Model (Collection: content_access_rules)
// ==========================================
const contentAccessRuleSchema = new mongoose.Schema(
  {
    contentType: { type: String, required: true, index: true },
    contentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    accessType: {
      type: String,
      enum: Object.values(CONTENT_ACCESS_TYPES),
      default: CONTENT_ACCESS_TYPES.PAID,
    },
    roles: [{ type: String, enum: Object.values(ROLES) }],
    requiresPurchase: { type: Boolean, default: true },
    requiresEnrollment: { type: Boolean, default: true },
    requiresEntitlement: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, default: 'ACTIVE' },
  },
  {
    collection: 'content_access_rules',
    timestamps: true,
  }
);

export const ContentAccessRule =
  mongoose.models.ContentAccessRule || mongoose.model('ContentAccessRule', contentAccessRuleSchema);

// ==========================================
// 46. SupportTicket Model (Collection: support_tickets)
// ==========================================
const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true }, // BILLING, TECHNICAL, COURSE, GENERAL
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, default: 'MEDIUM' }, // LOW, MEDIUM, HIGH, URGENT
    status: { type: String, default: 'OPEN', index: true }, // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    attachments: { type: [String], default: [] },
    resolvedAt: { type: Date },
  },
  {
    collection: 'support_tickets',
    timestamps: true,
  }
);

export const SupportTicket =
  mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

// ==========================================
// 47. SupportMessage Model (Collection: support_messages)
// ==========================================
const supportMessageSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: { type: [String], default: [] },
  },
  {
    collection: 'support_messages',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const SupportMessage =
  mongoose.models.SupportMessage || mongoose.model('SupportMessage', supportMessageSchema);

// ==========================================
// 48. Coupon Model (Collection: coupons)
// ==========================================
const couponSchema = new mongoose.Schema(
  {
    couponId: { type: String, unique: true, sparse: true, index: true },
    code: { type: String, required: true, trim: true }, // Exact 8 characters, case-sensitive
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerType: { type: String, enum: ['SUPER_ADMIN', 'INSTRUCTOR'], default: 'SUPER_ADMIN' },
    discountType: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
    discountValue: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    minimumAmount: { type: Number, default: 0 },
    maximumDiscount: { type: Number },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    eligibleProducts: [{ type: mongoose.Schema.Types.ObjectId }],
    eligibleUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    description: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    promotionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Promotion' },
  },
  {
    collection: 'coupons',
    timestamps: true,
  }
);

couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ status: 1 });
couponSchema.index({ startDate: 1, expiryDate: 1 });
couponSchema.index({ courseId: 1, status: 1 });
couponSchema.index({ instructorId: 1, courseId: 1 });

export const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

// ==========================================
// 48B. CouponRedemption Model (Collection: coupon_redemptions)
// ==========================================
const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    code: { type: String, required: true },
    discountAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'REVERSED', 'REDEEMED'], default: 'SUCCESS' },
    redeemedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'coupon_redemptions',
    timestamps: true,
  }
);

couponRedemptionSchema.index({ couponId: 1, userId: 1 });
couponRedemptionSchema.index({ couponId: 1, courseId: 1 });
couponRedemptionSchema.index({ orderId: 1 });

export const CouponRedemption =
  mongoose.models.CouponRedemption || mongoose.model('CouponRedemption', couponRedemptionSchema);

// ==========================================
// 49. Promotion Model (Collection: promotions)
// ==========================================
const promotionSchema = new mongoose.Schema(
  {
    promotionId: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, default: 'DISCOUNT' }, // DISCOUNT, BUNDLE, FLASH_SALE
    products: [{ type: mongoose.Schema.Types.ObjectId }],
    discountRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, default: 'ACTIVE' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'promotions',
    timestamps: true,
  }
);

export const Promotion = mongoose.models.Promotion || mongoose.model('Promotion', promotionSchema);

// ==========================================
// 50. InstructorEarning Model (Collection: instructor_earnings)
// ==========================================
const instructorEarningSchema = new mongoose.Schema(
  {
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true },
    grossAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    paymentFee: { type: Number, default: 0 },
    platformCommission: { type: Number, required: true, default: 0 },
    taxAmount: { type: Number, default: 0 },
    netEarning: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: { type: String, default: 'PENDING' }, // PENDING, AVAILABLE, PAID_OUT, CANCELLED
  },
  {
    collection: 'instructor_earnings',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const InstructorEarning =
  mongoose.models.InstructorEarning || mongoose.model('InstructorEarning', instructorEarningSchema);

// ==========================================
// 51. Payout Model (Collection: payouts)
// ==========================================
const payoutSchema = new mongoose.Schema(
  {
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    paymentProvider: { type: String, default: 'STRIPE_CONNECT' },
    providerPayoutId: { type: String },
    status: { type: String, default: 'REQUESTED', index: true }, // REQUESTED, PROCESSING, COMPLETED, FAILED
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    failureReason: { type: String },
  },
  {
    collection: 'payouts',
    timestamps: true,
  }
);

export const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);

// ==========================================
// 52. AuditLog Model (Collection: audit_logs)
// ==========================================
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'audit_logs',
    timestamps: false,
  }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

// ==========================================
// 53. Recommendation Model (Collection: recommendations)
// ==========================================
const recommendationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sourceEntityType: { type: String },
    sourceEntityId: { type: mongoose.Schema.Types.ObjectId },
    recommendedEntityType: { type: String, required: true },
    recommendedEntityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String },
    score: { type: Number, default: 1.0 },
    modelVersion: { type: String, default: 'v1.0' },
    expiresAt: { type: Date },
  },
  {
    collection: 'recommendations',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

recommendationSchema.index({ userId: 1, recommendedEntityType: 1, recommendedEntityId: 1 });

export const Recommendation =
  mongoose.models.Recommendation || mongoose.model('Recommendation', recommendationSchema);

// ==========================================
// 54. Analytics Model (Collection: analytics)
// ==========================================
const analyticsSchema = new mongoose.Schema(
  {
    metric: { type: String, required: true, index: true },
    dimension: { type: String, required: true, index: true },
    value: { type: Number, required: true },
    date: { type: Date, required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    country: { type: String },
    channel: { type: String },
    campaignId: { type: String },
  },
  {
    collection: 'analytics',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

analyticsSchema.index({ metric: 1, date: -1 });

export const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

// ==========================================
// 55. Country Model (Collection: countries)
// ==========================================
const countrySchema = new mongoose.Schema(
  {
    countryCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    currencyCode: { type: String, required: true, uppercase: true, trim: true },
    timezone: { type: String, default: 'UTC' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { collection: 'countries', timestamps: true }
);

export const Country = mongoose.models.Country || mongoose.model('Country', countrySchema);

// ==========================================
// 56. Currency Model (Collection: currencies)
// ==========================================
const currencySchema = new mongoose.Schema(
  {
    currencyCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true },
    exchangeRate: { type: Number, required: true, default: 1.0 }, // Base rate against INR
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { collection: 'currencies', timestamps: true }
);

export const Currency = mongoose.models.Currency || mongoose.model('Currency', currencySchema);

// ==========================================
// 57. Tax Model (Collection: taxes)
// ==========================================
const taxSchema = new mongoose.Schema(
  {
    countryCode: { type: String, required: true, uppercase: true, trim: true },
    taxName: { type: String, required: true, trim: true },
    taxType: { type: String, enum: ['DIRECT', 'INDIRECT', 'GST', 'VAT', 'SALES_TAX'], default: 'INDIRECT' },
    taxRate: { type: Number, required: true }, // e.g. 18 for 18%
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { collection: 'taxes', timestamps: true }
);

export const Tax = mongoose.models.Tax || mongoose.model('Tax', taxSchema);

// ==========================================
// 58. FraudRecord Model (Collection: fraud_records)
// ==========================================
const fraudRecordSchema = new mongoose.Schema(
  {
    eventId: { type: String, unique: true, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    type: { type: String, required: true },
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    status: { type: String, enum: ['FLAGGED', 'INVESTIGATING', 'CLEARED', 'BLOCKED'], default: 'FLAGGED' },
    reason: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { collection: 'fraud_records', timestamps: true }
);

export const FraudRecord = mongoose.models.FraudRecord || mongoose.model('FraudRecord', fraudRecordSchema);

// ==========================================
// 59. InfrastructureStatus Model (Collection: infrastructure_status)
// ==========================================
const infrastructureStatusSchema = new mongoose.Schema(
  {
    deploymentId: { type: String, required: true },
    releaseVersion: { type: String, required: true },
    environment: { type: String, default: 'production' },
    healthStatus: { type: String, enum: ['HEALTHY', 'DEGRADED', 'DOWN'], default: 'HEALTHY' },
    rollbackVersion: { type: String },
  },
  { collection: 'infrastructure_status', timestamps: true }
);

export const InfrastructureStatus =
  mongoose.models.InfrastructureStatus || mongoose.model('InfrastructureStatus', infrastructureStatusSchema);

