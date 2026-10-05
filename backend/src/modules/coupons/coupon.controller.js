import { CouponService } from './coupon.service.js';
import { PricingService } from '../checkout/pricing.service.js';
import { ApiResponse, asyncHandler } from '../../utils/apiResponse.js';

export class CouponController {
  /**
   * Super Admin: Create Coupon (Course-Scoped)
   */
  static createCoupon = asyncHandler(async (req, res) => {
    const meta = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const coupon = await CouponService.createCoupon(req.body, req.user, meta);
    return ApiResponse.created(res, coupon, 'Coupon created successfully.');
  });

  /**
   * Super Admin: List Coupons
   */
  static getCoupons = asyncHandler(async (req, res) => {
    const { page, limit, search, status, discountType, courseId } = req.query;
    const result = await CouponService.getCoupons({ page, limit, search, status, discountType, courseId });
    return ApiResponse.success(res, result, 'Coupons list retrieved successfully.');
  });

  /**
   * Super Admin: Get Courses for Creation Dropdown
   */
  static getCoursesDropdown = asyncHandler(async (req, res) => {
    const courses = await CouponService.getCoursesDropdownList();
    return ApiResponse.success(res, courses, 'Courses list retrieved.');
  });

  /**
   * Super Admin: Get Coupon Details
   */
  static getCouponById = asyncHandler(async (req, res) => {
    const { couponId } = req.params;
    const coupon = await CouponService.getCouponById(couponId);
    return ApiResponse.success(res, coupon, 'Coupon details retrieved successfully.');
  });

  /**
   * Super Admin: Update Coupon
   */
  static updateCoupon = asyncHandler(async (req, res) => {
    const { couponId } = req.params;
    const meta = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const updated = await CouponService.updateCoupon(couponId, req.body, req.user, meta);
    return ApiResponse.success(res, updated, 'Coupon updated successfully.');
  });

  /**
   * Super Admin: Toggle / Update Status (Activate / Deactivate)
   */
  static updateCouponStatus = asyncHandler(async (req, res) => {
    const { couponId } = req.params;
    const { status } = req.body;
    const meta = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const updated = await CouponService.updateCouponStatus(couponId, status, req.user, meta);
    return ApiResponse.success(res, updated, `Coupon status updated to ${status} successfully.`);
  });

  /**
   * Super Admin: Delete / Archive Coupon
   */
  static deleteCoupon = asyncHandler(async (req, res) => {
    const { couponId } = req.params;
    const meta = {
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const result = await CouponService.deleteCoupon(couponId, req.user, meta);
    return ApiResponse.success(res, result, result.message);
  });

  /**
   * Public: Safe Course Available Offers
   */
  static getAvailableOffers = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const offers = await CouponService.getAvailableOffersForCourse(courseId);
    return ApiResponse.success(res, offers, 'Available offers retrieved.');
  });

  /**
   * Student / Public: Validate Coupon (Delegates to centralized PricingService)
   */
  static validateCoupon = asyncHandler(async (req, res) => {
    const { code, cartItems = [], subtotal = 0 } = req.body;
    const userId = req.user?.userId || req.user?._id || null;

    try {
      const calculation = await PricingService.calculateCartPricing({
        items: cartItems,
        couponCode: code,
        userId,
      });

      return ApiResponse.success(res, calculation, 'Coupon applied successfully.');
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: error.code || 'COUPON_INVALID',
          message: error.message,
        },
        message: error.message,
      });
    }
  });
}
