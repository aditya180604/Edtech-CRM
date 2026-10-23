import { Router } from 'express';
import { rateLimit } from '../../middleware/rateLimit.js';
import { CouponController } from './coupon.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { authorize } from '../../middleware/rbac.js';
import { ROLES } from '../../config/constants.js';

const router = Router();

// ==========================================
// 1. Promotional Discounts & Coupons Management
// Accessible by SUPER_ADMIN, ADMIN, and INSTRUCTOR
// ==========================================
const discountAuth = [authenticate, authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.INSTRUCTOR)];

// Course Discounts Endpoints
router.get('/coupons/course-discounts', ...discountAuth, CouponController.getCourseDiscounts);
router.patch('/coupons/course-discounts/:courseId', ...discountAuth, CouponController.updateCourseDiscount);

// Coupon Dropdowns and CRUD (Unified for SuperAdmin and Instructor)
router.get('/coupons/courses/dropdown', ...discountAuth, CouponController.getCoursesDropdown);
router.post('/coupons', ...discountAuth, CouponController.createCoupon);
router.get('/coupons', ...discountAuth, CouponController.getCoupons);
router.get('/coupons/:couponId', ...discountAuth, CouponController.getCouponById);
router.patch('/coupons/:couponId', ...discountAuth, CouponController.updateCoupon);
router.patch('/coupons/:couponId/status', ...discountAuth, CouponController.updateCouponStatus);
router.delete('/coupons/:couponId', ...discountAuth, CouponController.deleteCoupon);

// Backward-compatible routes for existing SuperAdmin endpoints
router.get('/super-admin/courses/dropdown', ...discountAuth, CouponController.getCoursesDropdown);
router.post('/super-admin/coupons', ...discountAuth, CouponController.createCoupon);
router.get('/super-admin/coupons', ...discountAuth, CouponController.getCoupons);
router.get('/super-admin/coupons/:couponId', ...discountAuth, CouponController.getCouponById);
router.patch('/super-admin/coupons/:couponId', ...discountAuth, CouponController.updateCoupon);
router.patch('/super-admin/coupons/:couponId/status', ...discountAuth, CouponController.updateCouponStatus);
router.delete('/super-admin/coupons/:couponId', ...discountAuth, CouponController.deleteCoupon);

// ==========================================
// 2. Public / Course Offers & Validation
// ==========================================
router.get('/courses/:courseId/available-offers', CouponController.getAvailableOffers);
router.post('/coupons/validate', rateLimit({ name: 'coupon-validate', windowMs: 60 * 1000, max: 30 }), optionalAuthenticate, CouponController.validateCoupon);

export const couponRoutes = router;
