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
}
