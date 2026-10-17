import mongoose from 'mongoose';
import { AccessToken } from 'livekit-server-sdk';
import { Webinar, User, Booking, Notification } from '../../models/index.js';
import { runWebinarExpiryCheck } from './webinarExpiry.cron.js';
import { publishWebinarAdmission, publishWebinarLobbyUpdate } from '../../services/realtime.service.js';

// In-memory heartbeat presence map for rooms: roomCode -> Map(userIdString, lastSeenTimestamp)
const roomPresenceHeartbeatMap = new Map();

// In-memory room broadcast state: roomCode -> { cameraEnabled, micEnabled, screenShareActive }
const roomBroadcastStateMap = new Map();

// In-memory WebRTC signaling queue: roomCode -> Array<{ senderId, senderRole, type, data, timestamp }>
const roomSignalQueueMap = new Map();

// In-memory latest offer map: roomCode -> { signal, senderId, timestamp }
const roomLatestOfferMap = new Map();
const PRESENCE_TIMEOUT_MS = 15000;

function throwWebinarAccessError(message, statusCode = 403) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function isRoomUserOnline(roomCode, userId) {
  const lastSeen = roomPresenceHeartbeatMap.get(roomCode)?.get(userId?.toString());
  return Boolean(lastSeen && Date.now() - lastSeen < PRESENCE_TIMEOUT_MS);
}

export class WebinarsService {
  /**
   * Helper: Resolve webinar document by roomCode, webinarId, slug or _id
   */
  static async findWebinarDoc(identifier) {
    if (!identifier) return null;
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
      ? { $or: [{ _id: identifier }, { roomCode: identifier }, { webinarId: identifier }, { slug: identifier }] }
      : { $or: [{ roomCode: identifier }, { webinarId: identifier }, { slug: identifier }] };
    return await Webinar.findOne(query);
  }

  /**
   * Helper: Resolve consultation booking document by meetingRoomCode, bookingCode, or _id
   */
  static async findBookingDoc(identifier) {
    if (!identifier) return null;
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId
      ? { $or: [{ meetingRoomCode: identifier }, { bookingCode: identifier }, { _id: identifier }] }
      : { $or: [{ meetingRoomCode: identifier }, { bookingCode: identifier }] };
    return await Booking.findOne(query).populate('userId instructorId');
  }

