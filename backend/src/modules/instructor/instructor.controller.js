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

  static getStudents = asyncHandler(async (req, res) => {
    const data = await InstructorService.getStudents(req.user.userId, req.query);
    return ApiResponse.success(res, data, 'Students retrieved successfully.');
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
}
