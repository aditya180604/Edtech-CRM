import mongoose from 'mongoose';
import { User, InstructorProfile, Booking, TeachingSlot } from '../../models/index.js';
import { CashfreeService } from '../../services/cashfree.service.js';
import { cashfreeConfig } from '../../config/cashfree.js';
import { sendConsultationStudentConfirmationEmail, sendConsultationInstructorAlertEmail } from '../../services/email.service.js';
import { AccessToken } from 'livekit-server-sdk';
import { AppError } from '../../utils/apiResponse.js';
import { getAppOrigin } from '../../config/env.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { publishConsultationRatingUpdate } from '../../services/realtime.service.js';

const DAYS_OF_WEEK = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export class ConsultationService {
  /**
   * 1. Get Public / Student Directory of Mentors Offering 1-on-1 Consultations
   */
  static async getConsultationInstructors({ search = '', expertise = '', page = 1, limit = 20 } = {}) {
    const query = {
      consultationEnabled: true,
      consultationSetupCompleted: true,
    };

    if (expertise) {
      query.expertise = { $in: [new RegExp(expertise, 'i')] };
    }

    const profiles = await InstructorProfile.find(query)
      .populate('userId', 'firstName lastName email profilePhoto avatar headline country bio skills')
      .sort({ updatedAt: -1 })
      .lean();

    const ratings = await Booking.aggregate([
      {
        $match: {
          bookingType: 'CONSULTATION',
          'consultationReview.submittedAt': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$instructorId',
          averageRating: { $avg: '$consultationReview.rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    const ratingByInstructor = new Map(
      ratings.map((rating) => [
        rating._id.toString(),
        {
          averageRating: Math.round(rating.averageRating * 10) / 10,
          reviewCount: rating.reviewCount,
        },
      ])
    );

    const instructors = profiles
      .filter((p) => p.userId)
      .map((p) => {
        const u = p.userId;
        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Mentor';
        const rating = ratingByInstructor.get(u._id.toString());
        return {
          id: p._id.toString(),
          instructorId: p.instructorId || u._id.toString(),
          userId: u._id.toString(),
          name,
          headline: p.headline || u.headline || 'Software Engineer & Mentor',
          bio: p.bio || u.bio || '',
          profilePhoto: p.profilePhoto || u.profilePhoto || u.avatar || null,
          expertise: p.expertise && p.expertise.length > 0 ? p.expertise : p.skills || [],
          skills: p.skills || [],
          yearsOfExperience: p.yearsOfExperience || p.experience || '5+ Years',
          currentOrganization: p.currentOrganization || '',
          consultationFee: p.consultationFee || 0,
          consultationDuration: p.consultationDuration || 45,
          consultationTimezone: p.consultationTimezone || 'Asia/Kolkata',
          consultationBufferMinutes: p.consultationBufferMinutes || 15,
          averageRating: rating?.averageRating || 0,
          reviewCount: rating?.reviewCount || 0,
          weeklyAvailability: p.weeklyAvailability || [],
        };
      });

    // Optional text search filter
    if (search) {
      const q = search.toLowerCase();
      return instructors.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.headline.toLowerCase().includes(q) ||
          i.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    return instructors;
  }

  /**
   * 2. Dynamically Generate Bookable Slots for an Instructor from Weekly Availability
   */
  static async getInstructorAvailability(instructorId, { startDate, days = 14 } = {}) {
    // 1. Resolve InstructorProfile
    let profile = null;
    if (mongoose.isValidObjectId(instructorId)) {
      profile = await InstructorProfile.findOne({
        $or: [{ userId: instructorId }, { _id: instructorId }, { instructorId }],
      }).lean();
    } else {
      profile = await InstructorProfile.findOne({ instructorId }).lean();
    }

    if (!profile) {
      profile = await InstructorProfile.findOne({ userId: instructorId }).lean();
    }

    if (!profile || !profile.consultationEnabled) {
      return {
        instructorId,
        consultationEnabled: false,
        slots: [],
        message: 'This mentor is currently not accepting 1-on-1 consultations.',
      };
    }

    const duration = profile.consultationDuration || 45;
    const buffer = profile.consultationBufferMinutes || 15;
    const weeklySched = profile.weeklyAvailability || [];
    const unavailableDates = new Set(profile.unavailableDates || []);

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + Number(days));

    // 2. Fetch all existing bookings & reserved slots in this window to prevent double-booking
    const targetUserId = profile.userId;
    const existingBookings = await Booking.find({
      instructorId: targetUserId,
      status: { $in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      startTime: { $gte: start, $lte: end },
    }).lean();

    const bookedRanges = existingBookings
      .filter((b) => {
        // Exclude expired temporary reservations
        if (b.status === 'PENDING_PAYMENT' && b.reservationExpiresAt && new Date(b.reservationExpiresAt) < new Date()) {
          return false;
        }
        return true;
      })
      .map((b) => ({
        start: new Date(b.startTime).getTime(),
        end: new Date(b.endTime).getTime(),
      }));

    // 3. Generate dynamic slots for each day
    const dynamicSlots = [];
    const now = new Date();
    const minLeadTime = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins lead time

    for (let d = 0; d < days; d++) {
      const curDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);

      const year = curDate.getFullYear();
      const month = String(curDate.getMonth() + 1).padStart(2, '0');
      const day = String(curDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      if (unavailableDates.has(dateStr)) continue;

      const dayName = DAYS_OF_WEEK[curDate.getDay()];
      const dayConfig = weeklySched.find((w) => w.dayOfWeek === dayName && w.isEnabled);
      if (!dayConfig || !dayConfig.slots || dayConfig.slots.length === 0) continue;

      for (const timeRange of dayConfig.slots) {
        if (!timeRange.startTime || !timeRange.endTime) continue;

        const [startH, startM] = timeRange.startTime.split(':').map(Number);
        const [endH, endM] = timeRange.endTime.split(':').map(Number);

        const rangeStart = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), startH, startM, 0, 0);
        const rangeEnd = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), endH, endM, 0, 0);

        let slotCursor = new Date(rangeStart);
        while (slotCursor.getTime() + duration * 60 * 1000 <= rangeEnd.getTime()) {
          const slotStart = new Date(slotCursor);
          const slotEnd = new Date(slotCursor.getTime() + duration * 60 * 1000);

          // Skip past slots
          if (slotStart > minLeadTime) {
            const isColliding = bookedRanges.some(
              (b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start
            );

            dynamicSlots.push({
              slotId: `SLOT_${slotStart.getTime()}`,
              date: dateStr,
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString(),
              durationMinutes: duration,
              fee: profile.consultationFee || 0,
              currency: 'INR',
              isAvailable: !isColliding,
              status: isColliding ? 'BOOKED' : 'AVAILABLE',
            });
          }

          // Advance by duration + buffer
          slotCursor = new Date(slotCursor.getTime() + (duration + buffer) * 60 * 1000);
        }
      }
    }

    return {
      instructorId: profile.instructorId || targetUserId.toString(),
      consultationEnabled: true,
      consultationFee: profile.consultationFee || 0,
      consultationDuration: duration,
      consultationTimezone: profile.consultationTimezone || 'Asia/Kolkata',
      totalAvailableSlots: dynamicSlots.length,
      slots: dynamicSlots,
    };
  }

  /**
   * 3. Get Consultation Settings for Instructor Dashboard
   */
  static async getInstructorSettings(userId) {
    let profile = await InstructorProfile.findOne({ userId }).lean();
    if (!profile) {
      profile = await InstructorProfile.create({
        userId,
        consultationEnabled: false,
        consultationFee: 0,
        consultationDuration: 45,
        consultationTimezone: 'Asia/Kolkata',
        consultationBufferMinutes: 15,
        weeklyAvailability: DAYS_OF_WEEK.map((d) => ({
          dayOfWeek: d,
          isEnabled: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(d),
          slots: [{ startTime: '18:00', endTime: '21:00' }],
        })),
      });
    }

    return {
      consultationEnabled: profile.consultationEnabled || false,
      consultationFee: profile.consultationFee || 0,
      consultationDuration: profile.consultationDuration || 45,
      consultationTimezone: profile.consultationTimezone || 'Asia/Kolkata',
      consultationBufferMinutes: profile.consultationBufferMinutes || 15,
      consultationSetupCompleted: profile.consultationSetupCompleted || false,
      consultationPublished: profile.consultationPublished || false,
      weeklyAvailability: profile.weeklyAvailability || [],
      unavailableDates: profile.unavailableDates || [],
    };
  }

  /**
   * 4. Update Consultation Settings (Toggle, Fee, Duration, Timezone, Buffer)
   */
  static async updateInstructorSettings(userId, payload) {
    let profile = await InstructorProfile.findOne({ userId });
    if (!profile) {
      profile = new InstructorProfile({ userId });
    }

    if (payload.consultationEnabled !== undefined) {
      profile.consultationEnabled = Boolean(payload.consultationEnabled);
    }
    if (payload.consultationFee !== undefined) {
      profile.consultationFee = Math.max(0, Number(payload.consultationFee));
    }
    if (payload.consultationDuration !== undefined) {
      profile.consultationDuration = Math.max(15, Number(payload.consultationDuration));
    }
    if (payload.consultationTimezone !== undefined) {
      profile.consultationTimezone = payload.consultationTimezone || 'Asia/Kolkata';
    }
    if (payload.consultationBufferMinutes !== undefined) {
      profile.consultationBufferMinutes = Math.max(0, Number(payload.consultationBufferMinutes));
    }
    if (payload.consultationPublished !== undefined) {
      profile.consultationPublished = Boolean(payload.consultationPublished);
    }

    // Check if consultation setup is complete
    const hasWeeklySchedule =
      profile.weeklyAvailability &&
      profile.weeklyAvailability.some((w) => w.isEnabled && w.slots && w.slots.length > 0);

    profile.consultationSetupCompleted =
      profile.consultationDuration > 0 &&
      profile.consultationFee >= 0 &&
      Boolean(hasWeeklySchedule);

    await profile.save();
    await this.notifyUpcomingConsultationStudents(
      userId,
      'Mentor settings updated',
      'Your mentor has updated their 1-on-1 consultation settings.'
    );

    return this.getInstructorSettings(userId);
  }

  /**
   * 5. Save 7-Day Weekly Availability & Exception Dates
   */
  static async saveWeeklyAvailability(userId, { weeklyAvailability, unavailableDates }) {
    let profile = await InstructorProfile.findOne({ userId });
    if (!profile) {
      profile = new InstructorProfile({ userId });
    }

    if (Array.isArray(weeklyAvailability)) {
      profile.weeklyAvailability = weeklyAvailability;
    }
    if (Array.isArray(unavailableDates)) {
      profile.unavailableDates = unavailableDates;
    }

    const hasWeeklySchedule =
      profile.weeklyAvailability &&
      profile.weeklyAvailability.some((w) => w.isEnabled && w.slots && w.slots.length > 0);

    profile.consultationSetupCompleted =
      profile.consultationDuration > 0 &&
      profile.consultationFee >= 0 &&
      Boolean(hasWeeklySchedule);

    await profile.save();
    await this.notifyUpcomingConsultationStudents(
      userId,
      'Mentor availability updated',
      'Your mentor has updated their 1-on-1 availability.'
    );

    return this.getInstructorSettings(userId);
  }

  static async notifyUpcomingConsultationStudents(instructorId, title, message) {
    const studentIds = await Booking.distinct('userId', {
      instructorId,
      bookingType: 'CONSULTATION',
      status: 'CONFIRMED',
      startTime: { $gte: new Date() },
    });

    await Promise.all(
      studentIds.map((userId) =>
        NotificationsService.notifyUser({
          userId,
          type: 'CONSULTATION_AVAILABILITY_UPDATED',
          title,
          message,
          actionUrl: '/dashboard/student',
          entityType: 'CONSULTATION',
          metadata: { instructorId: instructorId.toString() },
        })
      )
    ).catch((error) => console.error('[Notification Error] Consultation availability:', error.message));
  }

  static async notifyConsultationConfirmed(booking, studentName, instructorName) {
    const sessionDetails = new Date(booking.startTime).toLocaleString('en-IN');
    await Promise.all([
      NotificationsService.notifyUser({
        userId: booking.userId,
        type: 'CONSULTATION_CONFIRMED',
        title: '1-on-1 session confirmed',
        message: `Your consultation with ${instructorName} is confirmed for ${sessionDetails}.`,
        actionUrl: '/dashboard/student',
        entityType: 'CONSULTATION',
        entityId: booking._id,
      }),
      NotificationsService.notifyUser({
        userId: booking.instructorId,
        type: 'CONSULTATION_BOOKED',
        title: 'New 1-on-1 booking',
        message: `${studentName} booked a consultation for ${sessionDetails}.`,
        actionUrl: '/dashboard/instructor',
        entityType: 'CONSULTATION',
        entityId: booking._id,
      }),
    ]).catch((error) => console.error('[Notification Error] Consultation booking:', error.message));
  }

  /**
   * 6. Student Initiates 1-on-1 Consultation Booking (Atomic Reservation + Cashfree PG)
   */
  static async createBookingReservation(studentUserId, { instructorId, startTime, endTime, notes = '' }) {
    if (!instructorId || !startTime || !endTime) {
      throw new Error('Instructor, start time, and end time are required.');
    }

    // Resolve instructor user
    let instructorProfile = null;
    if (mongoose.isValidObjectId(instructorId)) {
      instructorProfile = await InstructorProfile.findOne({
        $or: [{ userId: instructorId }, { _id: instructorId }, { instructorId }],
      }).lean();
    } else {
      instructorProfile = await InstructorProfile.findOne({ instructorId }).lean();
    }

    if (!instructorProfile || !instructorProfile.consultationEnabled) {
      throw new Error('This mentor is not currently accepting new consultations.');
    }

    const instructorUser = await User.findById(instructorProfile.userId).select('firstName lastName email profilePhoto').lean();
    const studentUser = await User.findById(studentUserId).select('firstName lastName email phone').lean();

    if (!studentUser) {
      throw new Error('Student account not found.');
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start <= new Date()) {
      throw new Error('Cannot book appointments in the past.');
    }
    if (end <= start) {
      throw new Error('Invalid consultation duration.');
    }

    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
    const fee = instructorProfile.consultationFee || 0;
    const currency = 'INR';

    // ATOMIC DOUBLE-BOOKING CHECK
    // Prevent overlapping bookings for this instructor
    const existingConflict = await Booking.findOne({
      instructorId: instructorProfile.userId,
      status: { $in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      startTime: { $lt: end },
      endTime: { $gt: start },
      $or: [
        { status: 'CONFIRMED' },
        { status: 'PENDING_PAYMENT', reservationExpiresAt: { $gt: new Date() } },
      ],
    });

    if (existingConflict) {
      if (
        existingConflict.status === 'PENDING_PAYMENT' &&
        existingConflict.userId.toString() === studentUserId.toString()
      ) {
        // Allow student to replace their own uncompleted pending reservation
        await Booking.deleteOne({ _id: existingConflict._id });
      } else {
        throw new Error('This time slot is already booked. Please select an available slot.');
      }
    }

    const bookingCode = `CNS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const roomCode = `room_cns_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const appOrigin = getAppOrigin();
    const meetingUrl = `${appOrigin}/webinars/live/${roomCode}`;

    // CASE A: FREE CONSULTATION (Fee == 0)
    if (fee === 0) {
      const confirmedBooking = await Booking.create({
        bookingCode,
        userId: studentUserId,
        instructorId: instructorProfile.userId,
        bookingType: 'CONSULTATION',
        startTime: start,
        endTime: end,
        durationMinutes,
        fee: 0,
        currency,
        paymentStatus: 'FREE',
        status: 'CONFIRMED',
        meetingRoomCode: roomCode,
        meetingUrl,
        notes,
        bookedAt: new Date(),
      });

      await this.notifyConsultationConfirmed(
        confirmedBooking,
        `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim() || 'A student',
        `${instructorUser.firstName || ''} ${instructorUser.lastName || ''}`.trim() || 'your mentor'
      );

      // Dispatch automated notification emails asynchronously
      this._dispatchConsultationEmails({
        booking: confirmedBooking,
        student: studentUser,
        instructor: instructorUser,
        timezone: instructorProfile.consultationTimezone || 'Asia/Kolkata',
      }).catch((e) => console.warn('[Consultation Email Error]:', e.message));

      return {
        success: true,
        isFree: true,
        booking: confirmedBooking,
        message: 'Your 1-on-1 consultation has been confirmed successfully!',
      };
    }

    // CASE B: PAID CONSULTATION (Fee > 0)
    // 1. Create temporary reservation with 15-minute expiry
    const reservationExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const cfOrderId = `CF_CNS_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const pendingBooking = await Booking.create({
      bookingCode,
      userId: studentUserId,
      instructorId: instructorProfile.userId,
      bookingType: 'CONSULTATION',
      startTime: start,
      endTime: end,
      durationMinutes,
      fee,
      currency,
      paymentStatus: 'PENDING',
      status: 'PENDING_PAYMENT',
      cashfreeOrderId: cfOrderId,
      reservationExpiresAt,
      meetingRoomCode: roomCode,
      meetingUrl,
      notes,
    });

    // 2. Initialize Cashfree PG Order
    let cfOrder = null;
    try {
      cfOrder = await CashfreeService.createOrder({
        orderId: cfOrderId,
        orderAmount: fee,
        currency,
        customerId: studentUser._id.toString(),
        customerName: `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim() || 'Student',
        customerEmail: studentUser.email,
        customerPhone: studentUser.phone || '9999999999',
        returnUrl: `${appOrigin}/dashboard/student?cns_order_id={order_id}`,
        notifyUrl: `${cashfreeConfig.backendPublicUrl}/api/v1/payments/cashfree/webhook`,
        orderNote: `1-on-1 Consultation with ${instructorUser?.firstName || 'Mentor'} (${bookingCode})`,
      });
    } catch (cfErr) {
      console.error('[Cashfree Consultation Order Failure]:', cfErr.message);
      await Booking.deleteOne({ _id: pendingBooking._id });
      throw new Error(`Payment gateway initialization failed: ${cfErr.message}`);
    }

    return {
      success: true,
      isFree: false,
      bookingId: pendingBooking._id.toString(),
      bookingCode,
      fee,
      currency,
      paymentSessionId: cfOrder.paymentSessionId || cfOrder.payment_session_id,
      orderId: cfOrderId,
      reservationExpiresAt,
    };
  }

  /**
   * 7. Verify Cashfree Payment & Finalize 1-on-1 Consultation Booking
   */
  static async verifyBookingPayment(studentUserId, { bookingId, orderId }) {
    const query = orderId ? { cashfreeOrderId: orderId } : { _id: bookingId };
    const booking = await Booking.findOne(query);

    if (!booking) {
      throw new Error('Consultation booking record not found.');
    }

    // Idempotency: If already confirmed, return success immediately
    if (booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
      return {
        success: true,
        alreadyConfirmed: true,
        booking,
        message: 'Consultation is already confirmed.',
      };
    }

    // Verify Cashfree Payment Status
    const cfOrderId = booking.cashfreeOrderId || orderId;
    const cfStatusResult = await CashfreeService.getOrderPaymentStatus(cfOrderId);

    if (cfStatusResult.status === 'SUCCESS') {
      booking.status = 'CONFIRMED';
      booking.paymentStatus = 'PAID';
      booking.cashfreePaymentId = cfStatusResult.paymentId;
      booking.reservationExpiresAt = undefined;
      await booking.save();

      // Populate participants
      const studentUser = await User.findById(booking.userId).select('firstName lastName email phone').lean();
      const instructorUser = await User.findById(booking.instructorId).select('firstName lastName email').lean();
      const instructorProfile = await InstructorProfile.findOne({ userId: booking.instructorId }).select('consultationTimezone').lean();
      await this.notifyConsultationConfirmed(
        booking,
        `${studentUser?.firstName || ''} ${studentUser?.lastName || ''}`.trim() || 'A student',
        `${instructorUser?.firstName || ''} ${instructorUser?.lastName || ''}`.trim() || 'your mentor'
      );

      // Dispatch automated emails to both Student & Instructor
      this._dispatchConsultationEmails({
        booking,
        student: studentUser,
        instructor: instructorUser,
        timezone: instructorProfile?.consultationTimezone || 'Asia/Kolkata',
      }).catch((e) => console.warn('[Consultation Email Error]:', e.message));

      return {
        success: true,
        booking,
        message: 'Payment verified and 1-on-1 consultation confirmed successfully!',
      };
    } else {
      booking.status = 'CANCELLED';
      booking.paymentStatus = 'FAILED';
      await booking.save();

      throw new Error(`Payment verification failed with status: ${cfStatusResult.status}`);
    }
  }

  /**
   * 8. Dispatch Automated Emails to Student and Instructor (Idempotent)
   */
  static async _dispatchConsultationEmails({ booking, student, instructor, timezone }) {
    if (!student || !instructor) return;

    const formattedDate = new Date(booking.startTime).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = new Date(booking.startTime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
    const instructorName = `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() || 'Instructor';

    // 1. Send confirmation email to Student
    if (!booking.studentEmailSent && student.email) {
      await sendConsultationStudentConfirmationEmail({
        studentEmail: student.email,
        studentName,
        instructorName,
        consultationDate: formattedDate,
        consultationTime: formattedTime,
        timezone,
        duration: booking.durationMinutes,
        bookingCode: booking.bookingCode,
        joinUrl: booking.meetingUrl,
      });

      await Booking.updateOne({ _id: booking._id }, { $set: { studentEmailSent: true } });
    }

    // 2. Send booking alert email to Instructor
    if (!booking.instructorEmailSent && instructor.email) {
      await sendConsultationInstructorAlertEmail({
        instructorEmail: instructor.email,
        instructorName,
        studentName,
        consultationDate: formattedDate,
        consultationTime: formattedTime,
        timezone,
        duration: booking.durationMinutes,
        bookingCode: booking.bookingCode,
        studentNotes: booking.notes,
      });

      await Booking.updateOne({ _id: booking._id }, { $set: { instructorEmailSent: true } });
    }
  }

  /**
   * 9. Get Confirmed Consultations for Authenticated User (Student or Instructor)
   */
  static async getMyConsultations(userId, role) {
    const query = {
      bookingType: 'CONSULTATION',
      status: { $in: ['CONFIRMED', 'ATTENDED', 'CANCELLED'] },
    };

    if (role === 'INSTRUCTOR') {
      query.instructorId = userId;
    } else {
      query.userId = userId;
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'firstName lastName email profilePhoto avatar')
      .populate('instructorId', 'firstName lastName email profilePhoto avatar headline')
      .sort({ startTime: -1 })
      .lean();

    return bookings.map((b) => ({
      id: b._id.toString(),
      bookingCode: b.bookingCode,
      student: b.userId
        ? {
            id: b.userId._id.toString(),
            name: `${b.userId.firstName || ''} ${b.userId.lastName || ''}`.trim() || 'Student',
            email: b.userId.email,
            profilePhoto: b.userId.profilePhoto || b.userId.avatar || null,
          }
        : null,
      instructor: b.instructorId
        ? {
            id: b.instructorId._id.toString(),
            name: `${b.instructorId.firstName || ''} ${b.instructorId.lastName || ''}`.trim() || 'Mentor',
            email: b.instructorId.email,
            profilePhoto: b.instructorId.profilePhoto || b.instructorId.avatar || null,
            headline: b.instructorId.headline || 'Software Engineer',
          }
        : null,
      startTime: b.startTime,
      endTime: b.endTime,
      durationMinutes: b.durationMinutes,
      fee: b.fee,
      currency: b.currency,
      status: b.status,
      paymentStatus: b.paymentStatus,
      isCompleted: b.status === 'ATTENDED' || new Date(b.endTime).getTime() <= Date.now(),
      consultationReview: b.consultationReview || null,
      meetingRoomCode: b.meetingRoomCode,
      meetingUrl: b.meetingUrl,
      notes: b.notes,
      bookedAt: b.bookedAt || b.createdAt,
    }));
  }

  static async submitConsultationReview(userId, bookingId, { rating, review } = {}) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new AppError('Rating must be a whole number from 1 to 5.', 400);
    }

    if (typeof review !== 'string' || !review.trim() || review.trim().length > 2000) {
      throw new AppError('Review must contain 1 to 2000 characters.', 400);
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      bookingType: 'CONSULTATION',
      userId,
    });

    if (!booking) {
      throw new AppError('Consultation booking not found.', 404);
    }

    if (booking.status === 'CANCELLED') {
      throw new AppError('Cancelled consultations cannot be reviewed.', 400);
    }

    const isCompleted =
      booking.status === 'ATTENDED' ||
      (booking.endTime && new Date(booking.endTime).getTime() <= Date.now());
    if (!isCompleted) {
      throw new AppError('You can review this consultation after it has ended.', 400);
    }

    const consultationReview = {
      rating,
      review: review.trim(),
      submittedAt: new Date(),
    };
    const result = await Booking.updateOne(
      {
        _id: booking._id,
        userId,
        status: { $ne: 'CANCELLED' },
        'consultationReview.submittedAt': { $exists: false },
      },
      { $set: { consultationReview } }
    );
    if (result.modifiedCount === 0) {
      throw new AppError('You have already reviewed this consultation.', 409);
    }

    const [ratingStats] = await Booking.aggregate([
      {
        $match: {
          bookingType: 'CONSULTATION',
          instructorId: booking.instructorId,
          'consultationReview.submittedAt': { $exists: true },
        },
      },
      {
        $group: {
          _id: '$instructorId',
          averageRating: { $avg: '$consultationReview.rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);
    const ratingUpdate = {
      userId: booking.instructorId.toString(),
      averageRating: Math.round((ratingStats?.averageRating || 0) * 10) / 10,
      reviewCount: ratingStats?.reviewCount || 0,
    };
    publishConsultationRatingUpdate(ratingUpdate);
    NotificationsService.notifyUser({
      userId: booking.instructorId,
      type: 'CONSULTATION_REVIEW_RECEIVED',
      title: 'New 1-on-1 review',
      message: `A student left a review. Your overall 1-on-1 rating is now ${ratingUpdate.averageRating}/5.`,
      actionUrl: '/dashboard/instructor',
      entityType: 'CONSULTATION',
      entityId: booking._id,
      metadata: { rating: ratingUpdate.averageRating, reviewCount: ratingUpdate.reviewCount },
    }).catch((error) => console.error('[Notification Error] Consultation review:', error.message));

    return consultationReview;
  }

  /**
   * 11. Generate Authorized LiveKit JWT Token to Join Meeting
   */
  static async generateJoinToken(userId, bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new Error(`Cannot join consultation with status: ${booking.status}`);
    }

    const isStudent = booking.userId.toString() === userId.toString();
    const isInstructor = booking.instructorId.toString() === userId.toString();

    if (!isStudent && !isInstructor) {
      throw new Error('Unauthorized: You are not a participant in this consultation.');
    }

    const user = await User.findById(userId).select('firstName lastName role profilePhoto').lean();
    const userName = `${user?.firstName || 'User'} ${user?.lastName || ''}`.trim();
    const roomName = booking.meetingRoomCode || `room_${booking._id.toString()}`;

    const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
    const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret_livekit_key_2026_edtech';
    const serverUrl = process.env.LIVEKIT_URL || 'wss://edtech-livekit.internal';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `user_${userId.toString()}`,
      name: userName,
      metadata: JSON.stringify({
        role: isInstructor ? 'HOST' : 'STUDENT',
        name: userName,
        bookingCode: booking.bookingCode,
      }),
      ttl: '4h',
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return {
      allowed: true,
      roomName,
      token,
      serverUrl,
      isHost: isInstructor,
      session: {
        bookingCode: booking.bookingCode,
        startTime: booking.startTime,
        endTime: booking.endTime,
        durationMinutes: booking.durationMinutes,
      },
    };
  }
}
