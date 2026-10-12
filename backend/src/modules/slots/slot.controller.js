import { SlotService } from './slot.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class SlotController {
  /**
   * Instructor: Create availability slot
   */
  static createSlot = asyncHandler(async (req, res) => {
    const instructorId = req.user?.userId || req.user?._id || req.user?.id;
    const slot = await SlotService.createSlot({
      instructorId,
      ...req.body,
    });
    return ApiResponse.created(res, slot, 'Teaching slot created successfully.');
  });

  /**
   * Instructor: Get my slots
   */
  static getInstructorSlots = asyncHandler(async (req, res) => {
    const instructorId = req.user?.userId || req.user?._id || req.user?.id;
    const { status, fromDate, toDate } = req.query;
    const slots = await SlotService.getInstructorSlots(instructorId, { status, fromDate, toDate });
    return ApiResponse.success(res, slots, 'Instructor slots retrieved successfully.');
  });

  /**
   * Instructor: Cancel a slot
   */
  static cancelInstructorSlot = asyncHandler(async (req, res) => {
    const instructorId = req.user?.userId || req.user?._id || req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await SlotService.cancelInstructorSlot(instructorId, id, reason);
    return ApiResponse.success(res, result, 'Teaching slot cancelled successfully.');
  });

  /**
   * Public/Student: Browse available slots
   */
  static getAvailableSlots = asyncHandler(async (req, res) => {
    const { instructorId, courseId, slotType, fromDate } = req.query;
    const slots = await SlotService.getAvailableSlots({
      instructorId,
      courseId,
      slotType,
      fromDate,
    });
    return ApiResponse.success(res, slots, 'Available teaching slots retrieved successfully.');
  });

  /**
   * Student: Book a slot
   */
  static bookSlot = asyncHandler(async (req, res) => {
    const studentId = req.user?.userId || req.user?._id || req.user?.id;
    const { id } = req.params;
    const { notes } = req.body;
    const result = await SlotService.bookSlot({
      studentId,
      slotId: id,
      notes,
    });
    return ApiResponse.created(res, result, 'Teaching slot booked successfully.');
  });

  /**
   * Student: Get my bookings
   */
  static getStudentBookings = asyncHandler(async (req, res) => {
    const studentId = req.user?.userId || req.user?._id || req.user?.id;
    const { status } = req.query;
    const bookings = await SlotService.getStudentBookings(studentId, { status });
    return ApiResponse.success(res, bookings, 'Student bookings retrieved successfully.');
  });

  /**
   * Student / Instructor: Cancel a booking
   */
  static cancelBooking = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { id } = req.params;
    const { reason } = req.body;
    const result = await SlotService.cancelBooking({
      userId,
      bookingId: id,
      reason,
    });
    return ApiResponse.success(res, result, 'Booking cancelled successfully.');
  });

  /**
   * Student: Reschedule a booking
   */
  static rescheduleBooking = asyncHandler(async (req, res) => {
    const studentId = req.user?.userId || req.user?._id || req.user?.id;
    const { id } = req.params;
    const { newSlotId } = req.body;
    const result = await SlotService.rescheduleBooking({
      studentId,
      bookingId: id,
      newSlotId,
    });
    return ApiResponse.success(res, result, 'Booking rescheduled successfully.');
  });
}
