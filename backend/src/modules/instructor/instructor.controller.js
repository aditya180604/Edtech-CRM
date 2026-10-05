import { InstructorService } from './instructor.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class InstructorController {
  static getDashboard = asyncHandler(async (req, res) => {
    const data = await InstructorService.getDashboardData(req.user.userId, req.query.timeframe);
    return ApiResponse.success(res, data, 'Instructor dashboard telemetry retrieved successfully.');
  });

  static getCourses = asyncHandler(async (req, res) => {
    const data = await InstructorService.getCourses(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Instructor courses retrieved successfully.');
  });

  static createCourse = asyncHandler(async (req, res) => {
    const course = await InstructorService.createCourse(req.user.userId, req.body);
    return ApiResponse.created(res, course, 'Course created and published successfully.');
  });

  static getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await InstructorService.getCourseById(req.user.userId, id);
    return ApiResponse.success(res, data, 'Course details retrieved successfully.');
  });

  static updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await InstructorService.updateCourse(req.user.userId, id, req.body);
    return ApiResponse.success(res, course, 'Course updated successfully.');
  });

  static deleteCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await InstructorService.deleteCourse(req.user.userId, id);
    return ApiResponse.success(res, result, 'Course deleted successfully.');
  });

  static updatePrice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { coursePrice, currency } = req.body;
    const course = await InstructorService.updateCoursePrice(req.user.userId, id, { coursePrice, currency });
    return ApiResponse.success(res, course, 'Course price updated successfully.');
  });

  static updateVisibility = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { visibility, status } = req.body;
    const course = await InstructorService.updateCourseVisibility(req.user.userId, id, { visibility, status });
    return ApiResponse.success(res, course, 'Course visibility updated successfully.');
  });

  static addModule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const module = await InstructorService.addModule(req.user.userId, id, req.body);
    return ApiResponse.created(res, module, 'Module added successfully.');
  });

  static addTopic = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const topic = await InstructorService.addTopic(req.user.userId, moduleId, req.body);
    return ApiResponse.created(res, topic, 'Topic added successfully.');
  });

  static addLesson = asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const lesson = await InstructorService.addLesson(req.user.userId, topicId, req.body);
    return ApiResponse.created(res, lesson, 'Lesson added successfully.');
  });

  static getWebinars = asyncHandler(async (req, res) => {
    const data = await InstructorService.getWebinars(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Webinars retrieved successfully.');
  });

  static createWebinar = asyncHandler(async (req, res) => {
    const webinar = await InstructorService.createWebinar(req.user.userId, req.body);
    return ApiResponse.created(res, webinar, 'Webinar created successfully.');
  });

  static updateWebinar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const webinar = await InstructorService.updateWebinar(req.user.userId, id, req.body);
    return ApiResponse.success(res, webinar, 'Webinar updated successfully.');
  });

  static deleteWebinar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await InstructorService.deleteWebinar(req.user.userId, id);
    return ApiResponse.success(res, result, 'Webinar deleted successfully.');
  });

  static updateWebinarStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const webinar = await InstructorService.updateWebinarStatus(req.user.userId, id, req.body);
    return ApiResponse.success(res, webinar, 'Webinar status updated successfully.');
  });

  static getStudents = asyncHandler(async (req, res) => {
    const data = await InstructorService.getStudents(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Students retrieved successfully.');
  });

  static getReviews = asyncHandler(async (req, res) => {
    const data = await InstructorService.getReviews(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Instructor reviews retrieved successfully.');
  });

  static getAnalytics = asyncHandler(async (req, res) => {
    const data = await InstructorService.getAnalytics(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Instructor analytics retrieved successfully.');
  });

  static getQuestions = asyncHandler(async (req, res) => {
    const data = await InstructorService.getQuestions(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Questions retrieved successfully.');
  });

  static answerQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const answer = await InstructorService.answerQuestion(req.user.userId, questionId, req.body);
    return ApiResponse.created(res, answer, 'Answer submitted successfully.');
  });

  static getProfile = asyncHandler(async (req, res) => {
    const data = await InstructorService.getProfile(req.user.userId);
    return ApiResponse.success(res, data, 'Instructor profile retrieved successfully.');
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const data = await InstructorService.updateProfile(req.user.userId, req.body);
    return ApiResponse.success(res, data, 'Instructor profile updated successfully.');
  });

  static completeOnboarding = asyncHandler(async (req, res) => {
    const data = await InstructorService.completeOnboarding(req.user.userId, req.body);
    return ApiResponse.success(res, data, 'Profile completed successfully! Welcome to your dashboard.');
  });

  static submitForReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await InstructorService.submitForReview(req.user.userId, id);
    return ApiResponse.success(res, course, 'Course submitted for review successfully.');
  });

  static createPublishingFeeOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { returnUrl } = req.body || {};
    const result = await InstructorService.createPublishingFeeOrder(req.user.userId, id, returnUrl);
    return ApiResponse.success(res, result, 'Cashfree publishing fee order created.');
  });

  static verifyPublishingFee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orderId = req.body?.orderId || req.body?.cashfreeOrderId || req.query?.orderId;
    const result = await InstructorService.verifyPublishingFee(req.user.userId, id, orderId);
    return ApiResponse.success(res, result, result.message || 'Publishing fee payment verified.');
  });

  static getPublishingFeeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orderId = req.query?.orderId || req.body?.orderId;
    const result = await InstructorService.verifyPublishingFee(req.user.userId, id, orderId);
    return ApiResponse.success(res, result, result.message || 'Publishing fee status retrieved.');
  });

  static publishCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const course = await InstructorService.publishCourse(req.user.userId, id);
    return ApiResponse.success(res, course, 'Course published successfully.');
  });
}
