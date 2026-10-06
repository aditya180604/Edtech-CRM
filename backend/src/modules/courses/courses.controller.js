import { CoursesService } from './courses.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class CoursesController {
  static getFeatured = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || req.user?._id || req.user?.id || null;
    const courses = await CoursesService.getFeaturedCourses(req.query.limit, userId);
    return ApiResponse.success(res, courses, 'Featured courses retrieved successfully.');
  });

  static getCatalog = asyncHandler(async (req, res) => {
    const userId = req.user?.userId || req.user?._id || req.user?.id || null;
    const data = await CoursesService.getCatalog(req.query, userId);
    return ApiResponse.success(res, data, 'Courses catalog retrieved successfully.');
  });

  static getDetails = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id || null;
    const data = await CoursesService.getCourseDetails(slug, userId);
    if (!data) {
      return ApiResponse.notFound(res, 'Course not found.');
    }
    return ApiResponse.success(res, data, 'Course details and syllabus retrieved successfully.');
  });

  static getTopics = asyncHandler(async (req, res) => {
    const topics = await CoursesService.getAllTopics(req.query);
    return ApiResponse.success(res, topics, 'Dynamic topics retrieved successfully.');
  });

  static updateProgress = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { lessonId, topicId, completed } = req.body;
    const result = await CoursesService.updateProgress({
      slug,
      userId,
      lessonId,
      topicId,
      completed,
    });
    return ApiResponse.success(res, result, 'Lesson progress updated successfully.');
  });

  static getMyReview = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const result = await CoursesService.getMyReview({ slug, userId });
    return ApiResponse.success(res, result, 'Course review retrieved successfully.');
  });

  static submitReview = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { rating, comment, title } = req.body;
    const result = await CoursesService.submitReview({
      slug,
      userId,
      rating,
      comment,
      title,
    });
    return ApiResponse.success(res, result, 'Course review submitted successfully.');
  });

  static getQuestions = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const result = await CoursesService.getQuestions({ slug });
    return ApiResponse.success(res, result, 'Course questions retrieved successfully.');
  });

  static askQuestion = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { question, lessonId, topicId } = req.body;
    const result = await CoursesService.askQuestion({
      slug,
      userId,
      question,
      lessonId,
      topicId,
    });
    return ApiResponse.created(res, result, 'Question posted successfully.');
  });

  static answerQuestion = asyncHandler(async (req, res) => {
    const { slug, questionId } = req.params;
    const userId = req.user?.userId || req.user?._id || req.user?.id;
    const { answer } = req.body;
    const result = await CoursesService.answerQuestion({
      slug,
      userId,
      questionId,
      answer,
    });
    return ApiResponse.created(res, result, 'Answer submitted successfully.');
  });
}
