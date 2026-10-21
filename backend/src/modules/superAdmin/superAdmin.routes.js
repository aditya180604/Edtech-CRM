import { Router } from 'express';
import { SuperAdminController } from './superAdmin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeSuperAdmin } from '../../middleware/rbac.js';

const router = Router();

// Strict Security Barrier: All super-admin endpoints require authenticate + authorize('SUPER_ADMIN')
router.use(authenticate);
router.use(authorizeSuperAdmin);

// 1. Dashboard Overview
router.get('/dashboard', SuperAdminController.getDashboard);

// 2. Users Management (Students, Instructors, Admins)
router.get('/users', SuperAdminController.getUsers);
router.post('/users', SuperAdminController.createUser);
router.post('/users/:id/terminate', SuperAdminController.terminateUser);
router.post('/users/:id/reactivate', SuperAdminController.reactivateUser);
router.delete('/users/:id', SuperAdminController.deleteUser);

// 3. Courses Management
router.get('/courses', SuperAdminController.getCourses);
router.post('/courses/create-on-behalf', SuperAdminController.createCourseOnBehalf);
router.patch('/courses/:id/status', SuperAdminController.updateCourseStatus);
router.get('/courses/approvals', SuperAdminController.getApprovalsQueue);
router.get('/courses/:id/review', SuperAdminController.getCourseReview);
router.post('/courses/:id/approve', SuperAdminController.approveCourse);
router.post('/courses/:id/reject', SuperAdminController.rejectCourse);
router.get('/instructors', SuperAdminController.getInstructorsList);
router.get('/instructors/:id/dashboard', SuperAdminController.getInstructorDashboard);
router.get('/instructor-verifications', SuperAdminController.getInstructorVerifications);
router.get('/instructor-verifications/:id', SuperAdminController.getInstructorVerificationById);
router.get('/instructor-verifications/:id/documents/:docId', SuperAdminController.getInstructorDocument);
router.post('/instructor-verifications/:id/approve', SuperAdminController.approveInstructorVerification);
router.post('/instructor-verifications/:id/reject', SuperAdminController.rejectInstructorVerification);
router.post('/instructor-verifications/:id/request-changes', SuperAdminController.requestChangesInstructorVerification);

// 4. Orders Management
router.get('/orders', SuperAdminController.getOrders);

// 5. Refunds Management
router.get('/refunds', SuperAdminController.getRefunds);
router.post('/refunds', SuperAdminController.createRefund);
router.post('/refunds/:id/process', SuperAdminController.processRefund);

// 6. Payouts Management (Strict Settlement Lifecycle)
router.get('/payouts', SuperAdminController.getPayouts);
router.post('/payouts/:id/initiate', SuperAdminController.initiatePayout);
router.post('/payouts/:id/confirm-manual', SuperAdminController.confirmManualPayout);
router.post('/payouts/:id/process-cashfree', SuperAdminController.processCashfreePayout);
router.post('/payouts/batch/initiate', SuperAdminController.initiateBatchPayout);
router.post('/payouts/batch/confirm', SuperAdminController.confirmBatchPayout);

// 7. Countries Configuration
router.get('/countries', SuperAdminController.getCountries);
router.post('/countries', SuperAdminController.createCountry);
router.patch('/countries/:id/toggle', SuperAdminController.toggleCountry);

// 8. Currencies Configuration
router.get('/currencies', SuperAdminController.getCurrencies);
router.post('/currencies', SuperAdminController.createCurrency);
router.patch('/currencies/:id/toggle', SuperAdminController.toggleCurrency);

// 9. Taxes Configuration
router.get('/taxes', SuperAdminController.getTaxes);
router.post('/taxes', SuperAdminController.createTax);
router.patch('/taxes/:id/toggle', SuperAdminController.toggleTax);

// 10. Infrastructure & Fraud
router.get('/infrastructure', SuperAdminController.getInfrastructure);
router.get('/fraud', SuperAdminController.getFraud);

// 11. Instructor Registration Fee Management & Dynamic Rate Settings
router.get('/registration-fee/settings', SuperAdminController.getRegistrationFeeSettings);
router.put('/registration-fee/settings', SuperAdminController.updateRegistrationFeeSettings);
router.get('/registration-fees', SuperAdminController.getRegistrationFees);
router.post('/registration-fees/:orderId/verify', SuperAdminController.verifyRegistrationFeeOrder);

// 12. Admin Accounts & Permissions Management (Super Admin Exclusive)
router.get('/admins', SuperAdminController.getAdmins);
router.post('/admins', SuperAdminController.createAdmin);
router.get('/admins/:id', SuperAdminController.getAdminById);
router.patch('/admins/:id/permissions', SuperAdminController.updateAdminPermissions);
router.patch('/admins/:id/status', SuperAdminController.updateAdminStatus);
router.get('/admins/:id/activity', SuperAdminController.getAdminActivity);

// 12. System Status & Audit Logs
router.get('/status', SuperAdminController.getStatus);
router.get('/audit-logs', SuperAdminController.getAuditLogs);
router.get('/performance', SuperAdminController.getPerformance);

export const superAdminRoutes = router;

