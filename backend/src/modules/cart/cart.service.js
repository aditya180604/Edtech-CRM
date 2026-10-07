import mongoose from 'mongoose';
import { Cart, Course, Topic, TopicContentOffering, LearningPath, Entitlement } from '../../models/index.js';
import { ENTITLEMENT_STATUS, PRODUCT_TYPES } from '../../config/constants.js';
import { PricingService } from '../checkout/pricing.service.js';

export class CartService {
  /**
   * 1. GET User Cart with Authoritative Live Pricing
   */
  static async getCart(userId) {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('Valid user ID required to fetch cart.');
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Authoritative live pricing calculation
    const pricing = await PricingService.calculateCartPricing({
      items: cart.items,
      userId,
    });

    return {
      cartId: cart._id.toString(),
      items: pricing.items,
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      finalAmount: pricing.finalAmount,
      currency: pricing.currency,
      itemCount: pricing.itemCount,
    };
  }

  /**
   * 2. ADD Item to Cart (Authoritative Validation)
   */
  static async addItem(userId, { productType = PRODUCT_TYPES.COURSE, productId }) {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('Valid user ID required.');
    }
    if (!productId || !mongoose.isValidObjectId(productId)) {
      throw new Error('Valid product ID required.');
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // 1. Verify item is not already in cart
    const exists = cart.items.some(
      (item) => item.productId.toString() === productId.toString() && (item.productType === productType || (productType === 'CONTENT_OFFERING' && item.productType === 'CONTENT_OFFERING'))
    );
    if (exists) {
      const error = new Error('This item is already in your cart.');
      error.code = 'ALREADY_IN_CART';
      throw error;
    }

    // 2. Validate product in database
    if (productType === PRODUCT_TYPES.COURSE) {
      const course = await Course.findById(productId);
      if (!course) {
        throw new Error('Course not found.');
      }
      if (course.status === 'ARCHIVED' || course.status === 'DRAFT') {
        throw new Error('This course is not currently available for purchase.');
      }

      // Check if student already owns active entitlement
      const existingEntitlement = await Entitlement.findOne({
        userId,
        productType: PRODUCT_TYPES.COURSE,
        productId: course._id,
        status: ENTITLEMENT_STATUS.ACTIVE,
      });

      if (existingEntitlement) {
        const error = new Error('You already own this course. You can access it in your dashboard.');
        error.code = 'ALREADY_OWNED';
        throw error;
      }

      cart.items.push({
        productType: PRODUCT_TYPES.COURSE,
        productId: course._id,
        price: course.coursePrice || 0,
        currency: course.currency || 'INR',
      });
    } else if (productType === PRODUCT_TYPES.CONTENT_OFFERING || productType === 'TOPIC') {
      let offering = await TopicContentOffering.findById(productId);
      let topicDoc = null;

      if (!offering) {
        offering = await TopicContentOffering.findOne({ topicId: productId });
      }

      if (!offering) {
        topicDoc = await Topic.findById(productId);
      }

      if (!offering && !topicDoc) {
        throw new Error('This topic is not currently available for purchase.');
      }

      const resolvedId = offering ? offering._id : topicDoc._id;
      const resolvedPrice = offering ? (offering.price || 0) : (topicDoc.price || (topicDoc.isFree ? 0 : 299));
      const resolvedCourseId = offering ? offering.courseId : topicDoc.courseId;

      const existingEntitlement = await Entitlement.findOne({
        userId,
        $or: [
          { productType: PRODUCT_TYPES.CONTENT_OFFERING, productId: resolvedId },
          { productType: PRODUCT_TYPES.CONTENT_OFFERING, topicId: resolvedId },
          { productType: PRODUCT_TYPES.COURSE, productId: resolvedCourseId },
        ],
        status: ENTITLEMENT_STATUS.ACTIVE,
      });

      if (existingEntitlement) {
        const error = new Error('You already own this topic or the parent course.');
        error.code = 'ALREADY_OWNED';
        throw error;
      }

      cart.items.push({
        productType: PRODUCT_TYPES.CONTENT_OFFERING,
        productId: resolvedId,
        courseId: resolvedCourseId,
        price: resolvedPrice,
        currency: offering?.currency || topicDoc?.currency || 'INR',
      });
    } else if (productType === PRODUCT_TYPES.LEARNING_PATH) {
      const pathDoc = await LearningPath.findById(productId);
      if (!pathDoc || pathDoc.status === 'ARCHIVED' || pathDoc.status === 'DRAFT') {
        throw new Error('This learning path is not currently available.');
      }

      const existingEntitlement = await Entitlement.findOne({
        userId,
        productType: PRODUCT_TYPES.LEARNING_PATH,
        productId: pathDoc._id,
        status: ENTITLEMENT_STATUS.ACTIVE,
      });

      if (existingEntitlement) {
        const error = new Error('You are already enrolled in this learning path.');
        error.code = 'ALREADY_OWNED';
        throw error;
      }

      cart.items.push({
        productType: PRODUCT_TYPES.LEARNING_PATH,
        productId: pathDoc._id,
        price: 0,
        currency: 'INR',
      });
    }

    await cart.save();
    return this.getCart(userId);
  }

  /**
   * 3. REMOVE Item from Cart
   */
  static async removeItem(userId, productId) {
    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required.');
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      return { items: [], subtotal: 0, finalAmount: 0, itemCount: 0 };
    }

    cart.items = cart.items.filter((item) => item.productId.toString() !== productId.toString());
    await cart.save();

    return this.getCart(userId);
  }

  /**
   * 4. CLEAR Cart
   */
  static async clearCart(userId) {
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    return { success: true, message: 'Cart cleared successfully.' };
  }

  /**
   * 5. MERGE Guest Cart (after student logs in)
   */
  static async mergeGuestCart(userId, guestItems = []) {
    if (!userId || !Array.isArray(guestItems) || guestItems.length === 0) {
      return this.getCart(userId);
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    for (const gItem of guestItems) {
      const productId = gItem.productId || gItem._id || gItem.id;
      const productType = gItem.productType || PRODUCT_TYPES.COURSE;

      if (!productId || !mongoose.isValidObjectId(productId)) continue;

      const alreadyInCart = cart.items.some(
        (i) => i.productId.toString() === productId.toString() && i.productType === productType
      );
      if (alreadyInCart) continue;

      // Check active entitlement
      const owned = await Entitlement.findOne({
        userId,
        productType,
        productId,
        status: ENTITLEMENT_STATUS.ACTIVE,
      });
      if (owned) continue;

      cart.items.push({
        productType,
        productId,
        price: 0,
        currency: 'INR',
      });
    }

    await cart.save();
    return this.getCart(userId);
  }
}
