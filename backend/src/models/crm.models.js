import mongoose from 'mongoose';
import { PIPELINE_STAGES } from '../config/constants.js';

// ==========================================
// 35. Lead Model (Collection: leads)
// ==========================================
const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, sparse: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    email: { type: String, index: true },
    phone: { type: String },
    country: { type: String },
    source: { type: String, default: 'ORGANIC' },
    campaign: { type: String },
    interest: { type: String },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    topics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }],
    purchases: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    learningProgress: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastActivity: { type: Date, default: Date.now },
    engagement: { type: Number, default: 0 },
    pipelineStage: {
      type: String,
      enum: Object.values(PIPELINE_STAGES),
      default: PIPELINE_STAGES.LEAD,
      index: true,
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // Counselor or Admin
  },
  {
    collection: 'leads',
    timestamps: true,
  }
);

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

// ==========================================
// 36. LeadEvent Model (Collection: lead_events)
// ==========================================
const leadEventSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    eventType: { type: String, required: true, index: true },
    entityType: { type: String },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  {
    collection: 'lead_events',
    timestamps: false,
  }
);

export const LeadEvent = mongoose.models.LeadEvent || mongoose.model('LeadEvent', leadEventSchema);

// ==========================================
// 37. Campaign Model (Collection: campaigns)
// ==========================================
const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, default: 'MARKETING' },
    channel: { type: String, default: 'EMAIL' },
    targetAudience: { type: mongoose.Schema.Types.Mixed, default: {} },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, default: 'ACTIVE' },
    budget: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    collection: 'campaigns',
    timestamps: true,
  }
);

export const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);

// ==========================================
// 38. Event Model (Collection: events) - Real-time Platform Event Backbone
// ==========================================
const eventSchema = new mongoose.Schema(
  {
    eventId: { type: String, unique: true, sparse: true, index: true },
    eventType: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    entityType: { type: String, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
    source: { type: String, default: 'PLATFORM' },
    campaignId: { type: String },
  },
  {
    collection: 'events',
    timestamps: false,
  }
);

eventSchema.index({ userId: 1, timestamp: -1 });
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ entityType: 1, entityId: 1 });

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
