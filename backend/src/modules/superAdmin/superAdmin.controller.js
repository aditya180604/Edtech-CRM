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
}
