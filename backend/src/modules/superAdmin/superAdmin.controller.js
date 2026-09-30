import { SuperAdminService } from './superAdmin.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class SuperAdminController {
  static getStatus = asyncHandler(async (req, res) => {
    const status = await SuperAdminService.getSystemStatus(req.user.userId);
    return ApiResponse.success(res, status, 'Super Admin system status retrieved successfully.');
  });

  static getAuditLogs = asyncHandler(async (req, res) => {
    const { page, limit, action, resourceType } = req.query;
    const logs = await SuperAdminService.getAuditLogs({ page, limit, action, resourceType });
    return ApiResponse.success(res, logs, 'Audit logs retrieved successfully.');
  });

  static getUsers = asyncHandler(async (req, res) => {
    const { role, search, status, page, limit, sortBy, sortOrder } = req.query;
    const data = await SuperAdminService.getUsersList({
      role,
      search,
      status,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return ApiResponse.success(res, data, 'Real-time users list retrieved successfully.');
  });

  static updateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { status, role } = req.body;
    const user = await SuperAdminService.updateUserStatus(userId, { status, role });
    if (!user) {
      return ApiResponse.notFound(res, 'User not found.');
    }
    return ApiResponse.success(res, user, 'User updated successfully.');
  });
}

