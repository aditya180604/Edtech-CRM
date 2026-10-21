import path from 'path';
import fs from 'fs';
import { InstructorService } from './instructor.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';
import { ROLES } from '../../config/constants.js';

function getEffectiveUserId(req) {
  if (req.user?.role === ROLES.SUPER_ADMIN || req.user?.role === ROLES.ADMIN) {
    const rawOverride = req.headers?.['x-instructor-id'] || req.query?.instructorId || req.body?.instructorId;
    const override = Array.isArray(rawOverride) ? rawOverride[0] : rawOverride;
    if (override && typeof override === 'string' && override.trim().length > 0) {
      return override.trim();
    }
  }
  return req.user.userId;
}

export class InstructorController {
  static getDashboard = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getDashboardData(userId, req.query.timeframe);
    return ApiResponse.success(res, data, 'Instructor dashboard telemetry retrieved successfully.');
  });

  static getCourses = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getCourses(userId, req.query);
    return ApiResponse.success(res, data, 'Instructor courses retrieved successfully.');
  });

  static createCourse = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const course = await InstructorService.createCourse(userId, req.body);
    return ApiResponse.created(res, course, 'Course created successfully.');
  });

  static getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getCourseById(userId, id);
    return ApiResponse.success(res, data, 'Course details retrieved successfully.');
  });

  static updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const course = await InstructorService.updateCourse(userId, id, req.body);
    return ApiResponse.success(res, course, 'Course updated successfully.');
  });

  static deleteCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.deleteCourse(userId, id);
    return ApiResponse.success(res, result, 'Course deleted successfully.');
  });

  static updatePrice = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { coursePrice, currency } = req.body;
    const userId = getEffectiveUserId(req);
    const course = await InstructorService.updateCoursePrice(userId, id, { coursePrice, currency });
    return ApiResponse.success(res, course, 'Course price updated successfully.');
  });

  static updateVisibility = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { visibility, status } = req.body;
    const userId = getEffectiveUserId(req);
    const course = await InstructorService.updateCourseVisibility(userId, id, { visibility, status });
    return ApiResponse.success(res, course, 'Course visibility updated successfully.');
  });

  static addModule = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const module = await InstructorService.addModule(userId, id, req.body);
    return ApiResponse.created(res, module, 'Module added successfully.');
  });

  static addTopic = asyncHandler(async (req, res) => {
    const { moduleId } = req.params;
    const userId = getEffectiveUserId(req);
    const topic = await InstructorService.addTopic(userId, moduleId, req.body);
    return ApiResponse.created(res, topic, 'Topic added successfully.');
  });

  static addLesson = asyncHandler(async (req, res) => {
    const { topicId } = req.params;
    const userId = getEffectiveUserId(req);
    const lesson = await InstructorService.addLesson(userId, topicId, req.body);
    return ApiResponse.created(res, lesson, 'Lesson added successfully.');
  });

  static getWebinars = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getWebinars(userId, req.query);
    return ApiResponse.success(res, data, 'Webinars retrieved successfully.');
  });

  static createWebinar = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const webinar = await InstructorService.createWebinar(userId, req.body);
    return ApiResponse.created(res, webinar, 'Webinar created successfully.');
  });

  static updateWebinar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const webinar = await InstructorService.updateWebinar(userId, id, req.body);
    return ApiResponse.success(res, webinar, 'Webinar updated successfully.');
  });

  static deleteWebinar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.deleteWebinar(userId, id);
    return ApiResponse.success(res, result, 'Webinar deleted successfully.');
  });

  static updateWebinarStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const webinar = await InstructorService.updateWebinarStatus(userId, id, req.body);
    return ApiResponse.success(res, webinar, 'Webinar status updated successfully.');
  });

  static getStudents = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getStudents(userId, req.query);
    return ApiResponse.success(res, data, 'Students retrieved successfully.');
  });

  static getReviews = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getReviews(userId, req.query);
    return ApiResponse.success(res, data, 'Instructor reviews retrieved successfully.');
  });

  static getAnalytics = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getAnalytics(userId, req.query);
    return ApiResponse.success(res, data, 'Instructor analytics retrieved successfully.');
  });

  static getQuestions = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getQuestions(userId, req.query);
    return ApiResponse.success(res, data, 'Questions retrieved successfully.');
  });

  static answerQuestion = asyncHandler(async (req, res) => {
    const { questionId } = req.params;
    const userId = getEffectiveUserId(req);
    const answer = await InstructorService.answerQuestion(userId, questionId, req.body);
    return ApiResponse.created(res, answer, 'Answer submitted successfully.');
  });

  static getProfile = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getProfile(userId);
    return ApiResponse.success(res, data, 'Instructor profile retrieved successfully.');
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.updateProfile(userId, req.body);
    return ApiResponse.success(res, data, 'Instructor profile updated successfully.');
  });

  static completeOnboarding = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.completeOnboarding(userId, req.body);
    return ApiResponse.success(res, data, 'Profile completed successfully! Welcome to your dashboard.');
  });

  static submitForReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const course = await InstructorService.submitForReview(userId, id);
    return ApiResponse.success(res, course, 'Course submitted for review successfully.');
  });

  // Dynamic Instructor Registration Fee Endpoints
  static getRegistrationFeeInfo = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const data = await InstructorService.getRegistrationFeeInfo(userId);
    return ApiResponse.success(res, data, 'Registration fee information retrieved successfully.');
  });

  static createRegistrationFeeOrder = asyncHandler(async (req, res) => {
    const { returnUrl } = req.body || {};
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.createRegistrationFeeOrder(userId, returnUrl);
    return ApiResponse.success(res, result, 'Cashfree registration fee order created.');
  });

  static verifyRegistrationFee = asyncHandler(async (req, res) => {
    const orderId = req.body?.orderId || req.body?.cashfreeOrderId || req.query?.orderId;
    const simulation = Boolean(req.body?.simulation || req.query?.simulation);
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.verifyRegistrationFee(userId, orderId, simulation);
    return ApiResponse.success(res, result, result.message || 'Registration fee verified successfully.');
  });

  // Backward compatibility aliases for deprecated course publishing fee
  static createPublishingFeeOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { returnUrl } = req.body || {};
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.createPublishingFeeOrder(userId, id, returnUrl);
    return ApiResponse.success(res, result, 'Course publishing fee is not required.');
  });

  static verifyPublishingFee = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orderId = req.body?.orderId || req.body?.cashfreeOrderId || req.query?.orderId;
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.verifyPublishingFee(userId, id, orderId);
    return ApiResponse.success(res, result, 'Publishing fee verified.');
  });

  static getPublishingFeeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orderId = req.query?.orderId || req.body?.orderId;
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.verifyPublishingFee(userId, id, orderId);
    return ApiResponse.success(res, result, 'Course publishing fee waived.');
  });

  static publishCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = getEffectiveUserId(req);
    const course = await InstructorService.publishCourse(userId, id);
    return ApiResponse.success(res, course, 'Course published successfully.');
  });

  // Verification Document & Readiness Endpoints
  static uploadDocument = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const result = await InstructorService.uploadVerificationDocument(userId, req.body);
    return ApiResponse.success(res, result, 'Verification document uploaded successfully.');
  });

  static getDocument = asyncHandler(async (req, res) => {
    const { docId } = req.params;
    const userId = getEffectiveUserId(req);
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    try {
      const { filePath, fileName, fileType } = await InstructorService.getVerificationDocumentStream(
        userId,
        docId,
        isSuperAdmin
      );
      const absolutePath = path.resolve(filePath);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({
          success: false,
          message: `Document file "${fileName || 'document'}" not found on server storage.`,
        });
      }
      res.setHeader('Content-Type', fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName || 'document')}"`);
      return res.sendFile(absolutePath);
    } catch (err) {
      console.error('[Instructor getDocument error]', err);
      return res.status(404).json({
        success: false,
        message: err.message || 'Verification document not found.',
      });
    }
  });

  static getReadinessReport = asyncHandler(async (req, res) => {
    const userId = getEffectiveUserId(req);
    const report = await InstructorService.getReadinessReport(userId);
    return ApiResponse.success(res, report, 'Application readiness report retrieved.');
  });
}
