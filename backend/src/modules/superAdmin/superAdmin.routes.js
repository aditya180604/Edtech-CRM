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
router.get('/instructor-verifications', SuperAdminController.getInstructorVerifications);
router.get('/instructor-verifications/:id', SuperAdminController.getInstructorVerificationById);
router.post('/instructor-verifications/:id/approve', SuperAdminController.approveInstructorVerification);
router.post('/instructor-verifications/:id/reject', SuperAdminController.rejectInstructorVerification);

// 4. Orders Management
router.get('/orders', SuperAdminController.getOrders);

// 5. Refunds Management
router.get('/refunds', SuperAdminController.getRefunds);
router.post('/refunds/:id/process', SuperAdminController.processRefund);

// 6. Payouts Management
router.get('/payouts', SuperAdminController.getPayouts);

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

// 11. Platform Fees Management (Image & Real Cashfree Fees Oversight)
router.get('/platform-fees', SuperAdminController.getPlatformFees);

export const superAdminRoutes = router;
