import { AdminService } from './admin.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class AdminController {
  // Page 1: Dashboard Overview
  static getDashboard = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const overview = await AdminService.getDashboardOverview({ startDate, endDate });
    return ApiResponse.success(res, overview, 'Admin dashboard overview fetched successfully.');
  });

  // Page 2: Students
  static getStudents = asyncHandler(async (req, res) => {
    const { search, status, page, limit, sortBy, sortOrder } = req.query;
    const result = await AdminService.getStudents({ search, status, page, limit, sortBy, sortOrder });
    return ApiResponse.success(res, result, 'Students list fetched successfully.');
  });

  static getStudentById = asyncHandler(async (req, res) => {
    const student = await AdminService.getStudentById(req.params.id);
    return ApiResponse.success(res, student, 'Student details fetched successfully.');
  });

  static updateStudentStatus = asyncHandler(async (req, res) => {
    const result = await AdminService.updateStudentStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, result.message);
  });

  // Page 3: Instructors
  static getInstructors = asyncHandler(async (req, res) => {
    const { search, status, page, limit } = req.query;
    const result = await AdminService.getInstructors({ search, status, page, limit });
    return ApiResponse.success(res, result, 'Instructors list fetched successfully.');
  });

  static getInstructorById = asyncHandler(async (req, res) => {
    const instructor = await AdminService.getInstructorById(req.params.id);
    return ApiResponse.success(res, instructor, 'Instructor details fetched successfully.');
  });

  static updateInstructorStatus = asyncHandler(async (req, res) => {
    const result = await AdminService.updateInstructorStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, result.message);
  });

  // Page 4: Courses
  static getCourses = asyncHandler(async (req, res) => {
    const { search, status, category, page, limit } = req.query;
    const result = await AdminService.getCourses({ search, status, category, page, limit });
    return ApiResponse.success(res, result, 'Courses list fetched successfully.');
  });

  static updateCourseStatus = asyncHandler(async (req, res) => {
    const result = await AdminService.updateCourseStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, result.message);
  });

  // Page 5: Payments
  static getPayments = asyncHandler(async (req, res) => {
    const { search, status, page, limit, startDate, endDate } = req.query;
    const result = await AdminService.getPayments({ search, status, page, limit, startDate, endDate });
    return ApiResponse.success(res, result, 'Payments fetched successfully.');
  });

  // Page 6: Consultations
  static getConsultations = asyncHandler(async (req, res) => {
    const { search, status, page, limit } = req.query;
    const result = await AdminService.getConsultations({ search, status, page, limit });
    return ApiResponse.success(res, result, 'Consultations fetched successfully.');
  });

  // Page 7: Support Tickets
  static getSupportTickets = asyncHandler(async (req, res) => {
    const { search, status, priority, page, limit } = req.query;
    const result = await AdminService.getSupportTickets({ search, status, priority, page, limit });
    return ApiResponse.success(res, result, 'Support tickets fetched successfully.');
  });

  static updateSupportTicket = asyncHandler(async (req, res) => {
    const result = await AdminService.updateSupportTicket(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, result.message);
  });

  // Page 8: Reports
  static getReports = asyncHandler(async (req, res) => {
    const { range } = req.query;
    const reports = await AdminService.getReports({ range });
    return ApiResponse.success(res, reports, 'Reports fetched successfully.');
  });

  // Page 9: Notifications
  static getNotifications = asyncHandler(async (req, res) => {
    const { page, limit } = req.query;
    const result = await AdminService.getNotifications({ page, limit });
    return ApiResponse.success(res, result, 'Notifications log fetched successfully.');
  });

  // Page 10: Admin Settings
  static getProfile = asyncHandler(async (req, res) => {
    const profile = await AdminService.getAdminProfile(req.user.userId);
    return ApiResponse.success(res, profile, 'Admin profile fetched successfully.');
  });

  static updateProfile = asyncHandler(async (req, res) => {
    const result = await AdminService.updateAdminProfile(req.user.userId, req.body);
    return ApiResponse.success(res, result, result.message);
  });
}