  /**
   * Get public active and upcoming webinars, sorted chronologically by date & time
   * Strictly expires and closes any webinar 2 hours after creation/start time.
   */
  static async getUpcomingWebinars({ category, search, limit = 20, userId = null } = {}) {
    // 1. Run live on-demand expiry cleanup
    await runWebinarExpiryCheck();

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    const query = {
      status: { $in: ['SCHEDULED', 'LIVE'] },
      endTime: { $gt: now },
    };

    if (category && category !== 'ALL') {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const webinars = await Webinar.find(query)
      .populate('instructorId', 'firstName lastName email profilePhoto headline bio')
      .sort({ startTime: 1 })
      .limit(parseInt(limit, 10))
      .lean();

    const formatted = webinars
      .map((w) => {
        const instructor = w.instructorId || {};
        const instructorName = `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim();
        const startTime = new Date(w.startTime);
        const endTime = new Date(w.endTime);

        const isLive = w.status === 'LIVE' || (startTime <= now && endTime > now && w.status !== 'COMPLETED');

        let computedStatus = w.status;
        if (isLive) {
          computedStatus = 'LIVE';
        } else if (now < startTime) {
          computedStatus = w.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED';
        } else if (now < endTime && w.status !== 'COMPLETED' && w.status !== 'CANCELLED') {
          computedStatus = 'SCHEDULED';
        } else {
          computedStatus = 'COMPLETED';
        }

        const registeredUserIds = Array.isArray(w.registrations)
          ? w.registrations.map((id) => id?.toString())
          : [];
        const isUserRegistered = userId ? registeredUserIds.includes(userId.toString()) : false;

        return {
          _id: w._id,
          id: w._id,
          webinarId: w.webinarId,
          title: w.title,
          slug: w.slug,
          description: w.description || '',
          category: w.category || 'General',
          startTime: w.startTime,
          endTime: w.endTime,
          createdAt: w.createdAt,
          timezone: w.timezone || 'UTC',
          capacity: w.capacity || 100,
          price: w.price || 0,
          currency: w.currency || 'INR',
          status: computedStatus,
          isLive,
          roomCode: w.roomCode,
          meetingType: w.meetingType || 'IN_PLATFORM',
          instructorId: instructor._id || null,
          instructorName,
          instructorAvatar: instructor.profilePhoto || null,
          instructorHeadline: instructor.headline || 'Lead Instructor',
          registrationsCount: registeredUserIds.length,
          isUserRegistered,
          meetingUrl: w.meetingUrl || null,
          date: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        };
      })
      .filter((w) => w.status === 'LIVE' || w.status === 'SCHEDULED');

    return {
      webinars: formatted,
      count: formatted.length,
      hasUpcoming: formatted.length > 0,
    };
  }

  /**
   * Register a user / student for a webinar
   */
  static async registerStudent(webinarId, userId) {
    const webinar = await Webinar.findById(webinarId);
    if (!webinar) {
      throw new Error('Webinar not found');
    }

    if (!Array.isArray(webinar.registrations)) {
      webinar.registrations = [];
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isAlreadyRegistered = webinar.registrations.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isAlreadyRegistered) {
      if (webinar.registrations.length >= (webinar.capacity || 100)) {
        throw new Error('Webinar has reached maximum capacity');
      }
      webinar.registrations.push(userObjectId);
      await webinar.save();

      // If webinar is already live, immediately generate the "Started" notification
      const now = new Date();
      if (new Date(webinar.startTime) <= now && new Date(webinar.endTime) >= now) {
        try {
          const { Notification } = await import('../../models/index.js');
          await Notification.create({
            notificationId: `notif_${webinar._id}_${userId}_${Date.now()}`,
            userId: userObjectId,
            type: 'WEBINAR_STARTED',
            title: `Webinar Started: ${webinar.title}`,
            message: `The webinar "${webinar.title}" has started! Join the live session now.`,
            status: 'Started',
            meetingUrl: webinar.meetingUrl || '',
            entityType: 'WEBINAR',
            entityId: webinar._id,
            isRead: false,
            createdAt: new Date(),
          });
        } catch (e) {
          // ignore duplicate
        }
      }
    }

    return {
      success: true,
      registered: true,
      registrationsCount: webinar.registrations.length,
      message: isAlreadyRegistered ? 'Already registered for this webinar' : 'Successfully registered for webinar',
    };
  }

  /**
   * Create Cashfree Checkout Order for paid webinar registration
   */
  static async createWebinarCheckoutOrder(webinarId, userId) {
    const webinar = await this.findWebinarDoc(webinarId);
    if (!webinar) throw new Error('Webinar not found');

    // If webinar is free (price === 0), register directly with no payment required
    if (!webinar.price || webinar.price <= 0) {
      return this.registerStudent(webinar._id, userId);
    }

    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    // Check if already registered
    const isAlreadyRegistered = Array.isArray(webinar.registrations) && webinar.registrations.some(
      (id) => id.toString() === userId.toString()
    );
    if (isAlreadyRegistered) {
      return {
        success: true,
        registered: true,
        alreadyRegistered: true,
        message: 'You are already registered for this webinar.',
      };
    }

    // Capacity check
    if ((webinar.registrations?.length || 0) >= (webinar.capacity || 100)) {
      throw new Error('Webinar has reached maximum capacity');
    }

    const { CashfreeService } = await import('../../services/cashfree.service.js');
    const { cashfreeConfig } = await import('../../config/cashfree.js');

    const orderId = `cf_wb_${webinar._id.toString().slice(-6)}_${Date.now().toString(36)}`;

    const cfOrder = await CashfreeService.createOrder({
      orderId,
      orderAmount: webinar.price,
      currency: webinar.currency || 'INR',
      customerId: user._id.toString(),
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
      customerEmail: user.email,
      customerPhone: user.phone || '9999999999',
      orderNote: `Ticket for Webinar: ${webinar.title}`,
    });

    return {
      success: true,
      requiresPayment: true,
      orderId: cfOrder.orderId,
      cfOrderId: cfOrder.cfOrderId,
      paymentSessionId: cfOrder.paymentSessionId,
      environment: cfOrder.environment || cashfreeConfig.env,
      price: webinar.price,
      currency: webinar.currency || 'INR',
    };
  }

  /**
   * Verify Cashfree Payment and enroll student into webinar
   */
  static async verifyWebinarPayment(webinarId, userId, orderId) {
    if (!orderId) throw new Error('Order ID is required for verification');

    const webinar = await this.findWebinarDoc(webinarId);
    if (!webinar) throw new Error('Webinar not found');

    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const { CashfreeService } = await import('../../services/cashfree.service.js');
    const cfStatusResult = await CashfreeService.getOrderPaymentStatus(orderId);

    if (cfStatusResult.status !== 'SUCCESS') {
      throw new Error(`Payment verification failed with status: ${cfStatusResult.status}`);
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    if (!Array.isArray(webinar.registrations)) webinar.registrations = [];

    const isAlreadyRegistered = webinar.registrations.some(
      (id) => id.toString() === userId.toString()
    );

    if (!isAlreadyRegistered) {
      webinar.registrations.push(userObjectId);
      await webinar.save();

      // 1. Calculate 10% Platform Fee and 90% Instructor Net Payout
      const price = webinar.price || 0;
      const platformFee = Math.round(price * 0.10);
      const netEarning = price - platformFee;

      const {
        InstructorEarning,
        FinancialLedger,
        Order,
        AuditLog,
        Notification,
      } = await import('../../models/index.js');
      const { TRANSACTION_TYPES, ORDER_STATUS, PAYMENT_STATUS } = await import('../../config/constants.js');

      // 2. Create Order record for Super Admin Orders & GMV audit
      const orderDoc = await Order.create({
        orderId: `ORD-WB-${Date.now().toString(36).toUpperCase()}`,
        userId: userObjectId,
        items: [
          {
            itemType: 'WEBINAR',
            productId: webinar._id,
            title: `Webinar: ${webinar.title}`,
            instructorId: webinar.instructorId,
            unitPrice: price,
            finalPrice: price,
          },
        ],
        subtotal: price,
        finalAmount: price,
        currency: webinar.currency || 'INR',
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        orderStatus: ORDER_STATUS.COMPLETED,
        provider: 'CASHFREE',
        paymentId: cfStatusResult.paymentId || orderId,
        providerOrderId: orderId,
      }).catch((e) => {
        console.warn('[Webinar Order Creation non-fatal]:', e.message);
        return null;
      });

      // 3. Create InstructorEarning record (90% net payout to instructor balance)
      await InstructorEarning.create({
        instructorId: webinar.instructorId,
        orderId: orderDoc ? orderDoc._id : new mongoose.Types.ObjectId(),
        orderItemId: webinar._id,
        grossAmount: price,
        discountAmount: 0,
        refundAmount: 0,
        paymentFee: 0,
        platformCommission: platformFee, // 10% Platform share
        netEarning: netEarning,          // 90% Instructor Net Payout
        currency: webinar.currency || 'INR',
        status: 'AVAILABLE',
      }).catch((e) => console.warn('[Webinar InstructorEarning non-fatal]:', e.message));

      // 4. Create FinancialLedger record for 10% Platform Fee (credited to Super Admin platform)
      await FinancialLedger.create({
        ledgerId: `LEDGER-WB-${Date.now()}`,
        userId: webinar.instructorId,
        orderId: orderDoc ? orderDoc._id : undefined,
        type: TRANSACTION_TYPES.PLATFORM_FEE,
        amount: platformFee,
        currency: webinar.currency || 'INR',
        direction: 'CREDIT',
        referenceId: cfStatusResult.paymentId || orderId,
        description: `Webinar 10% Platform Fee collected for "${webinar.title}" (Student: ${user.email})`,
      }).catch((e) => console.warn('[Webinar FinancialLedger non-fatal]:', e.message));

      // 5. Create AuditLog for Super Admin activity monitoring
      await AuditLog.create({
        auditId: `audit_wb_${Date.now()}`,
        actorId: userObjectId,
        action: 'WEBINAR_TICKET_PURCHASE',
        targetModel: 'Webinar',
        targetId: webinar._id,
        description: `Student ${user.email} purchased ticket for webinar "${webinar.title}" for ₹${price} (Platform Fee: ₹${platformFee}, Instructor: ₹${netEarning})`,
      }).catch((e) => console.warn('[Webinar AuditLog non-fatal]:', e.message));

      // 6. In-App Notification for Student
      try {
        await Notification.create({
          notificationId: `notif_${webinar._id}_${userId}_${Date.now()}`,
          userId: userObjectId,
          type: 'WEBINAR_REGISTERED',
          title: `Ticket Confirmed: ${webinar.title}`,
          message: `Your ticket for "${webinar.title}" is confirmed! The live room unlocks at ${new Date(webinar.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          meetingUrl: webinar.meetingUrl || `/webinars/live/${webinar.roomCode}`,
          entityType: 'WEBINAR',
          entityId: webinar._id,
          isRead: false,
          createdAt: new Date(),
        });
      } catch (e) {
        // ignore duplicate
      }
    }

    return {
      success: true,
      registered: true,
      paymentId: cfStatusResult.paymentId,
      message: 'Payment verified and ticket confirmed successfully!',
    };
  }

  /**
   * Get single webinar details
   */
  static async getWebinarByIdOrSlug(identifier, userId = null) {
    const webinar = await this.findWebinarDoc(identifier);
    if (!webinar) return null;

    const populated = await Webinar.findById(webinar._id)
      .populate('instructorId', 'firstName lastName email profilePhoto headline bio')
      .lean();

    const instructor = populated.instructorId || {};
    const startTime = new Date(populated.startTime);
    const endTime = new Date(populated.endTime);
    const createdAt = new Date(populated.createdAt);
    const now = new Date();

    const isWithin2HoursOfStart = (now.getTime() - startTime.getTime()) < 2 * 60 * 60 * 1000;
    const isWithin2HoursOfCreation = (now.getTime() - createdAt.getTime()) < 2 * 60 * 60 * 1000;

    const isLive = populated.status === 'LIVE' || (startTime <= now && endTime > now && isWithin2HoursOfStart && isWithin2HoursOfCreation && populated.status !== 'COMPLETED');

    const registeredUserIds = Array.isArray(populated.registrations)
      ? populated.registrations.map((id) => id?.toString())
      : [];
    const isUserRegistered = userId ? registeredUserIds.includes(userId.toString()) : false;

    return {
      ...populated,
      id: populated._id,
      isLive,
      status: isLive ? 'LIVE' : (now > endTime || !isWithin2HoursOfStart ? 'COMPLETED' : populated.status),
      instructorName: `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim(),
      instructorAvatar: instructor.profilePhoto || null,
      instructorHeadline: instructor.headline || 'Lead Instructor & Workshop Host',
      registrationsCount: registeredUserIds.length,
      isUserRegistered,
      date: startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  }

  /**
   * Real-Time Live Classroom: Get full live room state, access authorization & metadata
   */
  static async getLiveRoomState(roomCodeOrId, userId = null) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      const booking = await this.findBookingDoc(roomCodeOrId);
      if (booking) {
        return this.getConsultationRoomState(booking, userId);
      }
      throw new Error('Webinar room not found');
    }

    const populated = await Webinar.findById(webinar._id)
      .populate('instructorId', 'firstName lastName email profilePhoto headline bio')
      .lean();

    const instructor = populated.instructorId || {};
    const instructorName = `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim();
    const instructorAvatar = instructor.profilePhoto || null;
    const instructorHeadline = instructor.headline || 'Lead Instructor & Workshop Host';
    const roomCode = populated.roomCode || `wb-${populated._id.toString().slice(-8)}`;

    const registeredUserIds = Array.isArray(populated.registrations)
      ? populated.registrations.map((id) => id?.toString())
      : [];

    let isHost = false;
    let isRegistered = false;
    let currentUser = null;
    let admissionStatus = null;

    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) {
        const participant = (populated.waitingParticipants || []).find(
          (entry) => entry.userId?.toString() === userId.toString()
        );
        admissionStatus = participant?.status || null;
        currentUser = {
          id: user._id.toString(),
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          avatar: user.profilePhoto || null,
          role: user.role,
          admissionStatus,
        };
        isHost = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ||
          (instructor._id && instructor._id.toString() === userId.toString());
        isRegistered = isHost || registeredUserIds.includes(userId.toString());
        if (isHost || admissionStatus === 'ADMITTED') {
          if (!roomPresenceHeartbeatMap.has(roomCode)) {
            roomPresenceHeartbeatMap.set(roomCode, new Map());
          }
          roomPresenceHeartbeatMap.get(roomCode).set(userId.toString(), Date.now());
          if (isHost) roomPresenceHeartbeatMap.get(roomCode).set('HOST', Date.now());
        }
      }
    }

    const hasAccess = isHost || isRegistered;
    const canViewClassroom = isHost || admissionStatus === 'ADMITTED';
    if (userId && (isHost || admissionStatus === 'ADMITTED')) {
      const liveDoc = await Webinar.findById(webinar._id);
      if (liveDoc) {
        if (!Array.isArray(liveDoc.attendance)) liveDoc.attendance = [];
        if (!liveDoc.attendance.some((id) => id.toString() === userId.toString())) {
          liveDoc.attendance.push(new mongoose.Types.ObjectId(userId));
        }
        if (!Array.isArray(liveDoc.attendanceLogs)) liveDoc.attendanceLogs = [];
        const activeLog = liveDoc.attendanceLogs.find(
          (entry) => entry.userId?.toString() === userId.toString() && !entry.leftAt
        );
        if (!activeLog && currentUser) {
          liveDoc.attendanceLogs.push({
            userId: new mongoose.Types.ObjectId(userId),
            userName: currentUser.name || 'Student',
            userEmail: currentUser.email || '',
            role: isHost ? 'HOST' : 'STUDENT',
            joinedAt: new Date(),
            durationMinutes: 0,
          });
        }
        await liveDoc.save();
      }
    }

    // Dynamic resources if attached
    const resources = Array.isArray(populated.resources) ? populated.resources : [];

    // Format chat messages
    const chatMessages = (populated.chatMessages || []).map((msg) => ({
      id: msg.id || msg._id?.toString() || new mongoose.Types.ObjectId().toString(),
      senderId: msg.senderId?.toString() || null,
      senderName: msg.senderName || 'Attendee',
      senderRole: msg.senderRole || 'STUDENT',
      senderAvatar: msg.senderAvatar || null,
      message: msg.message,
      createdAt: msg.createdAt || new Date(),
    }));

    // Format Q&A
    const qa = (populated.qa || []).map((q) => {
      const upvoters = Array.isArray(q.upvotes) ? q.upvotes.map((u) => u?.toString()) : [];
      return {
        id: q.id || q._id?.toString() || new mongoose.Types.ObjectId().toString(),
        question: q.question,
        senderId: q.senderId?.toString() || null,
        senderName: q.senderName || 'Anonymous',
        senderAvatar: q.senderAvatar || null,
        upvotesCount: upvoters.length,
        hasUpvoted: userId ? upvoters.includes(userId.toString()) : false,
        answered: Boolean(q.answered),
        answeredAt: q.answeredAt || null,
        createdAt: q.createdAt || new Date(),
      };
    });

    // Format raised hands
    const raisedHands = (populated.raisedHands || []).map((rh) => ({
      userId: rh.userId?.toString(),
      userName: rh.userName || 'Student',
      userAvatar: rh.userAvatar || null,
      raisedAt: rh.raisedAt || new Date(),
      canSpeak: Boolean(rh.canSpeak),
    }));

    // Format Attendees (Host + Connected Students)
    const attendeesMap = new Map();
    const instructorOnline = isRoomUserOnline(roomCode, instructor._id) || isRoomUserOnline(roomCode, 'HOST');
    // 1. Host
    if (instructor._id) {
      attendeesMap.set(instructor._id.toString(), {
        userId: instructor._id.toString(),
        userName: instructorName,
        userAvatar: instructorAvatar,
        role: 'HOST',
        isOnline: instructorOnline,
      });
    }

    // 2. Active Attendance Logs
    (populated.attendanceLogs || []).forEach((log) => {
      if (log.userId) {
        const idStr = log.userId.toString();
        if (!attendeesMap.has(idStr)) {
          attendeesMap.set(idStr, {
            userId: idStr,
            userName: log.userName || 'Student',
            userAvatar: null,
            role: log.role || 'STUDENT',
            isOnline: !log.leftAt && isRoomUserOnline(roomCode, idStr),
            joinedAt: log.joinedAt,
          });
        }
      }
    });

    // 3. Registered Users
    (populated.registrations || []).forEach((reg) => {
      if (reg) {
        const idStr = (reg._id || reg).toString();
        if (!attendeesMap.has(idStr)) {
          attendeesMap.set(idStr, {
            userId: idStr,
            userName: reg.firstName ? `${reg.firstName} ${reg.lastName || ''}`.trim() : 'Registered Student',
            userAvatar: reg.profilePhoto || null,
            role: 'STUDENT',
            isOnline: false,
          });
        }
      }
    });

    // 4. Current User if present
    if (currentUser && !attendeesMap.has(currentUser.id)) {
      attendeesMap.set(currentUser.id, {
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        role: isHost ? 'HOST' : 'STUDENT',
        isOnline: isHost || admissionStatus === 'ADMITTED'
          ? isRoomUserOnline(roomCode, currentUser.id)
          : false,
      });
    }

    const attendees = Array.from(attendeesMap.values());
    const onlineAttendees = attendees.filter((a) => a.isOnline !== false);
    const onlineCount = onlineAttendees.length;
    const totalAttendanceCount = Math.max(attendees.length, registeredUserIds.length, 1);

    // Load private notes for user
    let userNotes = '';
    if (userId && Array.isArray(populated.userNotes)) {
      const foundNote = populated.userNotes.find((n) => n.userId?.toString() === userId.toString());
      if (foundNote) {
        userNotes = foundNote.notes || '';
      }
    }

    return {
      id: populated._id.toString(),
      _id: populated._id.toString(),
      roomCode,
      title: populated.title,
      description: populated.description || '',
      category: populated.category || 'DevOps / Cloud',
      startTime: populated.startTime,
      endTime: populated.endTime,
      actualStartedAt: populated.actualStartedAt || null,
      actualEndedAt: populated.actualEndedAt || null,
      status: populated.status || 'SCHEDULED',
      restartCount: populated.restartCount || 0,
      canRestart: Boolean(
        isHost &&
        populated.status === 'COMPLETED' &&
        (populated.restartCount || 0) < 1 &&
        Date.now() >= new Date(populated.startTime).getTime() &&
        Date.now() < new Date(populated.endTime).getTime()
      ),
      price: populated.price || 0,
      currency: populated.currency || 'INR',
      capacity: populated.capacity || 100,
      registrationsCount: totalAttendanceCount,
      attendanceCount: totalAttendanceCount,
      onlineCount,
      attendees: canViewClassroom ? attendees : [],
      instructor: {
        id: instructor._id?.toString(),
        name: instructorName,
        avatar: instructorAvatar,
        headline: instructorHeadline,
        bio: instructor.bio || '',
      },
      instructorOnline,
      hasAccess,
      isHost,
      isRegistered,
      currentUser,
      resources: canViewClassroom ? resources : [],
      chatMessages: canViewClassroom ? chatMessages : [],
      qa: canViewClassroom ? qa : [],
      raisedHands: canViewClassroom ? raisedHands : [],
      userNotes,
      livekitServerUrl: process.env.LIVEKIT_URL || 'wss://edtech-livekit.internal',
      hostStreamState: canViewClassroom ? roomBroadcastStateMap.get(roomCode) || {
        cameraEnabled: true,
        micEnabled: true,
        screenShareActive: false,
      } : {},
    };
  }

