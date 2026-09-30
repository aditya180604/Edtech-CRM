import mongoose from 'mongoose';

// ==========================================
// 32. Webinar Model (Collection: webinars)
// ==========================================
const webinarSchema = new mongoose.Schema(
  {
    webinarId: { type: String, unique: true, sparse: true, index: true },
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true, index: true, lowercase: true },
    description: { type: String },
    thumbnail: { type: String },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    capacity: { type: Number, default: 100 },
    meetingProvider: { type: String, default: 'LIVEKIT' },
    meetingUrl: { type: String },
    recordingUrl: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    paymentRequired: { type: Boolean, default: false },
    status: { type: String, default: 'SCHEDULED', index: true }, // SCHEDULED, LIVE, COMPLETED, CANCELLED
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attendance: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    slides: { type: [String], default: [] },
    PDFs: { type: [String], default: [] },
    recordings: { type: [String], default: [] },
    supportingFiles: { type: [String], default: [] },
  },
  {
    collection: 'webinars',
    timestamps: true,
  }
);

export const Webinar = mongoose.models.Webinar || mongoose.model('Webinar', webinarSchema);

// ==========================================
// 33. LiveSession Model (Collection: live_sessions)
// ==========================================
const liveSessionSchema = new mongoose.Schema(
  {
    webinarId: { type: mongoose.Schema.Types.ObjectId, ref: 'Webinar', index: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, default: 'LIVEKIT' },
    providerSessionId: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, default: 'SCHEDULED' },
    accessReference: { type: String },
  },
  {
    collection: 'live_sessions',
    timestamps: true,
  }
);

export const LiveSession = mongoose.models.LiveSession || mongoose.model('LiveSession', liveSessionSchema);

// ==========================================
// 34. Booking Model (Collection: bookings)
// ==========================================
const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', required: true, index: true },
    status: { type: String, default: 'CONFIRMED' }, // CONFIRMED, ATTENDED, CANCELLED
    bookedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
  },
  {
    collection: 'bookings',
    timestamps: true,
  }
);

bookingSchema.index({ userId: 1, liveSessionId: 1 }, { unique: true });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
