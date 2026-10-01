import { CoursesService } from './courses.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class CoursesController {
  static getFeatured = asyncHandler(async (req, res) => {
    const courses = await CoursesService.getFeaturedCourses(req.query.limit);
    return ApiResponse.success(res, courses, 'Featured courses retrieved successfully.');
  });

  static getCatalog = asyncHandler(async (req, res) => {
    const data = await CoursesService.getCatalog(req.query);
    return ApiResponse.success(res, data, 'Courses catalog retrieved successfully.');
  });

  static getDetails = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await CoursesService.getCourseDetails(slug);
    if (!data) {
      return ApiResponse.notFound(res, 'Course not found.');
    }
    return ApiResponse.success(res, data, 'Course details and syllabus retrieved successfully.');
  });

  static getTopics = asyncHandler(async (req, res) => {
    const topics = await CoursesService.getAllTopics(req.query);
    return ApiResponse.success(res, topics, 'Dynamic topics retrieved successfully.');
  });
}
