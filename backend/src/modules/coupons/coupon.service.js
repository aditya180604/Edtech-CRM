import mongoose from 'mongoose';
import { Coupon, CouponRedemption, Course, User } from '../../models/index.js';
import { AuditLogger } from '../../utils/auditLogger.js';

// Strict validation: exactly 8 characters of uppercase, lowercase, numbers, and allowed special characters
export const COUPON_CODE_REGEX = /^[A-Za-z0-9!@#$%^&*]{8}$/;

export class CouponService {
  /**
   * Validate coupon code format
   */
  static validateCodeFormat(code) {
    if (!code || typeof code !== 'string') {
      throw new Error('Coupon code is required.');
    }
    if (code.length !== 8) {
      throw new Error('Coupon code must be exactly 8 characters.');
    }
    if (!COUPON_CODE_REGEX.test(code)) {
      throw new Error('Coupon code contains unsupported characters. Allowed: letters, numbers, and !@#$%^&*');
    }
    return code;
  }

  /**
   * Derive live status based on dates, limits, and stored status
   */
  static deriveCouponStatus(coupon) {
    if (coupon.status === 'ARCHIVED') return 'ARCHIVED';
    if (coupon.status === 'INACTIVE') return 'INACTIVE';

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return 'NOT_YET_ACTIVE';
    }
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return 'EXPIRED';
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return 'USAGE_LIMIT_REACHED';
    }
    return 'ACTIVE';
  }

  /**
   * Format coupon object with computed fields
   */
  static formatCoupon(couponDoc) {
    const coupon = couponDoc.toObject ? couponDoc.toObject() : { ...couponDoc };
    const remainingUses = Math.max(0, (coupon.usageLimit || 0) - (coupon.usedCount || 0));
    const derivedStatus = this.deriveCouponStatus(coupon);

    return {
      ...coupon,
      remainingUses,
      derivedStatus,
    };
  }

  /**
   * 1. CREATE COUPON (Super Admin Only — Course-Scoped)
   */
  static async createCoupon(payload, adminUser, requestMeta = {}) {
    const {
      code,
      courseId,
      discountType,
      discountValue,
      currency = 'INR',
      minimumAmount = 0,
      maximumDiscount,
      usageLimit = 100,
      perUserLimit = 1,
      startDate,
      expiryDate,
      status = 'ACTIVE',
      description,
      eligibleProducts,
      eligibleUsers,
    } = payload;

    // 1. Code validation
    const exactCode = this.validateCodeFormat(code);

    // 2. Uniqueness check (global uniqueness)
    const existing = await Coupon.findOne({ code: exactCode });
    if (existing) {
      throw new Error(`Coupon with code "${exactCode}" already exists.`);
    }

    // 3. Course validation & authoritative instructor derivation
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      throw new Error('A valid courseId is required. Every coupon must be scoped to a course.');
    }

    const course = await Course.findById(courseId).populate('instructorId');
    if (!course) {
      throw new Error('Course not found.');
    }
    if (course.status === 'ARCHIVED') {
      throw new Error('Cannot attach coupon to an archived course.');
    }

    // Derive instructor from course authoritatively
    const derivedInstructorId = course.instructorId?._id || course.instructorId || adminUser?._id;

    // 4. Discount Type & Value validation
    if (!['PERCENTAGE', 'FIXED'].includes(discountType)) {
      throw new Error('discountType must be either PERCENTAGE or FIXED.');
    }
    const numDiscountValue = Number(discountValue);
    if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
      throw new Error('discountValue must be greater than 0.');
    }
    if (discountType === 'PERCENTAGE' && numDiscountValue > 100) {
      throw new Error('Percentage discount cannot exceed 100%.');
    }

    // 5. Date validation
    if (!startDate || !expiryDate) {
      throw new Error('startDate and expiryDate are required.');
    }
    const start = new Date(startDate);
    const expiry = new Date(expiryDate);
    if (isNaN(start.getTime()) || isNaN(expiry.getTime())) {
      throw new Error('Invalid start or expiry date format.');
    }
    if (start >= expiry) {
      throw new Error('startDate must be before expiryDate.');
    }

    // 6. Usage limit validation
    const numUsageLimit = Number(usageLimit);
    if (isNaN(numUsageLimit) || numUsageLimit < 1 || !Number.isInteger(numUsageLimit)) {
      throw new Error('usageLimit must be a positive integer.');
    }
    const numPerUserLimit = Number(perUserLimit);
    if (isNaN(numPerUserLimit) || numPerUserLimit < 1 || !Number.isInteger(numPerUserLimit)) {
      throw new Error('perUserLimit must be a positive integer.');
    }

    // 7. Max discount validation
    let numMaxDiscount = undefined;
    if (maximumDiscount !== undefined && maximumDiscount !== null && maximumDiscount !== '') {
      numMaxDiscount = Number(maximumDiscount);
      if (isNaN(numMaxDiscount) || numMaxDiscount < 0) {
        throw new Error('maximumDiscount must be greater than or equal to 0.');
      }
    }

    // 8. Minimum amount validation
    const numMinAmount = Number(minimumAmount) || 0;
    if (numMinAmount < 0) {
      throw new Error('minimumAmount cannot be negative.');
    }

    const coupon = await Coupon.create({
      code: exactCode,
      courseId: course._id,
      instructorId: derivedInstructorId,
      ownerType: 'SUPER_ADMIN',
      discountType,
      discountValue: numDiscountValue,
      currency: course.currency || currency,
      minimumAmount: numMinAmount,
      maximumDiscount: numMaxDiscount,
      usageLimit: numUsageLimit,
      usedCount: 0,
      perUserLimit: numPerUserLimit,
      startDate: start,
      expiryDate: expiry,
      status: status || 'ACTIVE',
      description,
      eligibleProducts: eligibleProducts || [course._id],
      eligibleUsers: eligibleUsers || [],
      createdBy: adminUser?._id,
      updatedBy: adminUser?._id,
    });

    // 9. Audit Log
    await AuditLogger.log({
      actorId: adminUser?._id,
      action: 'CREATE_COUPON',
      resourceType: 'COUPON',
      resourceId: coupon._id.toString(),
      newValue: {
        code: coupon.code,
        courseId: coupon.courseId,
        instructorId: coupon.instructorId,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        usageLimit: coupon.usageLimit,
        startDate: coupon.startDate,
        expiryDate: coupon.expiryDate,
      },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    const populated = await Coupon.findById(coupon._id)
      .populate('courseId', 'title slug coursePrice currency')
      .populate('instructorId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');

    return this.formatCoupon(populated);
  }

  /**
   * 2. LIST COUPONS (Super Admin Only)
   */
  static async getCoupons({ page = 1, limit = 20, search, status, discountType, courseId }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (status && status !== 'ALL') {
      if (status === 'EXPIRED') {
        filter.expiryDate = { $lt: new Date() };
      } else if (status === 'NOT_YET_ACTIVE') {
        filter.startDate = { $gt: new Date() };
      } else {
        filter.status = status;
      }
    } else {
      filter.status = { $ne: 'ARCHIVED' };
    }

    if (discountType && discountType !== 'ALL') {
      filter.discountType = discountType;
    }

    if (courseId && mongoose.isValidObjectId(courseId)) {
      filter.courseId = courseId;
    }

    if (search && search.trim()) {
      const sanitized = search.trim();
      filter.$or = [
        { code: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [coupons, total] = await Promise.all([
      Coupon.find(filter)
        .populate('courseId', 'title slug coursePrice currency status')
        .populate('instructorId', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email')
        .populate('updatedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Coupon.countDocuments(filter),
    ]);

    // Summary statistics for dashboard cards
    const [totalCoupons, activeCoupons, expiredCoupons, totalRedemptions] = await Promise.all([
      Coupon.countDocuments({ status: { $ne: 'ARCHIVED' } }),
      Coupon.countDocuments({
        status: 'ACTIVE',
        startDate: { $lte: new Date() },
        expiryDate: { $gte: new Date() },
      }),
      Coupon.countDocuments({
        expiryDate: { $lt: new Date() },
        status: { $ne: 'ARCHIVED' },
      }),
      CouponRedemption.countDocuments({ status: { $in: ['SUCCESS', 'REDEEMED'] } }),
    ]);

    return {
      coupons: coupons.map((c) => this.formatCoupon(c)),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      stats: {
        totalCoupons,
        activeCoupons,
        expiredCoupons,
        totalRedemptions,
      },
    };
  }

  /**
   * 3. GET COUPON BY ID
   */
  static async getCouponById(couponId) {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new Error('Invalid coupon ID format.');
    }
    const coupon = await Coupon.findById(couponId)
      .populate('courseId', 'title slug coursePrice currency status')
      .populate('instructorId', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');
    if (!coupon) {
      throw new Error('Coupon not found.');
    }
    return this.formatCoupon(coupon);
  }

  /**
   * 4. UPDATE COUPON (Super Admin Only)
   */
  static async updateCoupon(couponId, updateData, adminUser, requestMeta = {}) {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new Error('Invalid coupon ID format.');
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new Error('Coupon not found.');
    }

    const oldValue = coupon.toObject();
    const updates = {};

    // 1. Code update
    if (updateData.code && updateData.code !== coupon.code) {
      const newCode = this.validateCodeFormat(updateData.code);
      const existing = await Coupon.findOne({ code: newCode, _id: { $ne: coupon._id } });
      if (existing) {
        throw new Error(`Coupon code "${newCode}" is already taken.`);
      }
      updates.code = newCode;
    }

    // 2. Course update
    if (updateData.courseId && updateData.courseId.toString() !== coupon.courseId?.toString()) {
      const course = await Course.findById(updateData.courseId).populate('instructorId');
      if (!course) {
        throw new Error('Course not found.');
      }
      updates.courseId = course._id;
      updates.instructorId = course.instructorId?._id || course.instructorId || adminUser?._id;
      updates.currency = course.currency || 'INR';
    }

    // 3. Discount Type & Value
    if (updateData.discountType) {
      if (!['PERCENTAGE', 'FIXED'].includes(updateData.discountType)) {
        throw new Error('discountType must be PERCENTAGE or FIXED.');
      }
      updates.discountType = updateData.discountType;
    }
    if (updateData.discountValue !== undefined) {
      const numDiscountValue = Number(updateData.discountValue);
      if (isNaN(numDiscountValue) || numDiscountValue <= 0) {
        throw new Error('discountValue must be greater than 0.');
      }
      const effectiveType = updates.discountType || coupon.discountType;
      if (effectiveType === 'PERCENTAGE' && numDiscountValue > 100) {
        throw new Error('Percentage discount cannot exceed 100%.');
      }
      updates.discountValue = numDiscountValue;
    }

    // 4. Dates
    if (updateData.startDate || updateData.expiryDate) {
      const start = updateData.startDate ? new Date(updateData.startDate) : coupon.startDate;
      const expiry = updateData.expiryDate ? new Date(updateData.expiryDate) : coupon.expiryDate;
      if (start >= expiry) {
        throw new Error('startDate must be before expiryDate.');
      }
      if (updateData.startDate) updates.startDate = start;
      if (updateData.expiryDate) updates.expiryDate = expiry;
    }

    // 5. Usage Limits
    if (updateData.usageLimit !== undefined) {
      const numUsageLimit = Number(updateData.usageLimit);
      if (isNaN(numUsageLimit) || numUsageLimit < 1) {
        throw new Error('usageLimit must be a positive integer.');
      }
      if (numUsageLimit < coupon.usedCount) {
        throw new Error(`usageLimit cannot be less than already redeemed count (${coupon.usedCount}).`);
      }
      updates.usageLimit = numUsageLimit;
    }
    if (updateData.perUserLimit !== undefined) {
      const numPerUserLimit = Number(updateData.perUserLimit);
      if (isNaN(numPerUserLimit) || numPerUserLimit < 1) {
        throw new Error('perUserLimit must be a positive integer.');
      }
      updates.perUserLimit = numPerUserLimit;
    }

    // 6. Min / Max
    if (updateData.minimumAmount !== undefined) {
      const numMinAmount = Number(updateData.minimumAmount);
      if (isNaN(numMinAmount) || numMinAmount < 0) {
        throw new Error('minimumAmount cannot be negative.');
      }
      updates.minimumAmount = numMinAmount;
    }
    if (updateData.maximumDiscount !== undefined) {
      if (updateData.maximumDiscount === null || updateData.maximumDiscount === '') {
        updates.maximumDiscount = null;
      } else {
        const numMaxDiscount = Number(updateData.maximumDiscount);
        if (isNaN(numMaxDiscount) || numMaxDiscount < 0) {
          throw new Error('maximumDiscount must be greater than or equal to 0.');
        }
        updates.maximumDiscount = numMaxDiscount;
      }
    }

    if (updateData.description !== undefined) {
      updates.description = updateData.description;
    }
    if (updateData.status && ['ACTIVE', 'INACTIVE'].includes(updateData.status)) {
      updates.status = updateData.status;
    }

    updates.updatedBy = adminUser?._id;

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, { $set: updates }, { new: true })
      .populate('courseId', 'title slug coursePrice currency status')
      .populate('instructorId', 'firstName lastName email');

    // Audit Log
    await AuditLogger.log({
      actorId: adminUser?._id,
      action: 'UPDATE_COUPON',
      resourceType: 'COUPON',
      resourceId: couponId,
      oldValue,
      newValue: updatedCoupon.toObject(),
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return this.formatCoupon(updatedCoupon);
  }

  /**
   * 5. UPDATE COUPON STATUS (Activate / Deactivate)
   */
  static async updateCouponStatus(couponId, status, adminUser, requestMeta = {}) {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new Error('Invalid coupon ID format.');
    }
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      throw new Error('Status must be ACTIVE or INACTIVE.');
    }

    const coupon = await Coupon.findById(couponId)
      .populate('courseId', 'title slug coursePrice currency status')
      .populate('instructorId', 'firstName lastName email');

    if (!coupon) {
      throw new Error('Coupon not found.');
    }

    const oldStatus = coupon.status;
    coupon.status = status;
    coupon.updatedBy = adminUser?._id;
    await coupon.save();

    const action = status === 'ACTIVE' ? 'ACTIVATE_COUPON' : 'DEACTIVATE_COUPON';
    await AuditLogger.log({
      actorId: adminUser?._id,
      action,
      resourceType: 'COUPON',
      resourceId: couponId,
      oldValue: { status: oldStatus },
      newValue: { status },
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return this.formatCoupon(coupon);
  }

  /**
   * 6. DELETE / SOFT-DELETE COUPON
   */
  static async deleteCoupon(couponId, adminUser, requestMeta = {}) {
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      throw new Error('Invalid coupon ID format.');
    }
    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new Error('Coupon not found.');
    }

    // Check if coupon has historical redemptions
    const redemptionCount = await CouponRedemption.countDocuments({ couponId });

    if (coupon.usedCount > 0 || redemptionCount > 0) {
      // Soft-delete: mark as ARCHIVED to protect historical orders and auditability
      coupon.status = 'ARCHIVED';
      coupon.updatedBy = adminUser?._id;
      await coupon.save();

      await AuditLogger.log({
        actorId: adminUser?._id,
        action: 'DELETE_COUPON',
        resourceType: 'COUPON',
        resourceId: couponId,
        oldValue: { status: coupon.status, usedCount: coupon.usedCount },
        newValue: { status: 'ARCHIVED', softDeleted: true },
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      });

      return { success: true, message: 'Coupon has historical redemptions and was archived.', couponId };
    }

    // If unused, permanently remove
    await Coupon.findByIdAndDelete(couponId);

    await AuditLogger.log({
      actorId: adminUser?._id,
      action: 'DELETE_COUPON',
      resourceType: 'COUPON',
      resourceId: couponId,
      oldValue: coupon.toObject(),
      newValue: null,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return { success: true, message: 'Coupon deleted successfully.', couponId };
  }

  /**
   * 7. GET SAFE AVAILABLE OFFERS FOR COURSE (Public / Course Detail)
   */
  static async getAvailableOffersForCourse(courseId) {
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
      return { hasCoupon: false, availableCount: 0 };
    }

    const now = new Date();
    const activeCoupons = await Coupon.find({
      courseId,
      status: 'ACTIVE',
      startDate: { $lte: now },
      expiryDate: { $gte: now },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
    }).lean();

    if (activeCoupons.length === 0) {
      return { hasCoupon: false, availableCount: 0 };
    }

    // Find highest percentage or fixed discount offer
    let bestDiscount = '';
    const pctOffers = activeCoupons.filter((c) => c.discountType === 'PERCENTAGE');
    if (pctOffers.length > 0) {
      const maxPct = Math.max(...pctOffers.map((c) => c.discountValue));
      bestDiscount = `Up to ${maxPct}% OFF at checkout`;
    } else {
      const maxFixed = Math.max(...activeCoupons.map((c) => c.discountValue));
      bestDiscount = `Up to ₹${maxFixed} OFF at checkout`;
    }

    return {
      hasCoupon: true,
      availableCount: activeCoupons.length,
      offerBadge: bestDiscount,
    };
  }

  /**
   * 8. GET PUBLISHED COURSES LIST (For Super Admin Dropdown)
   */
  static async getCoursesDropdownList() {
    const courses = await Course.find({ status: { $ne: 'ARCHIVED' } })
      .populate('instructorId', 'firstName lastName email')
      .select('title slug coursePrice currency instructorId status')
      .sort({ title: 1 })
      .lean();

    return courses.map((c) => ({
      _id: c._id,
      title: c.title,
      slug: c.slug,
      coursePrice: c.coursePrice,
      currency: c.currency || 'INR',
      status: c.status,
      instructor: c.instructorId
        ? {
            id: c.instructorId._id,
            name: `${c.instructorId.firstName || ''} ${c.instructorId.lastName || ''}`.trim(),
            email: c.instructorId.email,
          }
        : null,
    }));
  }

  /**
   * 9. STANDALONE VALIDATE COUPON (Reusable Service Method)
   */
  static async validateCoupon({ code, subtotal = 0, userId = null, courseId = null }) {
    if (!code || typeof code !== 'string') {
      throw new Error('Coupon code is required.');
    }
    const cleanCode = code.trim();
    const coupon = await Coupon.findOne({ code: cleanCode }).populate('courseId');
    if (!coupon || coupon.status === 'ARCHIVED') {
      const error = new Error('Invalid coupon code.');
      error.code = 'COUPON_NOT_FOUND';
      throw error;
    }
    if (coupon.status !== 'ACTIVE') {
      const error = new Error('Coupon is currently inactive.');
      error.code = 'COUPON_INACTIVE';
      throw error;
    }
    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      const error = new Error('Coupon is not active yet.');
      error.code = 'COUPON_NOT_STARTED';
      throw error;
    }
    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      const error = new Error('Coupon has expired.');
      error.code = 'COUPON_EXPIRED';
      throw error;
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      const error = new Error('Coupon usage limit has been reached.');
      error.code = 'COUPON_USAGE_LIMIT_REACHED';
      throw error;
    }
    if (userId && coupon.perUserLimit) {
      const redemptions = await CouponRedemption.countDocuments({
        couponId: coupon._id,
        userId,
        status: { $in: ['SUCCESS', 'REDEEMED', 'APPLIED'] },
      });
      if (redemptions >= coupon.perUserLimit) {
        const error = new Error(`You have already used this coupon the maximum allowed times (${coupon.perUserLimit}).`);
        error.code = 'COUPON_USER_LIMIT_REACHED';
        throw error;
      }
    }
    if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
      const error = new Error(`Minimum order amount of ₹${coupon.minimumAmount} required for this coupon.`);
      error.code = 'COUPON_MINIMUM_AMOUNT_NOT_MET';
      throw error;
    }

    let discountAmount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
        discountAmount = Math.min(discountAmount, coupon.maximumDiscount);
      }
    } else if (coupon.discountType === 'FIXED') {
      discountAmount = Math.min(coupon.discountValue, subtotal);
    }
    discountAmount = Math.max(0, Math.min(discountAmount, subtotal));
    const finalAmount = Math.max(0, subtotal - discountAmount);

    return {
      valid: true,
      couponId: coupon._id.toString(),
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      subtotal,
      finalAmount,
      currency: coupon.currency || 'INR',
    };
  }

  /**
   * 10. ATOMIC REDEEM COUPON
   */
  static async redeemCoupon({ couponId, userId, orderId, discountAmount = 0, currency = 'INR' }) {
    const updatedCoupon = await Coupon.findOneAndUpdate(
      {
        _id: couponId,
        status: 'ACTIVE',
        $expr: { $lt: ['$usedCount', '$usageLimit'] },
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!updatedCoupon) {
      const error = new Error('Failed to redeem coupon: usage limit reached or coupon inactive.');
      error.code = 'COUPON_USAGE_LIMIT_REACHED';
      throw error;
    }

    const redemption = await CouponRedemption.create({
      couponId: updatedCoupon._id,
      userId,
      courseId: updatedCoupon.courseId,
      orderId,
      code: updatedCoupon.code,
      discountAmount,
      currency,
      status: 'REDEEMED',
      redeemedAt: new Date(),
    });

    return redemption;
  }
}
