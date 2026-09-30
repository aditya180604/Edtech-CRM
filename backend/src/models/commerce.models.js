import mongoose from 'mongoose';
import {
  PRODUCT_TYPES,
  ENTITLEMENT_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  TRANSACTION_TYPES,
} from '../config/constants.js';

// ==========================================
// 15. Cart Model (Collection: cart)
// ==========================================
const cartItemSchema = new mongoose.Schema(
  {
    productType: {
      type: String,
      enum: Object.values(PRODUCT_TYPES),
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    price: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
  },
  {
    collection: 'cart',
    timestamps: true,
  }
);

export const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

// ==========================================
// 16. Order Model (Collection: orders)
// ==========================================
const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, unique: true, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    subtotal: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      index: true,
    },
    paymentId: { type: String },
  },
  {
    collection: 'orders',
    timestamps: true,
  }
);

orderSchema.index({ userId: 1, createdAt: -1 });

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// ==========================================
// 17. OrderItem Model (Collection: order_items)
// ==========================================
const orderItemSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    productType: {
      type: String,
      enum: Object.values(PRODUCT_TYPES),
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    finalPrice: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  {
    collection: 'order_items',
  }
);

export const OrderItem = mongoose.models.OrderItem || mongoose.model('OrderItem', orderItemSchema);

// ==========================================
// 18. Payment Model (Collection: payments)
// ==========================================
const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, required: true }, // e.g., 'STRIPE', 'CASHFREE'
    providerPaymentId: { type: String, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paymentMethod: { type: String },
    transactionReference: { type: String },
    webhookEventId: { type: String, index: true },
    paidAt: { type: Date },
    failureReason: { type: String },
  },
  {
    collection: 'payments',
    timestamps: true,
  }
);

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

// ==========================================
// 19. Refund Model (Collection: refunds)
// ==========================================
const refundSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    reason: { type: String },
    status: { type: String, default: 'PENDING' },
    providerRefundId: { type: String },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
  },
  {
    collection: 'refunds',
    timestamps: true,
  }
);

export const Refund = mongoose.models.Refund || mongoose.model('Refund', refundSchema);

// ==========================================
// 20. Entitlement Model (Collection: entitlements) - AUTHORITATIVE SOURCE OF ACCESS
// ==========================================
const entitlementSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productType: {
      type: String,
      enum: [PRODUCT_TYPES.COURSE, PRODUCT_TYPES.TOPIC, PRODUCT_TYPES.WEBINAR, PRODUCT_TYPES.LEARNING_PATH],
      required: true,
    },
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    source: { type: String, default: 'PURCHASE' }, // PURCHASE, UPGRADE, ADMIN_GRANT, SUBSCRIPTION
    status: {
      type: String,
      enum: Object.values(ENTITLEMENT_STATUS),
      default: ENTITLEMENT_STATUS.ACTIVE,
      index: true,
    },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
    grantedAt: { type: Date, default: Date.now },
    revokedAt: { type: Date },
  },
  {
    collection: 'entitlements',
    timestamps: true,
  }
);

entitlementSchema.index({ userId: 1, productType: 1, productId: 1, status: 1 });
entitlementSchema.index({ userId: 1, courseId: 1, status: 1 });
entitlementSchema.index({ userId: 1, topicId: 1, status: 1 });

export const Entitlement = mongoose.models.Entitlement || mongoose.model('Entitlement', entitlementSchema);

// ==========================================
// 21. TopicCredit Model (Collection: topic_credits)
// ==========================================
const topicCreditSchema = new mongoose.Schema(
  {
    creditId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    sourceTopicPurchases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Entitlement' }],
    eligibleAmount: { type: Number, required: true, default: 0 },
    usedAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true, default: 0 },
    status: { type: String, default: 'ACTIVE' },
  },
  {
    collection: 'topic_credits',
    timestamps: true,
  }
);

export const TopicCredit = mongoose.models.TopicCredit || mongoose.model('TopicCredit', topicCreditSchema);

// ==========================================
// 22. CourseUpgrade Model (Collection: course_upgrades)
// ==========================================
const courseUpgradeSchema = new mongoose.Schema(
  {
    upgradeId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    coursePrice: { type: Number, required: true },
    eligibleCredit: { type: Number, required: true, default: 0 },
    upgradePrice: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    status: { type: String, default: 'PENDING' },
    completedAt: { type: Date },
  },
  {
    collection: 'course_upgrades',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CourseUpgrade =
  mongoose.models.CourseUpgrade || mongoose.model('CourseUpgrade', courseUpgradeSchema);

// ==========================================
// 23. FinancialLedger Model (Collection: financial_ledger)
// ==========================================
const financialLedgerSchema = new mongoose.Schema(
  {
    ledgerId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
      index: true,
    },
    referenceId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    direction: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    description: { type: String },
    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
  },
  {
    collection: 'financial_ledger',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const FinancialLedger =
  mongoose.models.FinancialLedger || mongoose.model('FinancialLedger', financialLedgerSchema);
