import { SuperAdminService } from './superAdmin.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class SuperAdminController {
  // 1. Dashboard Overview
  static getDashboard = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getDashboardOverview();
    return ApiResponse.success(res, data, 'Super Admin platform overview retrieved.');
  });

  // 2. Users Management & Lifecycle (Students, Instructors, Admins)
  static getUsers = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getUsersList(req.query);
    return ApiResponse.success(res, data, 'Users list retrieved successfully.');
  });

  static createUser = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createUser({
      ...req.body,
      actorId: req.user.userId,
    });
    return ApiResponse.created(res, data, 'User account provisioned successfully.');
  });

  static terminateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const data = await SuperAdminService.terminateUser(id, {
      reason,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'User access terminated successfully.');
  });

  static reactivateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.reactivateUser(id, {
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'User account reactivated successfully.');
  });

  static deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await SuperAdminService.deleteUser(id, { actorId: req.user.userId });
    return ApiResponse.success(res, null, 'User deleted permanently.');
  });

  // 3. Courses Management & Approvals
  static getCourses = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getCoursesList(req.query);
    return ApiResponse.success(res, data, 'Courses retrieved successfully.');
  });

  static updateCourseStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const data = await SuperAdminService.updateCourseStatus(id, status, req.user.userId);
    return ApiResponse.success(res, data, 'Course status updated.');
  });

  static getApprovalsQueue = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getCourseApprovalsQueue();
    return ApiResponse.success(res, data, 'Pending course approvals retrieved.');
  });

  static getCourseReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.getCourseReviewDetails(id);
    return ApiResponse.success(res, data, 'Course review details retrieved.');
  });

  static approveCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.approveCourse(id, req.user.userId);
    return ApiResponse.success(res, data, 'Course approved successfully.');
  });

  static rejectCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const data = await SuperAdminService.rejectCourse(id, { reason, actorId: req.user.userId });
    return ApiResponse.success(res, data, 'Course rejected.');
  });

  static getInstructorsList = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getInstructorsList();
    return ApiResponse.success(res, data, 'Registered instructors list retrieved.');
  });

  static createCourseOnBehalf = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createCourseOnBehalf(req.user.userId, req.body);
    return ApiResponse.created(res, data, 'Course created and published on behalf of instructor.');
  });

  // 4. Orders Management
  static getOrders = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getOrdersList(req.query);
    return ApiResponse.success(res, data, 'Orders retrieved successfully.');
  });

  // 5. Refunds Management
  static getRefunds = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getRefundsList();
    return ApiResponse.success(res, data, 'Refunds retrieved successfully.');
  });

  static processRefund = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.processRefund(id, { ...req.body, actorId: req.user.userId });
    return ApiResponse.success(res, data, 'Refund processed successfully.');
  });

  // 6. Payouts Management
  static getPayouts = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getPayoutsOverview();
    return ApiResponse.success(res, data, 'Payouts overview retrieved.');
  });

  // 7. Countries Management
  static getCountries = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getCountries();
    return ApiResponse.success(res, data, 'Countries retrieved.');
  });

  static createCountry = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createCountry(req.body);
    return ApiResponse.created(res, data, 'Country created.');
  });

  static toggleCountry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.toggleCountryStatus(id);
    return ApiResponse.success(res, data, 'Country status updated.');
  });

  // 8. Currencies Management
  static getCurrencies = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getCurrencies();
    return ApiResponse.success(res, data, 'Currencies retrieved.');
  });

  static createCurrency = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createCurrency(req.body);
    return ApiResponse.created(res, data, 'Currency created.');
  });

  static toggleCurrency = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.toggleCurrencyStatus(id);
    return ApiResponse.success(res, data, 'Currency status updated.');
  });

  // 9. Taxes Management
  static getTaxes = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getTaxes();
    return ApiResponse.success(res, data, 'Taxes retrieved.');
  });

  static createTax = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createTax(req.body);
    return ApiResponse.created(res, data, 'Tax rate created.');
  });

  static toggleTax = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.toggleTaxStatus(id);
    return ApiResponse.success(res, data, 'Tax status updated.');
  });

  // 10. Infrastructure & Fraud
  static getInfrastructure = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getInfrastructure();
    return ApiResponse.success(res, data, 'Infrastructure telemetry retrieved.');
  });

  static getFraud = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getFraudReports();
    return ApiResponse.success(res, data, 'Fraud monitoring reports retrieved.');
  });
}
