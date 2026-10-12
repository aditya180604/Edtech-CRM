import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authorizeAdmin, requirePermission } from '../../middleware/rbac.js';
import { ADMIN_PERMISSIONS } from '../../config/constants.js';

const router = Router();

// Base security guard: Must be authenticated and have role ADMIN or SUPER_ADMIN
router.use(authenticate);
router.use(authorizeAdmin);

// Page 1: Dashboard Overview
router.get('/dashboard', AdminController.getDashboard);

// Page 2: Student Management
router.get('/students', requirePermission(ADMIN_PERMISSIONS.VIEW_STUDENTS), AdminController.getStudents);
router.get('/students/:id', requirePermission(ADMIN_PERMISSIONS.VIEW_STUDENTS), AdminController.getStudentById);
router.patch('/students/:id/status', requirePermission(ADMIN_PERMISSIONS.MANAGE_STUDENTS), AdminController.updateStudentStatus);

// Page 3: Instructor Management (Routine management; Super Admin retains verification authority)
router.get('/instructors', requirePermission(ADMIN_PERMISSIONS.VIEW_INSTRUCTORS), AdminController.getInstructors);
router.get('/instructors/:id', requirePermission(ADMIN_PERMISSIONS.VIEW_INSTRUCTORS), AdminController.getInstructorById);
router.patch('/instructors/:id/status', requirePermission(ADMIN_PERMISSIONS.MANAGE_INSTRUCTORS), AdminController.updateInstructorStatus);

// Page 4: Course Management
router.get('/courses', requirePermission(ADMIN_PERMISSIONS.VIEW_COURSES), AdminController.getCourses);
router.patch('/courses/:id/status', requirePermission(ADMIN_PERMISSIONS.MANAGE_COURSES), AdminController.updateCourseStatus);

// Page 5: Payments & Purchases
router.get('/payments', requirePermission(ADMIN_PERMISSIONS.VIEW_PAYMENTS), AdminController.getPayments);

// Page 6: Consultation Management
router.get('/consultations', requirePermission(ADMIN_PERMISSIONS.VIEW_CONSULTATIONS), AdminController.getConsultations);

// Page 7: Support & Complaints
router.get('/support-tickets', requirePermission(ADMIN_PERMISSIONS.VIEW_SUPPORT), AdminController.getSupportTickets);
router.patch('/support-tickets/:id', requirePermission(ADMIN_PERMISSIONS.MANAGE_SUPPORT), AdminController.updateSupportTicket);

// Page 8: Reports & Analytics
router.get('/reports', requirePermission(ADMIN_PERMISSIONS.VIEW_REPORTS), AdminController.getReports);

// Page 9: Notifications Monitoring
router.get('/notifications', requirePermission(ADMIN_PERMISSIONS.VIEW_NOTIFICATIONS), AdminController.getNotifications);

// Page 10: Admin Settings (Own Account Profile)
router.get('/me', AdminController.getProfile);
router.patch('/me', AdminController.updateProfile);

export const adminRoutes = router;
