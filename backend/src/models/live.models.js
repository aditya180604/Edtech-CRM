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
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true },
    category: { type: String, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, default: 'UTC' },
    capacity: { type: Number, default: 100 },
    meetingProvider: { type: String, default: 'IN_PLATFORM' },
    meetingType: { type: String, enum: ['IN_PLATFORM', 'EXTERNAL'], default: 'IN_PLATFORM' },
    roomCode: { type: String, unique: true, sparse: true, index: true },
    hostToken: { type: String },
    meetingUrl: { type: String },
    recordingUrl: { type: String },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentRequired: { type: Boolean, default: false },
    platformFee: { type: Number, default: 0 },
    instructorEarnings: { type: Number, default: 0 },
    status: { type: String, default: 'SCHEDULED', index: true }, // SCHEDULED, LIVE, COMPLETED, CANCELLED
    actualStartedAt: { type: Date },
    actualEndedAt: { type: Date },
    registrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attendance: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attendanceLogs: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        userEmail: { type: String },
        role: { type: String, default: 'STUDENT' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
        durationMinutes: { type: Number, default: 0 },
      },
    ],
    chatMessages: [
      {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderName: { type: String, required: true },
        senderRole: { type: String, enum: ['HOST', 'STUDENT', 'ADMIN'], default: 'STUDENT' },
        senderAvatar: { type: String, default: null },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    qa: [
      {
        id: { type: String, default: () => new mongoose.Types.ObjectId().toString() },
        question: { type: String, required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderName: { type: String, required: true },
        senderAvatar: { type: String, default: null },
        upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        answered: { type: Boolean, default: false },
        answeredAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    raisedHands: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: { type: String },
        userAvatar: { type: String },
        raisedAt: { type: Date, default: Date.now },
        canSpeak: { type: Boolean, default: false },
      },
    ],
    userNotes: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        notes: { type: String, default: '' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, default: 'DOCUMENT' },
        size: { type: String, default: '1.2 MB' },
      },
    ],
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
    bookingCode: { type: String, unique: true, sparse: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    liveSessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', index: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeachingSlot', index: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    notes: { type: String, default: '' },
    bookingType: {
      type: String,
      enum: ['SLOT', 'CONSULTATION', 'WEBINAR'],
      default: 'CONSULTATION',
      index: true,
    },
    startTime: { type: Date, index: true },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 45 },
    fee: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    paymentStatus: {
      type: String,
      enum: ['FREE', 'PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'FREE',
      index: true,
    },
    cashfreeOrderId: { type: String, sparse: true, index: true },
    cashfreePaymentId: { type: String },
    reservationExpiresAt: { type: Date, index: true },
    meetingRoomCode: { type: String, index: true },
    meetingUrl: { type: String },
    studentEmailSent: { type: Boolean, default: false },
    instructorEmailSent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'ATTENDED', 'CANCELLED', 'RESCHEDULED'],
      default: 'CONFIRMED',
      index: true,
    },
    cancellationReason: { type: String },
    cancelledBy: { type: String, enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN'] },
    cancelledAt: { type: Date },
    rescheduledFromBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    attendedMinutes: { type: Number, default: 0 },
    attendedAt: { type: Date },
    actualStartedAt: { type: Date },
    actualEndedAt: { type: Date },
    consultationReview: {
      rating: { type: Number, min: 1, max: 5 },
      review: { type: String, trim: true, maxlength: 2000 },
      submittedAt: { type: Date },
    },
    chatMessages: { type: [mongoose.Schema.Types.Mixed], default: [] },
    bookedAt: { type: Date, default: Date.now },
  },
  {
    collection: 'bookings',
    timestamps: true,
  }
);

bookingSchema.index(
  { userId: 1, liveSessionId: 1 },
  {
    unique: true,
    partialFilterExpression: { liveSessionId: { $exists: true, $type: 'objectId' } },
  }
);
bookingSchema.index({ userId: 1, slotId: 1, status: 1 });

export const Booking = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);

// ==========================================
// 35. TeachingSlot Model (Collection: teaching_slots)
// ==========================================
const teachingSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, unique: true, sparse: true, index: true },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    slotType: {
      type: String,
      enum: ['ONE_ON_ONE', 'SMALL_GROUP', 'LIVE_CLASS'],
      default: 'ONE_ON_ONE',
    },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, default: 45 },
    capacity: { type: Number, default: 1 },
    bookedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['AVAILABLE', 'BOOKED', 'COMPLETED', 'CANCELLED'],
      default: 'AVAILABLE',
      index: true,
    },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    meetingType: { type: String, enum: ['IN_PLATFORM', 'EXTERNAL'], default: 'IN_PLATFORM' },
    roomCode: { type: String, unique: true, sparse: true, index: true },
    meetingUrl: { type: String },
    timeZone: { type: String, default: 'UTC' },
  },
  {
    collection: 'teaching_slots',
    timestamps: true,
  }
);

teachingSlotSchema.index({ instructorId: 1, startTime: 1, endTime: 1 });
teachingSlotSchema.index({ courseId: 1, status: 1 });

export const TeachingSlot =
  mongoose.models.TeachingSlot || mongoose.model('TeachingSlot', teachingSlotSchema);
