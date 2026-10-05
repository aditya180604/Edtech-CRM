import mongoose from 'mongoose';
import { Course, TopicContentOffering, LearningPath, Entitlement, Coupon, User } from '../../models/index.js';
import { ENTITLEMENT_STATUS, PRODUCT_TYPES } from '../../config/constants.js';

export class PricingService {
  /**
   * Centralized Authoritative Cart & Checkout Pricing Calculation
   * Single Source of Truth across GET cart, quote, and final checkout.
   */
  static async calculateCartPricing({ items = [], couponCode = null, userId = null }) {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        credit: 0,
        finalAmount: 0,
        currency: 'INR',
        coupon: { applied: false },
        itemCount: 0,
      };
    }

    // 1. Authoritatively fetch every product from DB
    const lineItems = [];
    let defaultCurrency = 'INR';

    for (const rawItem of items) {
      const productId = rawItem.productId || rawItem._id || rawItem.id;
      const productType = rawItem.productType || PRODUCT_TYPES.COURSE;

      if (!productId || !mongoose.isValidObjectId(productId)) {
        continue;
      }

      if (productType === PRODUCT_TYPES.COURSE) {
        const course = await Course.findById(productId)
          .populate('instructorId', 'firstName lastName email')
          .lean();

        if (!course) {
          lineItems.push({
            productId: productId.toString(),
            productType: PRODUCT_TYPES.COURSE,
            courseId: productId.toString(),
            title: 'Unavailable Course',
            unavailable: true,
            unitPrice: 0,
            discount: 0,
            finalPrice: 0,
            currency: 'INR',
          });
          continue;
        }

        defaultCurrency = course.currency || 'INR';

        // Check if student already owns active entitlement for this course
        let alreadyOwned = false;
        if (userId && mongoose.isValidObjectId(userId)) {
          const existingEntitlement = await Entitlement.findOne({
            userId,
            productType: PRODUCT_TYPES.COURSE,
            productId: course._id,
            status: ENTITLEMENT_STATUS.ACTIVE,
          });
          if (existingEntitlement) {
            alreadyOwned = true;
          }
        }

        const authoritativePrice = Math.max(0, Number(course.coursePrice) || 0);

        lineItems.push({
          productId: course._id.toString(),
          productType: PRODUCT_TYPES.COURSE,
          courseId: course._id.toString(),
          title: course.title,
          slug: course.slug,
          thumbnail: course.thumbnail,
          instructorId: course.instructorId?._id?.toString() || course.instructorId?.toString() || null,
          instructorName: course.instructorId
            ? `${course.instructorId.firstName || ''} ${course.instructorId.lastName || ''}`.trim()
            : 'Lead Instructor',
          price: authoritativePrice,
          unitPrice: authoritativePrice,
          discount: 0,
          finalPrice: authoritativePrice,
          currency: course.currency || 'INR',
          status: course.status,
          alreadyOwned,
          unavailable: course.status === 'ARCHIVED' || course.status === 'DRAFT',
        });
      } else if (productType === PRODUCT_TYPES.CONTENT_OFFERING) {
        const offering = await TopicContentOffering.findById(productId)
          .populate('instructorId', 'firstName lastName email')
          .lean();

        if (!offering) {
          lineItems.push({
            productId: productId.toString(),
            productType: PRODUCT_TYPES.CONTENT_OFFERING,
            title: 'Unavailable Offering',
            unavailable: true,
            unitPrice: 0,
            discount: 0,
            finalPrice: 0,
            currency: 'INR',
          });
          continue;
        }

        defaultCurrency = offering.currency || 'INR';

        let alreadyOwned = false;
        if (userId && mongoose.isValidObjectId(userId)) {
          const existingEntitlement = await Entitlement.findOne({
            userId,
            productType: PRODUCT_TYPES.CONTENT_OFFERING,
            productId: offering._id,
            status: ENTITLEMENT_STATUS.ACTIVE,
          });
          if (existingEntitlement) {
            alreadyOwned = true;
          }
        }

        const authoritativePrice = Math.max(0, Number(offering.price) || 0);

        lineItems.push({
          productId: offering._id.toString(),
          productType: PRODUCT_TYPES.CONTENT_OFFERING,
          courseId: offering.courseId?.toString() || null,
          topicId: offering.topicId?.toString() || null,
          title: offering.title,
          instructorId: offering.instructorId?._id?.toString() || offering.instructorId?.toString() || null,
          instructorName: offering.instructorId
            ? `${offering.instructorId.firstName || ''} ${offering.instructorId.lastName || ''}`.trim()
            : 'Tutor',
          price: authoritativePrice,
          unitPrice: authoritativePrice,
          discount: 0,
          finalPrice: authoritativePrice,
          currency: offering.currency || 'INR',
          status: offering.status,
          alreadyOwned,
          unavailable: offering.status !== 'PUBLISHED',
        });
      } else if (productType === PRODUCT_TYPES.LEARNING_PATH) {
        const pathDoc = await LearningPath.findById(productId).lean();

        if (!pathDoc) {
          lineItems.push({
            productId: productId.toString(),
            productType: PRODUCT_TYPES.LEARNING_PATH,
            title: 'Unavailable Learning Path',
            unavailable: true,
            unitPrice: 0,
            discount: 0,
            finalPrice: 0,
            currency: 'INR',
          });
          continue;
        }

        let alreadyOwned = false;
        if (userId && mongoose.isValidObjectId(userId)) {
          const existingEntitlement = await Entitlement.findOne({
            userId,
            productType: PRODUCT_TYPES.LEARNING_PATH,
            productId: pathDoc._id,
            status: ENTITLEMENT_STATUS.ACTIVE,
          });
          if (existingEntitlement) {
            alreadyOwned = true;
          }
        }

        lineItems.push({
          productId: pathDoc._id.toString(),
          productType: PRODUCT_TYPES.LEARNING_PATH,
          learningPathId: pathDoc._id.toString(),
          title: pathDoc.title,
          slug: pathDoc.slug,
          thumbnail: pathDoc.thumbnail || null,
          instructorId: pathDoc.createdBy?.toString() || null,
          instructorName: 'Curriculum Team',
          price: 0,
          unitPrice: 0,
          discount: 0,
          finalPrice: 0,
          currency: 'INR',
          status: pathDoc.status,
          alreadyOwned,
          unavailable: pathDoc.status === 'ARCHIVED' || pathDoc.status === 'DRAFT',
        });
      }
    }

    // Calculate subtotal of valid non-already-owned items
    const subtotal = lineItems
      .filter((i) => !i.unavailable && !i.alreadyOwned)
      .reduce((sum, item) => sum + item.unitPrice, 0);

    let appliedCouponInfo = { applied: false };
    let totalDiscount = 0;

    // 2. Coupon Validation & Course-Scoped Discount Calculation
    if (couponCode && typeof couponCode === 'string' && couponCode.trim().length > 0) {
      const cleanCode = couponCode.trim();

      const coupon = await Coupon.findOne({ code: cleanCode })
        .populate('courseId', 'title slug coursePrice currency status')
        .populate('instructorId', 'firstName lastName email');

      if (!coupon || coupon.status === 'ARCHIVED') {
        const error = new Error('This coupon code does not exist.');
        error.code = 'COUPON_NOT_FOUND';
        throw error;
      }

      if (coupon.status !== 'ACTIVE') {
        const error = new Error('This coupon is currently inactive.');
        error.code = 'COUPON_INACTIVE';
        throw error;
      }

      const now = new Date();

      if (coupon.startDate && new Date(coupon.startDate) > now) {
        const formattedDate = new Date(coupon.startDate).toLocaleString();
        const error = new Error(`This coupon is not active yet. It will become valid on ${formattedDate}.`);
        error.code = 'COUPON_NOT_STARTED';
        throw error;
      }

      if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
        const formattedDate = new Date(coupon.expiryDate).toLocaleDateString();
        const error = new Error(`This coupon expired on ${formattedDate}.`);
        error.code = 'COUPON_EXPIRED';
        throw error;
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        const error = new Error('This coupon has reached its maximum global usage limit.');
        error.code = 'COUPON_USAGE_LIMIT_REACHED';
        throw error;
      }

      // Check per-user limit
      if (userId && coupon.perUserLimit) {
        const { CouponRedemption } = await import('../../models/index.js');
        const userRedemptions = await CouponRedemption.countDocuments({
          couponId: coupon._id,
          userId,
          status: { $in: ['SUCCESS', 'REDEEMED', 'APPLIED'] },
        });

        if (userRedemptions >= coupon.perUserLimit) {
          const error = new Error(`You have already used this coupon the maximum allowed times (${coupon.perUserLimit}).`);
          error.code = 'COUPON_USER_LIMIT_REACHED';
          throw error;
        }
      }

      // 3. COURSE-SCOPED MATCHING:
      // The coupon is tied to a specific coupon.courseId. Find that specific course in the cart line items!
      const targetCourseId = coupon.courseId?._id?.toString() || coupon.courseId?.toString();
      const matchedLineItem = lineItems.find(
        (item) => !item.unavailable && !item.alreadyOwned && item.courseId === targetCourseId
      );

      if (!matchedLineItem) {
        const error = new Error('This coupon is not valid for the items in your cart.');
        error.code = 'COUPON_NOT_APPLICABLE';
        throw error;
      }

      // Check Minimum Purchase Amount on cart subtotal
      if (coupon.minimumAmount && subtotal < coupon.minimumAmount) {
        const error = new Error(`Minimum purchase amount of ₹${coupon.minimumAmount.toLocaleString('en-IN')} is required.`);
        error.code = 'COUPON_MINIMUM_AMOUNT_NOT_MET';
        throw error;
      }

      // Calculate discount ONLY on the matching course line item
      let calculatedDiscount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        calculatedDiscount = Math.round((matchedLineItem.unitPrice * coupon.discountValue) / 100);
        if (coupon.maximumDiscount && coupon.maximumDiscount > 0) {
          calculatedDiscount = Math.min(calculatedDiscount, coupon.maximumDiscount);
        }
      } else if (coupon.discountType === 'FIXED') {
        calculatedDiscount = Math.min(coupon.discountValue, matchedLineItem.unitPrice);
      }

      calculatedDiscount = Math.max(0, Math.min(calculatedDiscount, matchedLineItem.unitPrice));
      totalDiscount = calculatedDiscount;

      // Apply line-level discount to that specific item
      matchedLineItem.discount = calculatedDiscount;
      matchedLineItem.finalPrice = Math.max(0, matchedLineItem.unitPrice - calculatedDiscount);
      matchedLineItem.isEligibleForCoupon = true;

      appliedCouponInfo = {
        applied: true,
        couponId: coupon._id.toString(),
        code: coupon.code,
        courseId: targetCourseId,
        courseTitle: coupon.courseId?.title || matchedLineItem.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: calculatedDiscount,
        validUntil: coupon.expiryDate.toISOString(),
        remainingUses: Math.max(0, (coupon.usageLimit || 0) - (coupon.usedCount || 0)),
        description: coupon.description || (coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`),
      };
    }

    const finalAmount = Math.max(0, subtotal - totalDiscount);

    return {
      items: lineItems,
      subtotal,
      discount: totalDiscount,
      tax: 0,
      credit: 0,
      finalAmount,
      currency: defaultCurrency,
      coupon: appliedCouponInfo,
      itemCount: lineItems.filter((i) => !i.unavailable && !i.alreadyOwned).length,
    };
  }
}
