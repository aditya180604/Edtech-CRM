import { StudentDashboardService } from './studentDashboard.service.js';
import { ApiResponse, asyncHandler, AppError } from '../../utils/apiResponse.js';

export class StudentDashboardController {
  /**
   * GET /api/v1/dashboard/student
   * Returns comprehensive aggregated data for the authenticated student
   */
  static getDashboardOverview = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    const dashboardData = await StudentDashboardService.getOverview(userId);
    return ApiResponse.success(res, dashboardData, 'Student dashboard data retrieved successfully');
  });

  /**
   * POST /api/v1/dashboard/student/wishlist
   * Toggle a course or topic in student's wishlist
   */
  static toggleWishlist = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { productId, productType } = req.body;
    if (!productId) {
      throw new AppError('productId is required', 400);
    }
    const result = await StudentDashboardService.toggleWishlist(userId, { productId, productType });
    return ApiResponse.success(res, result, result.message);
  });

  /**
   * GET /api/v1/dashboard/student/wishlist/ids
   * Get all wishlisted productIds for the student
   */
  static getWishlistIds = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const ids = await StudentDashboardService.getWishlistIds(userId);
    return ApiResponse.success(res, ids, 'Wishlist IDs retrieved successfully');
  });
}