  static async joinWebinarLobby(roomCode, userId) {
    const webinar = await this.findWebinarDoc(roomCode);
    if (!webinar) throwWebinarAccessError('Webinar room not found', 404);

    const user = await User.findById(userId).lean();
    if (!user) throwWebinarAccessError('User not found', 404);
    if (['COMPLETED', 'CANCELLED'].includes(webinar.status)) {
      throwWebinarAccessError('This webinar is no longer accepting participants', 410);
    }

    const isHost = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ||
      webinar.instructorId?.toString() === userId.toString();
    if (isHost) return { status: 'HOST', roomCode: webinar.roomCode };
    if (user.role !== 'STUDENT') throwWebinarAccessError('Only registered students can enter the waiting room');

    const isRegistered = (webinar.registrations || []).some((id) => id.toString() === userId.toString());
    if (!isRegistered) throwWebinarAccessError('Register for this webinar before joining the waiting room');

    const roomParticipants = webinar.waitingParticipants || [];
    const existing = roomParticipants.find((participant) => participant.userId?.toString() === userId.toString());
    if (!existing) {
      const participant = {
        userId: user._id,
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
        userEmail: user.email || '',
        userAvatar: user.profilePhoto || null,
        status: 'WAITING',
        joinedAt: new Date(),
        updatedAt: new Date(),
      };
      const added = await Webinar.updateOne(
        { _id: webinar._id, 'waitingParticipants.userId': { $ne: user._id } },
        { $push: { waitingParticipants: participant } }
      );
      if (!added.modifiedCount) {
        await Webinar.updateOne(
          { _id: webinar._id, waitingParticipants: { $elemMatch: { userId: user._id, status: 'LEFT' } } },
          { $set: { 'waitingParticipants.$.status': 'WAITING', 'waitingParticipants.$.updatedAt': new Date() } }
        );
      }
    } else if (existing.status === 'LEFT') {
      await Webinar.updateOne(
        { _id: webinar._id, waitingParticipants: { $elemMatch: { userId: user._id, status: 'LEFT' } } },
        { $set: { 'waitingParticipants.$.status': 'WAITING', 'waitingParticipants.$.updatedAt': new Date() } }
      );
    }

    if (!roomPresenceHeartbeatMap.has(webinar.roomCode)) {
      roomPresenceHeartbeatMap.set(webinar.roomCode, new Map());
    }
    roomPresenceHeartbeatMap.get(webinar.roomCode).set(userId.toString(), Date.now());
    publishWebinarLobbyUpdate(webinar.instructorId, webinar.roomCode);

    const updated = await Webinar.findById(webinar._id).select('waitingParticipants').lean();
    const state = updated?.waitingParticipants?.find((participant) => participant.userId?.toString() === userId.toString());
    return { status: state?.status || 'WAITING', roomCode: webinar.roomCode };
  }

