import { CatalogService } from './catalog.service.js';
import { ApiResponse, asyncHandler, AppError } from '../../utils/apiResponse.js';

export class CatalogController {
  /**
   * GET /api/v1/catalog/courses or /api/v1/courses
   */
  static getCourses = asyncHandler(async (req, res) => {
    const { category, level, search, limit, page, sort } = req.query;
    const data = await CatalogService.getCourses({ category, level, search, limit, page, sort });
    return ApiResponse.success(res, data, 'Courses retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/courses/:slugOrId
   */
  static getCourseBySlug = asyncHandler(async (req, res) => {
    const { slugOrId } = req.params;
    const course = await CatalogService.getCourseBySlug(slugOrId);
    if (!course) {
      throw new AppError('Course not found', 404);
    }
    return ApiResponse.success(res, course, 'Course details retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/topics or /api/v1/topics
   */
  static getTopics = asyncHandler(async (req, res) => {
    const { category, search, limit } = req.query;
    const topics = await CatalogService.getTopics({ category, search, limit });
    return ApiResponse.success(res, topics, 'Topics retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/webinars or /api/v1/webinars
   */
  static getWebinars = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const webinars = await CatalogService.getWebinars({ limit });
    return ApiResponse.success(res, webinars, 'Webinars retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/instructors or /api/v1/instructors
   */
  static getInstructors = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const instructors = await CatalogService.getInstructors({ limit });
    return ApiResponse.success(res, instructors, 'Instructors retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/learning-paths or /api/v1/learning-paths
   */
  static getLearningPaths = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const learningPaths = await CatalogService.getLearningPaths({ limit });
    return ApiResponse.success(res, learningPaths, 'Learning paths retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/categories
   */
  static getCategories = asyncHandler(async (req, res) => {
    const categories = await CatalogService.getCategories();
    return ApiResponse.success(res, categories, 'Categories retrieved successfully');
  });

  /**
   * GET /api/v1/catalog/stats or /api/v1/stats/public
   */
  static getPublicStats = asyncHandler(async (req, res) => {
    const stats = await CatalogService.getPublicStats();
    return ApiResponse.success(res, stats, 'Platform stats retrieved successfully');
  });
}
