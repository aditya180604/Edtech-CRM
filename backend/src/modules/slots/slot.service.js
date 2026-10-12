import mongoose from 'mongoose';
import crypto from 'crypto';
import { TeachingSlot, Booking, LiveSession, Course, User, Notification } from '../../models/index.js';
import { AppError } from '../../utils/apiResponse.js';

export class SlotService {
  /**
   * Helper to generate unique room code and readable identifiers
   */
  static generateId(prefix = 'SLOT') {
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  }

  /**
   * 1. Instructor creates an available teaching slot
   */
  static async createSlot({
    instructorId,
    courseId = null,
    title,
    description = '',
    slotType = 'ONE_ON_ONE',
    startTime,
    endTime,
    durationMinutes = 45,
    capacity = 1,
    price = 0,
    timeZone = 'UTC',
    meetingType = 'IN_PLATFORM',
    meetingUrl = '',
  }) {
    if (!title || !title.trim()) {
      throw new AppError('Slot title is required.', 400);
    }
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date(start.getTime() + durationMinutes * 60000);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Valid start time and end time are required.', 400);
    }
    if (start <= new Date()) {
      throw new AppError('Slot start time must be in the future.', 400);
    }
    if (end <= start) {
      throw new AppError('End time must be after start time.', 400);
    }

    const instructorObjId = new mongoose.Types.ObjectId(instructorId);

    // Overlapping conflict check: Ensure instructor has no conflicting active slot
    const conflict = await TeachingSlot.findOne({
      instructorId: instructorObjId,
      status: { $in: ['AVAILABLE', 'BOOKED'] },
      $or: [
        { startTime: { $lt: end }, endTime: { $gt: start } },
      ],
    });

    if (conflict) {
      throw new AppError(
        `Scheduling conflict: You already have an active slot ("${conflict.title}") between ${conflict.startTime.toLocaleTimeString()} and ${conflict.endTime.toLocaleTimeString()}.`,
        409
      );
    }

    const slotId = this.generateId('SLOT');
    const roomCode = `room_${crypto.randomBytes(4).toString('hex')}_${Date.now().toString(36)}`;

    const newSlot = await TeachingSlot.create({
      slotId,
      instructorId: instructorObjId,
      courseId: courseId && mongoose.isValidObjectId(courseId) ? new mongoose.Types.ObjectId(courseId) : null,
      title: title.trim(),
      description: description.trim(),
      slotType,
      startTime: start,
      endTime: end,
      durationMinutes: Number(durationMinutes) || 45,
      capacity: slotType === 'ONE_ON_ONE' ? 1 : Math.max(1, Number(capacity) || 1),
      bookedCount: 0,
      status: 'AVAILABLE',
      price: Math.max(0, Number(price) || 0),
      timeZone: timeZone || 'UTC',
      meetingType,
      roomCode,
      meetingUrl,
    });

    // Also register LiveSession for LiveKit classroom compatibility
    await LiveSession.create({
      instructorId: instructorObjId,
      provider: 'LIVEKIT',
      startTime: start,
      endTime: end,
      status: 'SCHEDULED',
      accessReference: roomCode,
    });

