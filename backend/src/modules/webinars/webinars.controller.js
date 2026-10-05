import { WebinarsService } from './webinars.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class WebinarsController {
  static getUpcoming = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null;
    const data = await WebinarsService.getUpcomingWebinars({ ...req.query, userId });
    return ApiResponse.success(res, data, 'Upcoming webinars retrieved successfully.');
  });

  static getCatalog = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || null;
    const data = await WebinarsService.getUpcomingWebinars({ ...req.query, userId });
    return ApiResponse.success(res, data, 'Webinars catalog retrieved successfully.');
  });

  static getDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId || null;
    const webinar = await WebinarsService.getWebinarByIdOrSlug(id, userId);
    if (!webinar) {
      return ApiResponse.error(res, 'Webinar not found', 404);
    }
    return ApiResponse.success(res, webinar, 'Webinar details retrieved successfully.');
  });

  static register = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.registerStudent(id, userId);
    return ApiResponse.success(res, result, 'Successfully registered for webinar.');
  });

  static getLiveRoom = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user?.userId || null;
    const roomState = await WebinarsService.getLiveRoomState(roomCode, userId);
    return ApiResponse.success(res, roomState, 'Live webinar room state retrieved successfully.');
  });

  static getLiveKitToken = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.generateLiveKitToken(roomCode, userId);
    if (!result.allowed) {
      return ApiResponse.error(res, result.message, 403, { requiresPurchase: result.requiresPurchase, price: result.price });
    }
    return ApiResponse.success(res, result, 'LiveKit room token generated successfully.');
  });

  static startWebinar = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.startWebinar(roomCode, userId);
    return ApiResponse.success(res, result, 'Webinar started successfully.');
  });

  static endWebinar = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.endWebinar(roomCode, userId);
    return ApiResponse.success(res, result, 'Webinar ended successfully.');
  });

  static sendChatMessage = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const { message } = req.body;
    const result = await WebinarsService.sendChatMessage(roomCode, userId, message);
    return ApiResponse.success(res, result, 'Chat message sent successfully.');
  });

  static submitQuestion = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const { question } = req.body;
    const result = await WebinarsService.submitQuestion(roomCode, userId, question);
    return ApiResponse.success(res, result, 'Question submitted successfully.');
  });

  static toggleUpvoteQuestion = asyncHandler(async (req, res) => {
    const { roomCode, qaId } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.toggleUpvoteQuestion(roomCode, userId, qaId);
    return ApiResponse.success(res, result, 'Question upvote updated.');
  });

  static answerQuestion = asyncHandler(async (req, res) => {
    const { roomCode, qaId } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.answerQuestion(roomCode, userId, qaId);
    return ApiResponse.success(res, result, 'Question marked as answered.');
  });

  static toggleRaiseHand = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const result = await WebinarsService.toggleRaiseHand(roomCode, userId);
    return ApiResponse.success(res, result, 'Raise hand updated.');
  });

  static allowStudentSpeak = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const hostId = req.user.userId;
    const { targetUserId, canSpeak } = req.body;
    const result = await WebinarsService.allowStudentSpeak(roomCode, hostId, targetUserId, canSpeak);
    return ApiResponse.success(res, result, 'Student speak permissions updated.');
  });

  static saveUserNotes = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user.userId;
    const { notes } = req.body;
    const result = await WebinarsService.saveUserNotes(roomCode, userId, notes);
    return ApiResponse.success(res, result, 'Notes saved successfully.');
  });

  static recordAttendanceLeave = asyncHandler(async (req, res) => {
    const { roomCode } = req.params;
    const userId = req.user?.userId || req.body.userId;
    if (userId) {
      await WebinarsService.recordAttendanceLeave(roomCode, userId);
    }
    return ApiResponse.success(res, { success: true }, 'Attendance logged.');
  });
}
