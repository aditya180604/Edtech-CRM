import path from 'path';
import fs from 'fs';
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

  static getInstructorDashboard = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { timeframe } = req.query;
    const data = await SuperAdminService.getInstructorDashboard(id, timeframe);
    return ApiResponse.success(res, data, 'Instructor dashboard telemetry retrieved for Super Admin.');
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

  static createRefund = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createRefund({
      ...req.body,
      actorId: req.user.userId,
    });
    return ApiResponse.created(res, data, 'Refund initiated and revenue updated successfully.');
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

  static initiatePayout = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const data = await SuperAdminService.initiatePayout(id, {
      paymentMethod,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Payout initiated and moved to PROCESSING status.');
  });

  static confirmManualPayout = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { paymentMethod, utrNumber, notes } = req.body;
    const data = await SuperAdminService.confirmManualPayout(id, {
      paymentMethod,
      utrNumber,
      notes,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Manual payout confirmed and marked COMPLETED with verified UTR.');
  });

  static processCashfreePayout = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.processCashfreePayout(id, {
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Cashfree automated payout completed and verified.');
  });

  static initiateBatchPayout = asyncHandler(async (req, res) => {
    const { paymentMethod } = req.body;
    const data = await SuperAdminService.initiateBatchPayout({
      paymentMethod,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Batch payout initiated. All pending earnings moved to PROCESSING.');
  });

  static confirmBatchPayout = asyncHandler(async (req, res) => {
    const { paymentMethod, utrNumber, notes } = req.body;
    const data = await SuperAdminService.confirmBatchPayout({
      paymentMethod,
      utrNumber,
      notes,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Batch payout confirmed and marked COMPLETED with batch UTR reference.');
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
    return ApiResponse.success(res, data, 'Fraud telemetry and reports retrieved.');
  });

  // 11. Instructor Verifications Workflow
  static getInstructorVerifications = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getInstructorVerifications(req.query);
    return ApiResponse.success(res, data, 'Instructor verification applications retrieved successfully.');
  });

  static getInstructorVerificationById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.getInstructorVerificationDetails(id);
    return ApiResponse.success(res, data, 'Instructor profile details retrieved.');
  });

  static approveInstructorVerification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await SuperAdminService.approveInstructorVerification(id, req.user.userId);
    return ApiResponse.success(res, data, 'Instructor verified and approved successfully. Dashboard access unlocked.');
  });

  static rejectInstructorVerification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const data = await SuperAdminService.rejectInstructorVerification(id, {
      reason,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Instructor verification application rejected.');
  });

  static requestChangesInstructorVerification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { feedback, reason } = req.body;
    const data = await SuperAdminService.requestChangesInstructorVerification(id, {
      feedback: feedback || reason,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Changes requested and notification sent to instructor.');
  });

  static getInstructorDocument = asyncHandler(async (req, res) => {
    const { id, docId } = req.params;
    const { view } = req.query;

    try {
      const { filePath, fileName, fileType } = await SuperAdminService.getInstructorDocumentStream(id, docId);
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({
          success: false,
          message: `Document file "${fileName || 'document'}" not found on server storage.`,
        });
      }

      const ext = path.extname(absolutePath).toLowerCase();

      // If viewing in browser/preview modal and file is a Word document (.docx/.doc)
      if (view === 'true' && (ext === '.docx' || ext === '.doc')) {
        try {
          const mammothModule = await import('mammoth');
          const mammoth = mammothModule.default || mammothModule;
          const converted = await mammoth.convertToHtml({ path: absolutePath });
          const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${fileName || 'Document'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 32px 16px;
    }
    .document-page {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 48px;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      box-sizing: border-box;
    }
    h1, h2, h3, h4 { color: #0f172a; margin-top: 1.4em; margin-bottom: 0.5em; }
    p { margin: 0.8em 0; }
    table { width: 100%; border-collapse: collapse; margin: 1.5em 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f1f5f9; font-weight: 600; }
    tr:nth-child(even) { background: #f8fafc; }
    a { color: #4f46e5; }
  </style>
</head>
<body>
  <div class="document-page">
    ${converted.value || '<p>No content found in document.</p>'}
  </div>
</body>
</html>`;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent((fileName || 'document').replace(/\.docx?$/i, '.html'))}"`);
          res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
          return res.send(styledHtml);
        } catch (err) {
          console.warn('Word document HTML conversion fallback:', err);
        }
      }

      res.setHeader('Content-Type', fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `${view === 'true' ? 'inline' : 'attachment'}; filename="${encodeURIComponent(fileName || 'document')}"`);
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      return res.sendFile(absolutePath);
    } catch (err) {
      console.error('[SuperAdmin getInstructorDocument error]', err);
      return res.status(404).json({
        success: false,
        message: err.message || 'Verification document not found.',
      });
    }
  });

  // 12. Instructor Registration Fee Management & Audit Ledger
  static getRegistrationFeeSettings = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getRegistrationFeeSettings();
    return ApiResponse.success(res, data, 'Registration fee settings retrieved successfully.');
  });

  static updateRegistrationFeeSettings = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.updateRegistrationFeeSettings({
      ...req.body,
      actorId: req.user.userId,
    });
    return ApiResponse.success(res, data, 'Instructor registration fee settings updated successfully.');
  });

  static getRegistrationFees = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getRegistrationFeesLedger(req.query);
    return ApiResponse.success(res, data, 'Instructor registration fees ledger retrieved successfully.');
  });

  // Backward compatibility alias for platform fees
  static getPlatformFees = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getRegistrationFeesLedger(req.query);
    return ApiResponse.success(res, data, 'Platform fees overview retrieved successfully.');
  });

  static verifyRegistrationFeeOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { forceMarkPaid } = req.body || {};
    const data = await SuperAdminService.verifyRegistrationFeeOrder(orderId, forceMarkPaid);
    return ApiResponse.success(res, data, data.message || 'Registration fee verified successfully.');
  });

  // 13. System Status & Audit Logs
  static getStatus = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getSystemStatus(req.user.userId);
    return ApiResponse.success(res, data, 'System status retrieved.');
  });

  static getAuditLogs = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getAuditLogs(req.query);
    return ApiResponse.success(res, data, 'Audit logs retrieved.');
  });

  // 12. Admin Management (Super Admin Exclusive)
  static getAdmins = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getAdmins(req.query);
    return ApiResponse.success(res, data, 'Admin accounts retrieved successfully.');
  });

  static createAdmin = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.createAdmin(req.body, req.user);
    return ApiResponse.success(res, data, 'Admin account created successfully.', 201);
  });

  static getAdminById = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getAdminById(req.params.id);
    return ApiResponse.success(res, data, 'Admin details retrieved successfully.');
  });

  static updateAdminPermissions = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.updateAdminPermissions(req.params.id, req.body, req.user);
    return ApiResponse.success(res, data, 'Admin permissions updated successfully.');
  });

  static updateAdminStatus = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.updateAdminStatus(req.params.id, req.body, req.user);
    return ApiResponse.success(res, data, data.message || 'Admin status updated successfully.');
  });

  static getAdminActivity = asyncHandler(async (req, res) => {
    const data = await SuperAdminService.getAdminActivity(req.params.id, req.query);
    return ApiResponse.success(res, data, 'Admin activity history retrieved successfully.');
  });
}