  static async getWebinarLobbyState(roomCode, userId) {
    const webinar = await this.findWebinarDoc(roomCode);
    if (!webinar) throwWebinarAccessError('Webinar room not found', 404);
    const user = await User.findById(userId).lean();
    if (!user) throwWebinarAccessError('User not found', 404);

    const isHost = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ||
      webinar.instructorId?.toString() === userId.toString();
    if (!isHost && !(webinar.registrations || []).some((id) => id.toString() === userId.toString())) {
      throwWebinarAccessError('Register for this webinar before joining the waiting room');
    }

    if (!roomPresenceHeartbeatMap.has(webinar.roomCode)) {
      roomPresenceHeartbeatMap.set(webinar.roomCode, new Map());
    }
    roomPresenceHeartbeatMap.get(webinar.roomCode).set(userId.toString(), Date.now());
    if (isHost) roomPresenceHeartbeatMap.get(webinar.roomCode).set('HOST', Date.now());

    const populated = await Webinar.findById(webinar._id)
      .populate('instructorId', 'firstName lastName profilePhoto headline')
      .select('title status startTime endTime instructorId waitingParticipants')
      .lean();
    const instructor = populated.instructorId || {};
    const participants = populated.waitingParticipants || [];
    const currentParticipant = participants.find((entry) => entry.userId?.toString() === userId.toString());
    const waiting = isHost
      ? participants
          .filter((entry) => entry.status === 'WAITING')
          .map((entry) => ({
            userId: entry.userId.toString(),
            name: entry.userName,
            email: entry.userEmail,
            avatar: entry.userAvatar,
            joinedAt: entry.joinedAt,
          }))
          .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime())
      : [];

