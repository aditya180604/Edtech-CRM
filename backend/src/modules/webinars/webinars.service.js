import mongoose from 'mongoose';
import { AccessToken } from 'livekit-server-sdk';
import { Webinar, User } from '../../models/index.js';
import { runWebinarExpiryCheck } from './webinarExpiry.cron.js';

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
      startTime: { $gt: twoHoursAgo },
      $or: [
        { startTime: { $gt: now } }, // Future scheduled
        { createdAt: { $gt: twoHoursAgo } }, // Live today, created < 2 hrs ago
      ],
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
        const createdAt = new Date(w.createdAt);

        const isWithin2HoursOfStart = (now.getTime() - startTime.getTime()) < 2 * 60 * 60 * 1000;
        const isWithin2HoursOfCreation = (now.getTime() - createdAt.getTime()) < 2 * 60 * 60 * 1000;

        const isLive = w.status === 'LIVE' || (startTime <= now && endTime > now && isWithin2HoursOfStart && isWithin2HoursOfCreation && w.status !== 'COMPLETED');

        let computedStatus = w.status;
        if (isLive) {
          computedStatus = 'LIVE';
        } else if (now < startTime) {
          computedStatus = w.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED';
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
      throw new Error('Webinar room not found');
    }

    const populated = await Webinar.findById(webinar._id)
      .populate('instructorId', 'firstName lastName email profilePhoto headline bio')
      .lean();

    const instructor = populated.instructorId || {};
    const instructorName = `${instructor.firstName || 'Instructor'} ${instructor.lastName || ''}`.trim();
    const instructorAvatar = instructor.profilePhoto || null;
    const instructorHeadline = instructor.headline || 'Lead Instructor & Workshop Host';

    const registeredUserIds = Array.isArray(populated.registrations)
      ? populated.registrations.map((id) => id?.toString())
      : [];

    let isHost = false;
    let isSuperAdmin = false;
    let isRegistered = false;
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
        isHost = isSuperAdmin || (instructor._id && instructor._id.toString() === userId.toString());
        isRegistered = isHost || registeredUserIds.includes(userId.toString());
      }
    }

    const isFree = (populated.price || 0) === 0;
    const hasAccess = isHost || isRegistered || isFree;

    // Default dynamic resources if none attached
    const resources = Array.isArray(populated.resources) && populated.resources.length > 0
      ? populated.resources
      : [
          {
            title: `${populated.title} - Session Slides.pdf`,
            url: '#',
            type: 'PDF',
            size: '2.4 MB',
          },
          {
            title: 'Hands-on Practice Starter Kit.zip',
            url: '#',
            type: 'ZIP',
            size: '15.8 MB',
          },
          {
            title: 'Official Reference Architecture.pdf',
            url: '#',
            type: 'PDF',
            size: '1.1 MB',
          },
        ];

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
      roomCode: populated.roomCode || `wb-${populated._id.toString().slice(-8)}`,
      title: populated.title,
      description: populated.description || '',
      category: populated.category || 'DevOps / Cloud',
      startTime: populated.startTime,
      endTime: populated.endTime,
      actualStartedAt: populated.actualStartedAt || null,
      actualEndedAt: populated.actualEndedAt || null,
      status: populated.status || 'SCHEDULED',
      price: populated.price || 0,
      currency: populated.currency || 'INR',
      capacity: populated.capacity || 100,
      registrationsCount: registeredUserIds.length,
      instructor: {
        id: instructor._id?.toString(),
        name: instructorName,
        avatar: instructorAvatar,
        headline: instructorHeadline,
        bio: instructor.bio || '',
      },
      hasAccess,
      isHost,
      isRegistered,
      currentUser,
      resources,
      chatMessages,
      qa,
      raisedHands,
      userNotes,
      livekitServerUrl: process.env.LIVEKIT_URL || 'wss://edtech-livekit.internal',
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
    const isFree = (webinar.price || 0) === 0;

    // For paid webinars, must be host or registered
    if (!isHost && !isRegistered && !isFree) {
      return {
        allowed: false,
        requiresPurchase: true,
        price: webinar.price,
        currency: webinar.currency || 'INR',
        message: 'Ticket registration is required to join this live workshop',
      };
    }

    // Auto-register student if free workshop
    if (!isRegistered && isFree) {
      if (!Array.isArray(webinar.registrations)) webinar.registrations = [];
      webinar.registrations.push(new mongoose.Types.ObjectId(userId));
      await webinar.save();
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

      const roomName = webinar.roomCode || `webinar_${webinar._id.toString()}`;
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
        roomName: webinar.title,
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
   * Host starts the webinar (Changes status to LIVE)
   */
  static async startWebinar(roomCodeOrId, userId) {
    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');

    const instructorIdStr = (webinar.instructorId?._id || webinar.instructorId)?.toString();
    const user = await User.findById(userId).lean();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const isHost = Boolean(instructorIdStr && userId && instructorIdStr === userId.toString());

    if (!isHost && !isAdmin) {
      throw new Error('Only the instructor or host can start the webinar');
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
    if (!webinar) throw new Error('Webinar not found');

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

    await webinar.save();

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

  /**
   * Send a chat message
   */
  static async sendChatMessage(roomCodeOrId, userId, messageText) {
    if (!messageText || !messageText.trim()) {
      throw new Error('Message content cannot be empty');
    }

    const webinar = await this.findWebinarDoc(roomCodeOrId);
    if (!webinar) throw new Error('Webinar not found');

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

    const isHost =
      (webinar.instructorId && webinar.instructorId.toString() === userId.toString());
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
    if (!webinar) throw new Error('Webinar not found');

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
    if (!webinar || !Array.isArray(webinar.attendanceLogs)) return { success: true };

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
}
