import { ConsultationService } from './consultation.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class ConsultationController {
  // 1. Get Public / Student Directory of Mentors Offering 1-on-1 Consultations
  static getConsultationInstructors = asyncHandler(async (req, res) => {
    const { search, expertise, page, limit } = req.query;
    const instructors = await ConsultationService.getConsultationInstructors({
      search,
      expertise,
      page,
      limit,
    });
    return ApiResponse.success(res, instructors, 'Mentors retrieved successfully.');
  });

  // 2. Get Dynamic Weekly Availability Slots for Selected Mentor
  static getInstructorAvailability = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, days } = req.query;
    const result = await ConsultationService.getInstructorAvailability(id, { startDate, days });
    return ApiResponse.success(res, result, 'Mentor availability slots retrieved.');
  });

  // 3. Get Consultation Settings for Instructor Dashboard
  static getInstructorSettings = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const settings = await ConsultationService.getInstructorSettings(userId);
    return ApiResponse.success(res, settings, 'Consultation settings retrieved.');
  });

  // 4. Update Consultation Settings (Toggle, Fee, Duration, Timezone, Buffer)
  static updateInstructorSettings = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const settings = await ConsultationService.updateInstructorSettings(userId, req.body);
    return ApiResponse.success(res, settings, 'Consultation settings updated successfully.');
  });

  // 5. Save 7-Day Weekly Availability Schedule
  static saveWeeklyAvailability = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { weeklyAvailability, unavailableDates } = req.body;
    const settings = await ConsultationService.saveWeeklyAvailability(userId, {
      weeklyAvailability,
      unavailableDates,
    });
    return ApiResponse.success(res, settings, 'Weekly availability schedule saved.');
  });

  // 6. Student Initiates 1-on-1 Booking (Free or Paid via Cashfree)
  static createBookingReservation = asyncHandler(async (req, res) => {
    const studentUserId = req.user.userId;
    const { instructorId, startTime, endTime, notes } = req.body;
    const result = await ConsultationService.createBookingReservation(studentUserId, {
      instructorId,
      startTime,
      endTime,
      notes,
    });
    return ApiResponse.created(res, result, result.message || 'Consultation booking reserved.');
  });

  // 7. Verify Cashfree Payment for Booking
  static verifyBookingPayment = asyncHandler(async (req, res) => {
    const studentUserId = req.user.userId;
    const { bookingId, orderId } = req.body;
    const result = await ConsultationService.verifyBookingPayment(studentUserId, {
      bookingId,
      orderId,
    });
    return ApiResponse.success(res, result, result.message);
  });

  // 8. Get Authenticated User's Consultations (Student or Instructor)
  static getMyConsultations = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const role = req.user.role;
    const bookings = await ConsultationService.getMyConsultations(userId, role);
    return ApiResponse.success(res, bookings, 'Consultations retrieved successfully.');
  });

  // 9. Submit student feedback after a consultation has ended
  static submitConsultationReview = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await ConsultationService.submitConsultationReview(userId, id, req.body);
    return ApiResponse.success(res, result, 'Consultation review submitted successfully.');
  });

  // 10. Generate LiveKit Token to Join Meeting
  static generateJoinToken = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const result = await ConsultationService.generateJoinToken(userId, id);
    return ApiResponse.success(res, result, 'Join token generated successfully.');
  });
}