    return {
      roomCode: webinar.roomCode,
      title: populated.title,
      status: populated.status,
      startTime: populated.startTime,
      endTime: populated.endTime,
      instructor: {
        id: instructor._id?.toString(),
        name: `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim(),
        avatar: instructor.profilePhoto || null,
        headline: instructor.headline || '',
      },
      instructorOnline: isRoomUserOnline(webinar.roomCode, webinar.instructorId) ||
        isRoomUserOnline(webinar.roomCode, 'HOST'),
      isHost,
      admissionStatus: isHost ? 'HOST' : currentParticipant?.status || null,
      waitingCount: isHost ? waiting.length : undefined,
      waitingParticipants: isHost ? waiting : undefined,
    };
  }

  static async admitWebinarStudent(roomCode, hostId, targetUserId) {
    const webinar = await this.findWebinarDoc(roomCode);
    if (!webinar) throwWebinarAccessError('Webinar room not found', 404);
    const host = await User.findById(hostId).lean();
    const isHost = host && (host.role === 'SUPER_ADMIN' || host.role === 'ADMIN' ||
      webinar.instructorId?.toString() === hostId.toString());
    if (!isHost) throwWebinarAccessError('Only the webinar instructor can admit students');
    if (webinar.status !== 'LIVE') throwWebinarAccessError('Start the webinar before admitting students', 409);
    if (!(webinar.registrations || []).some((id) => id.toString() === targetUserId.toString())) {
      throwWebinarAccessError('This student is not registered for the webinar');
    }

    const participant = (webinar.waitingParticipants || []).find(
      (entry) => entry.userId?.toString() === targetUserId.toString()
    );
    if (!participant || !['WAITING', 'ADMITTED'].includes(participant.status)) {
      throwWebinarAccessError('This student is not currently waiting', 409);
    }
    if (participant.status !== 'ADMITTED') {
      participant.status = 'ADMITTED';
      participant.updatedAt = new Date();
      await webinar.save();
    }

    publishWebinarAdmission(targetUserId, webinar.roomCode, 'ADMITTED');
    publishWebinarLobbyUpdate(webinar.instructorId, webinar.roomCode);
    return { userId: targetUserId.toString(), status: 'ADMITTED' };
  }

  static async assertWebinarMediaAccess(roomCode, userId) {
    const webinar = await this.findWebinarDoc(roomCode);
    if (!webinar) return null;
    if (!userId) throwWebinarAccessError('Sign in before accessing webinar media');
    const user = await User.findById(userId).select('role').lean();
    if (!user) throwWebinarAccessError('User not found', 404);
    const isHost = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ||
      webinar.instructorId?.toString() === userId.toString();
    if (webinar.status !== 'LIVE') throwWebinarAccessError('The webinar is not live', 409);
    if (isHost) return { webinar, user, isHost: true };

    const isRegistered = (webinar.registrations || []).some((id) => id.toString() === userId.toString());
    const isAdmitted = (webinar.waitingParticipants || []).some(
      (entry) => entry.userId?.toString() === userId.toString() && entry.status === 'ADMITTED'
    );
    if (!isRegistered || !isAdmitted) throwWebinarAccessError('The instructor has not admitted you to this webinar');
    return { webinar, user, isHost: false };
  }

  /**
   * Real-Time 1-on-1 Consultation Classroom Room State
   */
  static async getConsultationRoomState(booking, userId = null) {
    let isHost = false;
    let isStudent = false;
    let isSuperAdmin = false;
    let currentUser = null;

    if (userId) {
      const user = await User.findById(userId).lean();
      if (user) {
        currentUser = {
          id: user._id.toString(),
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          email: user.email,
          avatar: user.profilePhoto || null,
          role: user.role,
        };
        isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
        const instructorIdStr = (booking.instructorId?._id || booking.instructorId)?.toString();
        const studentIdStr = (booking.userId?._id || booking.userId)?.toString();
        isHost = isSuperAdmin || Boolean(instructorIdStr && instructorIdStr === userId.toString());
        isStudent = Boolean(studentIdStr && studentIdStr === userId.toString());
      }
    }

    const instructor = booking.instructorId || {};
    const student = booking.userId || {};
    const instructorName = `${instructor.firstName || 'Mentor'} ${instructor.lastName || ''}`.trim();
    const studentName = `${student.firstName || 'Student'} ${student.lastName || ''}`.trim();

    // Session is already paid and confirmed: grant immediate direct access
    const hasAccess = true;

    if (!currentUser) {
      currentUser = isHost
        ? {
            id: instructor._id?.toString() || 'mentor',
            name: instructorName,
            email: instructor.email || '',
            avatar: instructor.profilePhoto || null,
            role: 'HOST',
          }
        : {
            id: student._id?.toString() || 'student',
            name: studentName,
            email: student.email || '',
            avatar: student.profilePhoto || null,
            role: 'STUDENT',
          };
    }

    const roomCode = booking.meetingRoomCode;
    const instructorIdStr = (booking.instructorId?._id || booking.instructorId)?.toString() || 'mentor';
    const studentIdStr = (booking.userId?._id || booking.userId)?.toString() || 'student';

    // Heartbeat tracking: register this user as currently online in this consultation room
    if (userId) {
      if (!roomPresenceHeartbeatMap.has(roomCode)) {
        roomPresenceHeartbeatMap.set(roomCode, new Map());
      }
      roomPresenceHeartbeatMap.get(roomCode).set(userId.toString(), Date.now());
      if (isHost) {
        roomPresenceHeartbeatMap.get(roomCode).set('HOST', Date.now());
      }
      if (isStudent) {
        roomPresenceHeartbeatMap.get(roomCode).set('STUDENT', Date.now());
      }
    }

    const roomPresence = roomPresenceHeartbeatMap.get(roomCode);
    const now = Date.now();
    const PRESENCE_TIMEOUT_MS = 15000; // 15 seconds heartbeat window (clients poll every 4s)

    const instructorActive = Boolean(
      isHost ||
      (roomPresence && (
        (roomPresence.has(instructorIdStr) && now - roomPresence.get(instructorIdStr) < PRESENCE_TIMEOUT_MS) ||
        (roomPresence.has('HOST') && now - roomPresence.get('HOST') < PRESENCE_TIMEOUT_MS)
      ))
    );

    const studentActive = Boolean(
      isStudent ||
      (roomPresence && (
        (roomPresence.has(studentIdStr) && now - roomPresence.get(studentIdStr) < PRESENCE_TIMEOUT_MS) ||
        (roomPresence.has('STUDENT') && now - roomPresence.get('STUDENT') < PRESENCE_TIMEOUT_MS)
      ))
    );

    const attendees = [
      {
        userId: instructorIdStr,
        userName: instructorName,
        userAvatar: instructor.profilePhoto || null,
        role: 'HOST',
        isOnline: instructorActive,
      },
      {
        userId: studentIdStr,
        userName: studentName,
        userAvatar: student.profilePhoto || null,
        role: 'STUDENT',
        isOnline: studentActive,
      },
    ];

    const onlineCount = (instructorActive ? 1 : 0) + (studentActive ? 1 : 0) || 1;

    // Strict slot time window validation based on scheduled date & time
    const nowMs = Date.now();
    const startTimeMs = booking.startTime ? new Date(booking.startTime).getTime() : nowMs;
    const endTimeMs = booking.endTime ? new Date(booking.endTime).getTime() : startTimeMs + 45 * 60000;

    const isPastScheduledEndTime = nowMs > endTimeMs;
    const isWithinSlotTime = nowMs <= endTimeMs;

    let status = 'LIVE';
    let canRejoin = false;

    if (isPastScheduledEndTime) {
      // Scheduled time and date have ended -> strictly COMPLETED and no rejoining allowed
      status = 'COMPLETED';
      canRejoin = false;
      if (booking.status !== 'ATTENDED') {
        Booking.updateOne({ _id: booking._id }, { $set: { status: 'ATTENDED', actualEndedAt: booking.endTime } }).catch(() => {});
      }
    } else {
      // Within scheduled date & time -> active and allows rejoining
      status = 'LIVE';
      canRejoin = true;
      if (booking.status === 'ATTENDED') {
        Booking.updateOne({ _id: booking._id }, { $set: { status: 'CONFIRMED', actualEndedAt: null } }).catch(() => {});
      }
    }

    return {
      id: booking._id.toString(),
      _id: booking._id.toString(),
      roomCode: booking.meetingRoomCode,
      title: `1-on-1 Mentorship: ${instructorName} & ${studentName}`,
      description: booking.notes || `Private 1-on-1 Consultation session with ${instructorName}`,
      category: '1-on-1 Mentorship',
      startTime: booking.startTime ? new Date(booking.startTime).toISOString() : new Date().toISOString(),
      endTime: booking.endTime ? new Date(booking.endTime).toISOString() : new Date(Date.now() + 45 * 60000).toISOString(),
      actualStartedAt: booking.actualStartedAt
        ? new Date(booking.actualStartedAt).toISOString()
        : booking.startTime
        ? new Date(booking.startTime).toISOString()
        : new Date().toISOString(),
      actualEndedAt: status === 'COMPLETED' ? (booking.actualEndedAt ? new Date(booking.actualEndedAt).toISOString() : new Date().toISOString()) : null,
      status,
      canRejoin,
      isWithinSessionWindow: isWithinSlotTime,
      price: booking.fee || 0,
      currency: booking.currency || 'INR',
      capacity: 2,
      registrationsCount: 2,
      attendanceCount: 2,
      onlineCount,
      attendees,
      instructor: {
        id: instructor._id?.toString(),
        name: instructorName,
        avatar: instructor.profilePhoto || null,
        headline: instructor.headline || 'Software Engineer & Mentor',
        bio: instructor.bio || '',
      },
      hasAccess,
      isHost,
      isRegistered: true,
      currentUser,
      resources: [],
      chatMessages: (booking.chatMessages || []).map((msg) => ({
        id: msg.id || msg._id?.toString() || new mongoose.Types.ObjectId().toString(),
        senderId: msg.senderId?.toString() || null,
        senderName: msg.senderName || 'Participant',
        senderRole: msg.senderRole || 'STUDENT',
        senderAvatar: msg.senderAvatar || null,
        message: msg.message,
        createdAt: msg.createdAt || new Date(),
      })),
      qa: [],
      raisedHands: [],
      userNotes: booking.notes || '',
      livekitServerUrl: process.env.LIVEKIT_URL || 'wss://edtech-livekit.internal',
      hostStreamState: roomBroadcastStateMap.get(booking.meetingRoomCode) || {
        cameraEnabled: true,
        micEnabled: true,
        screenShareActive: false,
      },
    };
  }

  /**
   * LiveKit Token Generation: Authenticate, validate access & generate short-lived JWT token
   */
  static async generateLiveKitToken(roomCodeOrId, userId) {
    if (!userId) {
      throw new Error('Authentication required to obtain live room token');
    }

    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      const booking = await this.findBookingDoc(roomCodeOrId);
      if (booking) {
        return this.generateConsultationLiveKitToken(booking, userId);
      }
      throw new Error('Webinar room not found');
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    const isHost =
      (webinar.instructorId && webinar.instructorId.toString() === userId.toString()) ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN';

    const registeredUserIds = Array.isArray(webinar.registrations)
      ? webinar.registrations.map((id) => id?.toString())
      : [];

    const isRegistered = isHost || registeredUserIds.includes(userId.toString());
    if (!isHost && !isRegistered) {
      return {
        allowed: false,
        requiresRegistration: true,
        price: webinar.price,
        currency: webinar.currency || 'INR',
        message: 'Registration is required to join this webinar',
      };
    }

    if (webinar.status !== 'LIVE') {
      return { allowed: false, message: 'The webinar is not live' };
    }

    const isAdmitted = isHost || (webinar.waitingParticipants || []).some(
      (participant) => participant.userId?.toString() === userId.toString() && participant.status === 'ADMITTED'
    );
    if (!isAdmitted) {
      return { allowed: false, requiresAdmission: true, message: 'The instructor has not admitted you yet' };
    }

    // Record attendance log
    if (!Array.isArray(webinar.attendanceLogs)) webinar.attendanceLogs = [];
    const existingLog = webinar.attendanceLogs.find(
      (log) => log.userId?.toString() === userId.toString() && !log.leftAt
    );
    if (!existingLog) {
      webinar.attendanceLogs.push({
        userId: new mongoose.Types.ObjectId(userId),
        userName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        userEmail: user.email,
        role: isHost ? 'HOST' : 'STUDENT',
        joinedAt: new Date(),
        durationMinutes: 0,
      });
      if (!Array.isArray(webinar.attendance)) webinar.attendance = [];
      if (!webinar.attendance.some((id) => id.toString() === userId.toString())) {
        webinar.attendance.push(new mongoose.Types.ObjectId(userId));
      }
      await webinar.save();
    }

    try {
      const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
      const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret_livekit_key_2026_edtech';
      const serverUrl = process.env.LIVEKIT_URL || 'wss://edtech-livekit.internal';

      const baseRoomName = webinar.roomCode || `webinar_${webinar._id.toString()}`;
      const roomName = webinar.restartCount
        ? `${baseRoomName}-restart-${webinar.restartCount}`
        : baseRoomName;
      const identity = `user_${user._id.toString()}`;
      const userName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();
      const userRole = isHost ? 'HOST' : 'STUDENT';

      const at = new AccessToken(apiKey, apiSecret, {
        identity,
        name: userName,
        metadata: JSON.stringify({
          role: userRole,
          avatar: user.profilePhoto || null,
          name: userName,
        }),
        ttl: '6h',
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: isHost,
        canPublishData: true,
        canSubscribe: true,
      });

      const token = await at.toJwt();

      return {
        allowed: true,
        token,
        serverUrl,
        role: userRole,
        isHost,
        roomCode: webinar.roomCode,
        roomName,
        webinarStatus: webinar.status || 'SCHEDULED',
        user: {
          id: user._id.toString(),
          name: userName,
          avatar: user.profilePhoto || null,
          role: userRole,
        },
      };
    } catch (err) {
      console.error('LiveKit token generation failed:', err);
      throw new Error(`Failed to generate LiveKit token: ${err.message || 'Server error'}`);
    }
  }

  /**
   * LiveKit Token Generation for 1-on-1 Consultation Session
   */
  static async generateConsultationLiveKitToken(booking, userId) {
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    const instructorIdStr = (booking.instructorId?._id || booking.instructorId)?.toString();
    const studentIdStr = (booking.userId?._id || booking.userId)?.toString();
    const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isHost = isSuperAdmin || Boolean(instructorIdStr && instructorIdStr === userId.toString());
    const isStudent = Boolean(studentIdStr && studentIdStr === userId.toString());

    if (!isHost && !isStudent && !isSuperAdmin) {
      return {
        allowed: false,
        message: 'You are not authorized to join this private consultation session.',
      };
    }

    try {
      const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
      const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret_livekit_key_2026_edtech';
      const serverUrl = process.env.LIVEKIT_URL || 'wss://edtech-livekit.internal';

      const roomName = booking.meetingRoomCode;
      const identity = `user_${user._id.toString()}`;
      const userName = `${user.firstName || 'User'} ${user.lastName || ''}`.trim();
      const userRole = isHost ? 'HOST' : 'STUDENT';

      const at = new AccessToken(apiKey, apiSecret, {
        identity,
        name: userName,
        metadata: JSON.stringify({
          role: userRole,
          avatar: user.profilePhoto || null,
          name: userName,
          bookingCode: booking.bookingCode,
        }),
        ttl: '6h',
      });

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true,
      });

      const token = await at.toJwt();

      const instructor = booking.instructorId || {};
      const student = booking.userId || {};
      const instructorName = `${instructor.firstName || 'Mentor'} ${instructor.lastName || ''}`.trim();
      const studentName = `${student.firstName || 'Student'} ${student.lastName || ''}`.trim();

      return {
        allowed: true,
        token,
        serverUrl,
        role: userRole,
        isHost,
        roomCode: booking.meetingRoomCode,
        roomName: `1-on-1 Mentorship: ${instructorName} & ${studentName}`,
        webinarStatus: 'LIVE',
        user: {
          id: user._id.toString(),
          name: userName,
          avatar: user.profilePhoto || null,
          role: userRole,
        },
      };
    } catch (err) {
      console.error('Consultation LiveKit token generation failed:', err);
      throw new Error(`Failed to generate consultation LiveKit token: ${err.message || 'Server error'}`);
    }
  }

  /**
   * Host starts the webinar (Changes status to LIVE)
   */
  static async startWebinar(roomCodeOrId, userId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      const booking = await this.findBookingDoc(roomCodeOrId);
      if (booking) {
        booking.actualStartedAt = new Date();
        await booking.save();
        return {
          success: true,
          status: 'LIVE',
          actualStartedAt: booking.actualStartedAt,
          message: 'Consultation session is LIVE',
        };
      }
      throw new Error('Webinar not found');
    }

    const instructorIdStr = (webinar.instructorId?._id || webinar.instructorId)?.toString();
    const user = await User.findById(userId).lean();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const isHost = Boolean(instructorIdStr && userId && instructorIdStr === userId.toString());

    if (!isHost && !isAdmin) {
      throw new Error('Only the instructor or host can start the webinar');
    }
    if (['COMPLETED', 'CANCELLED'].includes(webinar.status)) {
      throwWebinarAccessError('A completed or cancelled webinar cannot be restarted', 409);
    }

    webinar.status = 'LIVE';
    webinar.actualStartedAt = new Date();
    await webinar.save();

    return {
      success: true,
      status: 'LIVE',
      actualStartedAt: webinar.actualStartedAt,
      message: 'Webinar is now LIVE',
    };
  }

  /**
   * Host ends the webinar (Changes status to COMPLETED & closes attendance)
   */
  static async endWebinar(roomCodeOrId, userId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      const booking = await this.findBookingDoc(roomCodeOrId);
      if (booking) {
        booking.status = 'ATTENDED';
        booking.actualEndedAt = new Date();
        await booking.save();
        return {
          success: true,
          status: 'COMPLETED',
          actualEndedAt: booking.actualEndedAt,
          totalAttendees: 2,
          totalQuestions: 0,
          totalMessages: booking.chatMessages?.length || 0,
          message: 'Consultation session completed successfully',
        };
      }
      throw new Error('Webinar not found');
    }

    const instructorIdStr = (webinar.instructorId?._id || webinar.instructorId)?.toString();
    const user = await User.findById(userId).lean();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const isHost = Boolean(instructorIdStr && userId && instructorIdStr === userId.toString());

    if (!isHost && !isAdmin) {
      throw new Error('Only the instructor or host can end the webinar');
    }

    const now = new Date();
    webinar.status = 'COMPLETED';
    webinar.actualEndedAt = now;

    // Finalize all open attendance logs
    if (Array.isArray(webinar.attendanceLogs)) {
      webinar.attendanceLogs.forEach((log) => {
        if (!log.leftAt) {
          log.leftAt = now;
          const duration = Math.round((now.getTime() - new Date(log.joinedAt).getTime()) / 60000);
          log.durationMinutes = Math.max(1, duration);
        }
      });
    }

    const participantsToNotify = (webinar.waitingParticipants || [])
      .filter((participant) => ['WAITING', 'ADMITTED'].includes(participant.status))
      .map((participant) => participant.userId?.toString())
      .filter(Boolean);
    (webinar.waitingParticipants || []).forEach((participant) => {
      if (participant.status === 'WAITING') {
        participant.status = 'LEFT';
        participant.updatedAt = now;
      }
    });
    await webinar.save();
    roomSignalQueueMap.delete(webinar.roomCode);
    roomLatestOfferMap.delete(webinar.roomCode);
    roomBroadcastStateMap.delete(webinar.roomCode);
    participantsToNotify.forEach((participantId) =>
      publishWebinarAdmission(participantId, webinar.roomCode, 'ENDED')
    );
    publishWebinarLobbyUpdate(webinar.instructorId, webinar.roomCode);

    return {
      success: true,
      status: 'COMPLETED',
      actualEndedAt: webinar.actualEndedAt,
      totalAttendees: webinar.attendance?.length || 0,
      totalQuestions: webinar.qa?.length || 0,
      totalMessages: webinar.chatMessages?.length || 0,
      message: 'Webinar session completed successfully',
    };
  }

  static async restartWebinar(roomCode, userId) {
    const webinar = await this.findWebinarDoc(roomCode);
    if (!webinar) throwWebinarAccessError('Webinar room not found', 404);
    const user = await User.findById(userId).select('role').lean();
    if (!user) throwWebinarAccessError('User not found', 404);

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isInstructor = webinar.instructorId?.toString() === userId.toString();
    if (!isAdmin && !isInstructor) {
      throwWebinarAccessError('Only the webinar instructor can restart this session');
    }

    const now = new Date();
    if (now < new Date(webinar.startTime) || now >= new Date(webinar.endTime)) {
      throwWebinarAccessError('A webinar can only be restarted between its scheduled start and end times', 409);
    }
    if (webinar.status !== 'COMPLETED' || (webinar.restartCount || 0) >= 1) {
      throwWebinarAccessError('This webinar cannot be restarted again', 409);
    }

    const restartQuery = {
      _id: webinar._id,
      status: 'COMPLETED',
      $and: [
        { $or: [{ restartCount: { $lt: 1 } }, { restartCount: { $exists: false } }] },
        { startTime: { $lte: now } },
        { endTime: { $gt: now } },
      ],
    };
    if (!isAdmin) restartQuery.instructorId = user._id;

    await Webinar.updateOne(
      { _id: webinar._id, waitingParticipants: { $exists: false } },
      { $set: { waitingParticipants: [] } }
    );
    const restartedWebinar = await Webinar.findOneAndUpdate(
      restartQuery,
      {
        $set: {
          status: 'LIVE',
          actualStartedAt: now,
          actualEndedAt: null,
          restartedAt: now,
          'waitingParticipants.$[].status': 'LEFT',
          'waitingParticipants.$[].updatedAt': now,
        },
        $inc: { restartCount: 1 },
      },
      { new: true }
    );
    if (!restartedWebinar) {
      throwWebinarAccessError('This webinar was restarted already or is outside its scheduled time', 409);
    }

    roomSignalQueueMap.delete(restartedWebinar.roomCode);
    roomLatestOfferMap.delete(restartedWebinar.roomCode);
    roomBroadcastStateMap.delete(restartedWebinar.roomCode);

    let notificationsSent = true;
    const registeredIds = [...new Set(
      (restartedWebinar.registrations || [])
        .map((registeredId) => registeredId?.toString())
        .filter((registeredId) => registeredId && registeredId !== restartedWebinar.instructorId.toString())
    )];
    if (registeredIds.length) {
      try {
        await Notification.insertMany(
          registeredIds.map((registeredId) => ({
            notificationId: `notif_restart_${restartedWebinar._id}_${registeredId}`,
            userId: new mongoose.Types.ObjectId(registeredId),
            type: 'WEBINAR_RESTARTED',
            title: `Webinar Restarted: ${restartedWebinar.title}`,
            message: `The instructor restarted "${restartedWebinar.title}". You can join the waiting room during the scheduled session time.`,
            status: 'Started',
            meetingUrl: `/webinars/lobby/${restartedWebinar.roomCode}`,
            actionUrl: `/webinars/lobby/${restartedWebinar.roomCode}`,
            entityType: 'WEBINAR',
            entityId: restartedWebinar._id,
            isRead: false,
            createdAt: now,
          })),
          { ordered: false }
        );
      } catch (error) {
        notificationsSent = false;
        console.error(`[Webinar restart] Session ${restartedWebinar.roomCode} restarted but student notifications could not all be saved:`, error);
      }
    }

    publishWebinarLobbyUpdate(restartedWebinar.instructorId, restartedWebinar.roomCode);
    return {
      success: true,
      status: restartedWebinar.status,
      restartCount: restartedWebinar.restartCount,
      restartedAt: restartedWebinar.restartedAt,
      notificationsSent,
      message: 'Webinar restarted within its scheduled time window',
    };
  }

  /**
   * Send a chat message
   */
  static async sendChatMessage(roomCodeOrId, userId, messageText) {
    if (!messageText || !messageText.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      const booking = await this.findBookingDoc(roomCodeOrId);
      if (booking) {
        const user = await User.findById(userId).lean();
        const instructorIdStr = (booking.instructorId?._id || booking.instructorId)?.toString();
        const isHost = (instructorIdStr && instructorIdStr === userId.toString()) || user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
        const newMessage = {
          id: new mongoose.Types.ObjectId().toString(),
          senderId: new mongoose.Types.ObjectId(userId),
          senderName: `${user?.firstName || 'User'} ${user?.lastName || ''}`.trim(),
          senderRole: isHost ? 'HOST' : 'STUDENT',
          senderAvatar: user?.profilePhoto || null,
          message: messageText.trim(),
          createdAt: new Date(),
        };
        if (!Array.isArray(booking.chatMessages)) booking.chatMessages = [];
        booking.chatMessages.push(newMessage);
        await booking.save();
        return newMessage;
      }
      throw new Error('Webinar not found');
    }

    await this.assertWebinarMediaAccess(roomCodeOrId, userId);
    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const isHost =
      (webinar.instructorId && webinar.instructorId.toString() === userId.toString()) ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'ADMIN';

    const newMessage = {
      id: new mongoose.Types.ObjectId().toString(),
      senderId: new mongoose.Types.ObjectId(userId),
      senderName: `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
      senderRole: isHost ? 'HOST' : 'STUDENT',
      senderAvatar: user.profilePhoto || null,
      message: messageText.trim(),
      createdAt: new Date(),
    };

    if (!Array.isArray(webinar.chatMessages)) {
      webinar.chatMessages = [];
    }

    webinar.chatMessages.push(newMessage);
    await webinar.save();

    return newMessage;
  }

