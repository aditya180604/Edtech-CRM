import { Router } from 'express';
import { SlotController } from './slot.controller.js';
import { authenticate, optionalAuthenticate, authorizeRole } from '../../middleware/auth.js';

const router = Router();

// Public / Student discovery of available slots
router.get('/available', optionalAuthenticate, SlotController.getAvailableSlots);

// Student booking operations
router.post('/:id/book', authenticate, SlotController.bookSlot);
router.get('/my-bookings', authenticate, SlotController.getStudentBookings);
router.post('/bookings/:id/cancel', authenticate, SlotController.cancelBooking);
router.post('/bookings/:id/reschedule', authenticate, SlotController.rescheduleBooking);

// Instructor slot management operations
router.post(
  '/instructor',
  authenticate,
  authorizeRole(['INSTRUCTOR', 'SUPER_ADMIN']),
  SlotController.createSlot
);
router.get(
  '/instructor',
  authenticate,
  authorizeRole(['INSTRUCTOR', 'SUPER_ADMIN']),
  SlotController.getInstructorSlots
);
router.delete(
  '/instructor/:id',
  authenticate,
  authorizeRole(['INSTRUCTOR', 'SUPER_ADMIN']),
  SlotController.cancelInstructorSlot
);

export const slotRoutes = router;