    return newSlot;
  }

  /**
   * 2. Instructor retrieves their teaching slots
   */
  static async getInstructorSlots(instructorId, { status, fromDate, toDate } = {}) {
    const query = { instructorId: new mongoose.Types.ObjectId(instructorId) };

    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (fromDate || toDate) {
      query.startTime = {};
      if (fromDate) query.startTime.$gte = new Date(fromDate);
      if (toDate) query.startTime.$lte = new Date(toDate);
    }

    const slots = await TeachingSlot.find(query)
      .populate('courseId', 'title slug thumbnail')
      .sort({ startTime: 1 })
      .lean();

    // Populate bookings for each slot
    const slotIds = slots.map((s) => s._id);
    const bookings = await Booking.find({ slotId: { $in: slotIds }, status: { $ne: 'CANCELLED' } })
      .populate('userId', 'firstName lastName email profilePhoto')
      .lean();

    return slots.map((slot) => ({
      ...slot,
      bookings: bookings.filter((b) => b.slotId?.toString() === slot._id.toString()),
    }));
  }

  /**
   * 3. Instructor cancels a slot
   */
  static async cancelInstructorSlot(instructorId, slotId, reason = '') {
    const slot = await TeachingSlot.findOne({
      $or: [{ _id: mongoose.isValidObjectId(slotId) ? new mongoose.Types.ObjectId(slotId) : null }, { slotId }],
      instructorId: new mongoose.Types.ObjectId(instructorId),
    });

    if (!slot) {
      throw new AppError('Teaching slot not found or not owned by you.', 404);
    }

    slot.status = 'CANCELLED';
    await slot.save();

    // Notify any confirmed students and cancel bookings
    const bookings = await Booking.find({ slotId: slot._id, status: 'CONFIRMED' });
    for (const b of bookings) {
      b.status = 'CANCELLED';
      b.cancellationReason = reason || 'Cancelled by instructor';
      b.cancelledBy = 'INSTRUCTOR';
      b.cancelledAt = new Date();
      await b.save();

      await Notification.create({
        notificationId: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: b.userId,
        type: 'SLOT_CANCELLED',
        title: 'Teaching Session Cancelled',
        message: `Your booking for "${slot.title}" on ${slot.startTime.toDateString()} was cancelled by the instructor.${reason ? ` Reason: ${reason}` : ''}`,
      });
    }

    return { message: 'Slot and associated bookings cancelled successfully.', slot };
  }

  /**
   * 4. Students browse available slots (filter by instructor, course, date)
   */
  static async getAvailableSlots({ instructorId, courseId, slotType, fromDate } = {}) {
    const query = {
      status: 'AVAILABLE',
      startTime: { $gt: fromDate ? new Date(fromDate) : new Date() },
    };

    if (instructorId && mongoose.isValidObjectId(instructorId)) {
      query.instructorId = new mongoose.Types.ObjectId(instructorId);
    }
    if (courseId && mongoose.isValidObjectId(courseId)) {
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }
    if (slotType) {
      query.slotType = slotType;
    }

    const slots = await TeachingSlot.find(query)
      .populate('instructorId', 'firstName lastName profilePhoto email headline')
      .populate('courseId', 'title slug thumbnail')
      .sort({ startTime: 1 })
      .lean();

    return slots.filter((s) => s.bookedCount < s.capacity);
  }

  /**
   * 5. Student books a slot atomically
   */
  static async bookSlot({ studentId, slotId, notes = '' }) {
    const slotObjId = mongoose.isValidObjectId(slotId) ? new mongoose.Types.ObjectId(slotId) : null;
    const query = slotObjId ? { _id: slotObjId } : { slotId };

    const targetSlot = await TeachingSlot.findOne(query);
    if (!targetSlot) {
      throw new AppError('Teaching slot not found.', 404);
    }
    if (targetSlot.status !== 'AVAILABLE' || targetSlot.bookedCount >= targetSlot.capacity) {
      throw new AppError('This slot is no longer available.', 409);
    }
    if (targetSlot.startTime <= new Date()) {
      throw new AppError('Cannot book a slot in the past.', 400);
    }
    if (targetSlot.instructorId.toString() === studentId.toString()) {
      throw new AppError('Instructors cannot book their own slots.', 400);
    }

    // Check if student already booked this slot
    const existingBooking = await Booking.findOne({
      slotId: targetSlot._id,
      userId: new mongoose.Types.ObjectId(studentId),
      status: 'CONFIRMED',
    });
    if (existingBooking) {
      throw new AppError('You have already booked this slot.', 409);
    }

    // Atomic increment of booked count
    const updatedSlot = await TeachingSlot.findOneAndUpdate(
      {
        _id: targetSlot._id,
        status: 'AVAILABLE',
        $expr: { $lt: ['$bookedCount', '$capacity'] },
      },
      {
        $inc: { bookedCount: 1 },
      },
      { new: true }
    );

    if (!updatedSlot) {
      throw new AppError('This slot was just booked by another student. Please select another slot.', 409);
    }

    // Mark BOOKED if capacity reached
    if (updatedSlot.bookedCount >= updatedSlot.capacity) {
      updatedSlot.status = 'BOOKED';
      await updatedSlot.save();
    }

    const bookingCode = this.generateId('BK');
    const booking = await Booking.create({
      bookingCode,
      userId: new mongoose.Types.ObjectId(studentId),
      slotId: targetSlot._id,
      instructorId: targetSlot.instructorId,
      courseId: targetSlot.courseId || null,
      notes: notes.trim(),
      status: 'CONFIRMED',
      bookedAt: new Date(),
    });

    const [student, instructor] = await Promise.all([
      User.findById(studentId).lean(),
      User.findById(targetSlot.instructorId).lean(),
    ]);

    // Send notification to Instructor
    await Notification.create({
      notificationId: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: targetSlot.instructorId,
      type: 'SLOT_BOOKED',
      title: 'New Session Booking',
      message: `${student?.firstName || 'A student'} booked your session "${targetSlot.title}" for ${targetSlot.startTime.toLocaleString()}.`,
    });

    // Send confirmation to Student
    await Notification.create({
      notificationId: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: studentId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed!',
      message: `Your session "${targetSlot.title}" with ${instructor?.firstName || 'Instructor'} is confirmed for ${targetSlot.startTime.toLocaleString()}.`,
    });

    return {
      booking,
      slot: updatedSlot,
      roomCode: targetSlot.roomCode,
      meetingUrl: targetSlot.meetingUrl,
    };
  }

  /**
   * 6. Student or Instructor cancels an existing booking
   */
  static async cancelBooking({ userId, bookingId, reason = '' }) {
    const booking = await Booking.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(bookingId) ? new mongoose.Types.ObjectId(bookingId) : null },
        { bookingCode: bookingId },
      ],
      status: 'CONFIRMED',
    });

    if (!booking) {
      throw new AppError('Active booking not found.', 404);
    }

    const isStudent = booking.userId.toString() === userId.toString();
    const isInstructor = booking.instructorId?.toString() === userId.toString();

    if (!isStudent && !isInstructor) {
      throw new AppError('You do not have authorization to cancel this booking.', 403);
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason.trim() || 'Cancelled by user';
    booking.cancelledBy = isStudent ? 'STUDENT' : 'INSTRUCTOR';
    booking.cancelledAt = new Date();
    await booking.save();

    // Release slot capacity atomically
    await TeachingSlot.findByIdAndUpdate(booking.slotId, {
      $inc: { bookedCount: -1 },
      $set: { status: 'AVAILABLE' },
    });

    // Send cancellation notification to counter-party
    const notifyTarget = isStudent ? booking.instructorId : booking.userId;
    if (notifyTarget) {
      await Notification.create({
        notificationId: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        userId: notifyTarget,
        type: 'BOOKING_CANCELLED',
        title: 'Session Booking Cancelled',
        message: `Booking #${booking.bookingCode} was cancelled by ${isStudent ? 'the student' : 'the instructor'}.${reason ? ` Reason: ${reason}` : ''}`,
      });
    }

    return { message: 'Booking successfully cancelled.', booking };
  }

  /**
   * 7. Reschedule booking to another slot atomically
   */
  static async rescheduleBooking({ studentId, bookingId, newSlotId }) {
    const oldBooking = await Booking.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(bookingId) ? new mongoose.Types.ObjectId(bookingId) : null },
        { bookingCode: bookingId },
      ],
      userId: new mongoose.Types.ObjectId(studentId),
      status: 'CONFIRMED',
    });

    if (!oldBooking) {
      throw new AppError('Confirmed booking not found for rescheduling.', 404);
    }

    // Book new slot first
    const bookResult = await this.bookSlot({
      studentId,
      slotId: newSlotId,
      notes: `Rescheduled from ${oldBooking.bookingCode}. ${oldBooking.notes || ''}`.trim(),
    });

    // Cancel old booking and link
    oldBooking.status = 'RESCHEDULED';
    oldBooking.cancellationReason = `Rescheduled to new booking ${bookResult.booking.bookingCode}`;
    oldBooking.cancelledBy = 'STUDENT';
    oldBooking.cancelledAt = new Date();
    await oldBooking.save();

    // Release old slot
    await TeachingSlot.findByIdAndUpdate(oldBooking.slotId, {
      $inc: { bookedCount: -1 },
      $set: { status: 'AVAILABLE' },
    });

    bookResult.booking.rescheduledFromBookingId = oldBooking._id;
    await bookResult.booking.save();

    return {
      message: 'Booking rescheduled successfully.',
      newBooking: bookResult.booking,
      newSlot: bookResult.slot,
      roomCode: bookResult.roomCode,
    };
  }

  /**
   * 8. Student gets all their booked sessions
   */
  static async getStudentBookings(studentId, { status } = {}) {
    const query = { userId: new mongoose.Types.ObjectId(studentId) };
    if (status && status !== 'ALL') {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate({
        path: 'slotId',
        select: 'title description slotType startTime endTime durationMinutes meetingType roomCode meetingUrl status',
      })
      .populate('instructorId', 'firstName lastName profilePhoto email headline')
      .populate('courseId', 'title slug thumbnail')
      .sort({ createdAt: -1 })
      .lean();

    return bookings;
  }
}