  /**
   * Submit a Q&A question
   */
  static async submitQuestion(roomCodeOrId, userId, questionText) {
    if (!questionText || !questionText.trim()) {
      throw new Error('Question content cannot be empty');
    }

    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');
    await this.assertWebinarMediaAccess(roomCodeOrId, userId);

    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    const newQa = {
      id: new mongoose.Types.ObjectId().toString(),
      question: questionText.trim(),
      senderId: new mongoose.Types.ObjectId(userId),
      senderName: `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
      senderAvatar: user.profilePhoto || null,
      upvotes: [],
      answered: false,
      createdAt: new Date(),
    };

    if (!Array.isArray(webinar.qa)) {
      webinar.qa = [];
    }

    webinar.qa.push(newQa);
    await webinar.save();

    return {
      ...newQa,
      upvotesCount: 0,
      hasUpvoted: false,
    };
  }

  /**
   * Upvote a question (toggle)
   */
  static async toggleUpvoteQuestion(roomCodeOrId, userId, qaId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');
    await this.assertWebinarMediaAccess(roomCodeOrId, userId);

    if (!Array.isArray(webinar.qa)) webinar.qa = [];
    const question = webinar.qa.find((q) => (q.id === qaId || q._id?.toString() === qaId));
    if (!question) throw new Error('Question not found');

    if (!Array.isArray(question.upvotes)) question.upvotes = [];

    const userObjId = new mongoose.Types.ObjectId(userId);
    const existingIndex = question.upvotes.findIndex((id) => id.toString() === userId.toString());

    let hasUpvoted = false;
    if (existingIndex > -1) {
      question.upvotes.splice(existingIndex, 1);
      hasUpvoted = false;
    } else {
      question.upvotes.push(userObjId);
      hasUpvoted = true;
    }

    await webinar.save();

    return {
      qaId,
      upvotesCount: question.upvotes.length,
      hasUpvoted,
    };
  }

  /**
   * Mark question as answered (Host only)
   */
  static async answerQuestion(roomCodeOrId, userId, qaId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');
    const access = await this.assertWebinarMediaAccess(roomCodeOrId, userId);

    const isHost = access.isHost;
    const user = await User.findById(userId).lean();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    if (!isHost && !isAdmin) {
      throw new Error('Only the instructor or host can mark questions as answered');
    }

    if (!Array.isArray(webinar.qa)) webinar.qa = [];
    const question = webinar.qa.find((q) => (q.id === qaId || q._id?.toString() === qaId));
    if (!question) throw new Error('Question not found');

    question.answered = true;
    question.answeredAt = new Date();
    await webinar.save();

    return {
      qaId,
      answered: true,
      answeredAt: question.answeredAt,
    };
  }

  /**
   * Toggle Raise Hand
   */
  static async toggleRaiseHand(roomCodeOrId, userId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');
    await this.assertWebinarMediaAccess(roomCodeOrId, userId);

    const user = await User.findById(userId).lean();
    if (!user) throw new Error('User not found');

    if (!Array.isArray(webinar.raisedHands)) webinar.raisedHands = [];

    const existingIndex = webinar.raisedHands.findIndex(
      (rh) => rh.userId?.toString() === userId.toString()
    );

    let isRaised = false;
    if (existingIndex > -1) {
      webinar.raisedHands.splice(existingIndex, 1);
      isRaised = false;
    } else {
      webinar.raisedHands.push({
        userId: new mongoose.Types.ObjectId(userId),
        userName: `${user.firstName || 'User'} ${user.lastName || ''}`.trim(),
        userAvatar: user.profilePhoto || null,
        raisedAt: new Date(),
        canSpeak: false,
      });
      isRaised = true;
    }

    await webinar.save();

    return {
      isRaised,
      raisedHands: webinar.raisedHands.map((rh) => ({
        userId: rh.userId?.toString(),
        userName: rh.userName,
        userAvatar: rh.userAvatar,
        raisedAt: rh.raisedAt,
        canSpeak: rh.canSpeak,
      })),
    };
  }

  /**
   * Allow student to speak (Host only)
   */
  static async allowStudentSpeak(roomCodeOrId, hostId, targetUserId, canSpeak) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');

    const isHost =
      (webinar.instructorId && webinar.instructorId.toString() === hostId.toString());
    const user = await User.findById(hostId).lean();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    if (!isHost && !isAdmin) {
      throw new Error('Only the instructor or host can grant speak permissions');
    }

    if (!Array.isArray(webinar.raisedHands)) webinar.raisedHands = [];

    const studentRh = webinar.raisedHands.find(
      (rh) => rh.userId?.toString() === targetUserId.toString()
    );

    if (studentRh) {
      studentRh.canSpeak = Boolean(canSpeak);
      await webinar.save();
    }

    return {
      targetUserId,
      canSpeak: Boolean(canSpeak),
    };
  }

  /**
   * Save private student notes
   */
  static async saveUserNotes(roomCodeOrId, userId, notesText) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      const booking = await this.findBookingDoc(roomCodeOrId);
      if (booking) {
        booking.notes = notesText || '';
        await booking.save();
        return { success: true, notes: booking.notes };
      }
      throw new Error('Webinar not found');
    }

    if (!Array.isArray(webinar.userNotes)) webinar.userNotes = [];

    const existingNote = webinar.userNotes.find(
      (n) => n.userId?.toString() === userId.toString()
    );

    if (existingNote) {
      existingNote.notes = notesText || '';
      existingNote.updatedAt = new Date();
    } else {
      webinar.userNotes.push({
        userId: new mongoose.Types.ObjectId(userId),
        notes: notesText || '',
        updatedAt: new Date(),
      });
    }

    await webinar.save();
    return { success: true, notes: notesText };
  }

  /**
   * Leave room attendance log
   */
  static async recordAttendanceLeave(roomCodeOrId, userId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) {
      if (userId && roomCodeOrId && roomPresenceHeartbeatMap.has(roomCodeOrId)) {
        roomPresenceHeartbeatMap.get(roomCodeOrId).delete(userId.toString());
      }
      return { success: true };
    }
    if (!userId) throwWebinarAccessError('Authentication required to leave the webinar', 401);
    const userIdString = userId.toString();
    const isHost = webinar.instructorId?.toString() === userIdString;
    const isRegistered = (webinar.registrations || []).some((id) => id.toString() === userIdString);
    if (!isHost && !isRegistered) throwWebinarAccessError('Not authorized to leave this webinar');
    roomPresenceHeartbeatMap.get(webinar.roomCode)?.delete(userIdString);
    const lobbyParticipant = (webinar.waitingParticipants || []).find(
      (participant) => participant.userId?.toString() === userIdString
    );
    if (lobbyParticipant?.status === 'WAITING') {
      lobbyParticipant.status = 'LEFT';
      lobbyParticipant.updatedAt = new Date();
      await webinar.save();
      publishWebinarLobbyUpdate(webinar.instructorId, webinar.roomCode);
      publishWebinarAdmission(userId, webinar.roomCode, 'LEFT');
    }
    if (!Array.isArray(webinar.attendanceLogs)) return { success: true };

    const activeLog = webinar.attendanceLogs.find(
      (log) => log.userId?.toString() === userId.toString() && !log.leftAt
    );

    if (activeLog) {
      activeLog.leftAt = new Date();
      activeLog.durationMinutes = Math.max(
        1,
        Math.round((activeLog.leftAt.getTime() - new Date(activeLog.joinedAt).getTime()) / 60000)
      );
      await webinar.save();
    }

    return { success: true };
  }

  /**
   * Real-time host broadcast state (camera, mic, screen) update
   */
  static async updateBroadcastState(roomCode, state, userId) {
    if (!roomCode) return { success: false };
    const webinar = await this.findWebinarDoc(roomCode);
    if (webinar) {
      const access = await this.assertWebinarMediaAccess(roomCode, userId);
      if (!access.isHost) throwWebinarAccessError('Only the instructor may publish webinar broadcast state');
    }
    const current = roomBroadcastStateMap.get(roomCode) || {
      cameraEnabled: true,
      micEnabled: true,
      screenShareActive: false,
      isInstructorSpeaking: false,
      audioLevel: 0,
    };
    const updated = { ...current, ...state, lastUpdatedAt: Date.now() };
    roomBroadcastStateMap.set(roomCode, updated);
    return { success: true, broadcastState: updated };
  }

  /**
   * WebRTC Signaling between participants in a room
   */
  static async sendSignal(roomCode, signalPayload, senderId) {
    if (!roomCode) return { success: false };
    const webinar = await this.findWebinarDoc(roomCode);
    let senderRole = 'PARTICIPANT';
    if (webinar) {
      const access = await this.assertWebinarMediaAccess(roomCode, senderId);
      senderRole = access.isHost ? 'HOST' : 'STUDENT';
    } else if (senderId) {
      const sender = await User.findById(senderId).select('role').lean();
      senderRole = sender?.role || senderRole;
    }
    if (!roomSignalQueueMap.has(roomCode)) {
      roomSignalQueueMap.set(roomCode, []);
    }
    const queue = roomSignalQueueMap.get(roomCode);
    const signalItem = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ...signalPayload,
      senderId: senderId || 'anon',
      senderRole: senderRole || 'PARTICIPANT',
      timestamp: Date.now(),
    };
    queue.push(signalItem);

    // If host sends an offer, cache it as latestOffer so joining students always receive it
    if (signalPayload && signalPayload.type === 'offer') {
      roomLatestOfferMap.set(roomCode, {
        signal: signalPayload,
        senderId: senderId || 'host',
        timestamp: Date.now(),
      });
    }

    if (queue.length > 50) {
      queue.splice(0, queue.length - 50);
    }
    return { success: true };
  }

  static async getSignals(roomCode, since = 0, excludeSenderId = null, userId = null) {
    if (!roomCode) {
      return { success: true, signals: [] };
    }
    const webinar = await this.findWebinarDoc(roomCode);
    if (webinar) await this.assertWebinarMediaAccess(roomCode, userId);
    const queue = roomSignalQueueMap.get(roomCode) || [];
    const effectiveExcludeSenderId = userId || excludeSenderId;
    const sinceNum = Number(since) || 0;
    let filtered = queue.filter(
      (s) => s.timestamp > sinceNum && (!effectiveExcludeSenderId || s.senderId !== effectiveExcludeSenderId)
    );

    // If joining client has not seen host offer yet, inject latest offer
    const latestOffer = roomLatestOfferMap.get(roomCode);
    if (
      latestOffer &&
      (!effectiveExcludeSenderId || latestOffer.senderId !== effectiveExcludeSenderId) &&
      !filtered.some((s) => s.type === 'offer') &&
      Date.now() - latestOffer.timestamp < 30 * 60 * 1000
    ) {
      if (sinceNum === 0 || sinceNum <= latestOffer.timestamp) {
        filtered = [
          {
            id: `cached_offer_${latestOffer.timestamp}`,
            ...latestOffer.signal,
            senderId: latestOffer.senderId,
            timestamp: latestOffer.timestamp,
          },
          ...filtered,
        ];
      }
    }

    return { success: true, signals: filtered };
  }

  /**
   * Reopen or rejoin a room (resets status to LIVE if within active window)
   */
  static async reopenOrRejoinRoom(roomCodeOrId, userId = null) {
    const booking = await this.findBookingDoc(roomCodeOrId);
    if (booking) {
      booking.status = 'CONFIRMED';
      booking.actualEndedAt = null;
      await booking.save();
      return { success: true, status: 'LIVE', message: 'Room reopened for session' };
    }
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (webinar) {
      const user = userId ? await User.findById(userId).select('role').lean() : null;
      const isHost = user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ||
        webinar.instructorId?.toString() === userId.toString());
      if (!isHost) throwWebinarAccessError('Only the webinar instructor can manage the session');
      if (webinar.status === 'COMPLETED' || webinar.status === 'CANCELLED') {
        throwWebinarAccessError('This webinar has ended and cannot be reopened', 409);
      }
      return { success: true, status: webinar.status, message: 'Webinar session is still active' };
    }
    return { success: false, message: 'Room not found' };
  }
}
