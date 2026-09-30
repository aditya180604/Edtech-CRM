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
}

