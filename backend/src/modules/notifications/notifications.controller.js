import { NotificationsService } from './notifications.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class NotificationsController {
  static getMyNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const data = await NotificationsService.getUserNotifications(userId);
    return ApiResponse.success(res, data, 'Notifications retrieved successfully.');
  });

  static markAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const result = await NotificationsService.markAsRead(userId, id);
    return ApiResponse.success(res, result, 'Notification marked as read.');
  });

  static markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.userId || req.user.id;
    const result = await NotificationsService.markAllAsRead(userId);
    return ApiResponse.success(res, result, 'All notifications marked as read.');
  });
}
