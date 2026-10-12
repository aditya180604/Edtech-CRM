import { Router } from 'express';
import { ConsultationController } from './consultation.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

// Public / Student Directory & Availability Discovery
router.get('/instructors', ConsultationController.getConsultationInstructors);
router.get('/instructors/:id/availability', ConsultationController.getInstructorAvailability);

// Instructor Consultation Configuration & Availability Management
router.get(
  '/instructor/settings',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN),
  ConsultationController.getInstructorSettings
);
router.patch(
  '/instructor/settings',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN),
  ConsultationController.updateInstructorSettings
);
router.post(
  '/instructor/availability',
  authenticate,
  authorize(ROLES.INSTRUCTOR, ROLES.SUPER_ADMIN),
  ConsultationController.saveWeeklyAvailability
);

// Student Consultation Booking, Payments & Meeting Access
router.post('/bookings', authenticate, ConsultationController.createBookingReservation);
router.post('/bookings/verify-payment', authenticate, ConsultationController.verifyBookingPayment);
router.get('/bookings/me', authenticate, ConsultationController.getMyConsultations);
router.post('/bookings/:id/review', authenticate, ConsultationController.submitConsultationReview);
router.post('/bookings/:id/join', authenticate, ConsultationController.generateJoinToken);

export const consultationRoutes = router;
