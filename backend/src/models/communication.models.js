import mongoose from 'mongoose';
import { COMMUNICATION_CHANNELS } from '../config/constants.js';

// ==========================================
// 39. Conversation Model (Collection: conversations)
// ==========================================
const conversationSchema = new mongoose.Schema(
  {
    conversationId: { type: String, unique: true, sparse: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedCounselorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    channel: {
      type: String,
      enum: Object.values(COMMUNICATION_CHANNELS),
      default: COMMUNICATION_CHANNELS.IN_APP,
      index: true,
    },
    subject: { type: String },
    status: { type: String, default: 'OPEN', index: true }, // OPEN, PENDING, RESOLVED, CLOSED
    priority: { type: String, default: 'MEDIUM' }, // LOW, MEDIUM, HIGH, URGENT
    lastMessageAt: { type: Date, default: Date.now, index: true },
    resolvedAt: { type: Date },
  },
  {
    collection: 'conversations',
    timestamps: true,
  }
);

export const Conversation =
  mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

// ==========================================
// 40. Message Model (Collection: messages)
// ==========================================
const messageSchema = new mongoose.Schema(
  {
    messageId: { type: String, unique: true, sparse: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messageType: { type: String, default: 'TEXT' }, // TEXT, IMAGE, DOCUMENT, AUDIO
    content: { type: String, required: true },
    attachments: { type: [String], default: [] },
    direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], default: 'OUTBOUND' },
    deliveryStatus: { type: String, default: 'SENT' }, // SENT, DELIVERED, READ, FAILED
    readAt: { type: Date },
  },
  {
    collection: 'messages',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

// ==========================================
// 41. CommunicationLog Model (Collection: communication_logs)
// ==========================================
const communicationLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', index: true },
    channel: { type: String, required: true },
    direction: { type: String, required: true },
    eventType: { type: String, required: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    status: { type: String, default: 'SUCCESS' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    collection: 'communication_logs',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CommunicationLog =
  mongoose.models.CommunicationLog || mongoose.model('CommunicationLog', communicationLogSchema);

// ==========================================
// 42. Notification Model (Collection: notifications)
// ==========================================
const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'Started' },
    meetingUrl: { type: String },
    actionUrl: { type: String },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    metadata: { type: Object },
  },
  {
    collection: 'notifications',
    timestamps: { createdAt: true, updatedAt: false },
  }
);

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// ==========================================
// 43. NotificationPreference Model (Collection: notification_preferences)
// ==========================================
const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true },
    courseUpdates: { type: Boolean, default: true },
    paymentUpdates: { type: Boolean, default: true },
    marketing: { type: Boolean, default: false },
    webinarReminders: { type: Boolean, default: true },
  },
  {
    collection: 'notification_preferences',
    timestamps: true,
  }
);

export const NotificationPreference =
  mongoose.models.NotificationPreference ||
  mongoose.model('NotificationPreference', notificationPreferenceSchema);
