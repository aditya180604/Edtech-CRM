import { Router } from 'express';
import { CouponController } from './coupon.controller.js';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.js';
import { authorizeSuperAdmin } from '../../middleware/rbac.js';

const router = Router();

// ==========================================
// 1. Super Admin Coupon Management Routes
// Strict Security: authenticate + authorizeSuperAdmin
// ==========================================
router.get('/super-admin/courses/dropdown', authenticate, authorizeSuperAdmin, CouponController.getCoursesDropdown);
router.post('/super-admin/coupons', authenticate, authorizeSuperAdmin, CouponController.createCoupon);
router.get('/super-admin/coupons', authenticate, authorizeSuperAdmin, CouponController.getCoupons);
router.get('/super-admin/coupons/:couponId', authenticate, authorizeSuperAdmin, CouponController.getCouponById);
router.patch('/super-admin/coupons/:couponId', authenticate, authorizeSuperAdmin, CouponController.updateCoupon);
router.patch('/super-admin/coupons/:couponId/status', authenticate, authorizeSuperAdmin, CouponController.updateCouponStatus);
router.delete('/super-admin/coupons/:couponId', authenticate, authorizeSuperAdmin, CouponController.deleteCoupon);

// ==========================================
// 2. Public / Course Offers & Validation
// ==========================================
router.get('/courses/:courseId/available-offers', CouponController.getAvailableOffers);
router.post('/coupons/validate', optionalAuthenticate, CouponController.validateCoupon);

export const couponRoutes = router;
