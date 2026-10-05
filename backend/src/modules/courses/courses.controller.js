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
}
