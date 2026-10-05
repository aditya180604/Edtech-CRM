import mongoose from 'mongoose';
import {
  Cart,
  Course,
  Order,
  OrderItem,
  Payment,
  Entitlement,
  Coupon,
  CouponRedemption,
  InstructorEarning,
  FinancialLedger,
  User,
} from '../../models/index.js';
import { PricingService } from './pricing.service.js';
import { CashfreeService } from '../payments/providers/cashfree/cashfree.service.js';
import { PaymentService } from '../payments/payment.service.js';
import { cashfreeConfig } from '../../config/cashfree.js';
import {
  PAYMENT_STATUS,
  ORDER_STATUS,
  PRODUCT_TYPES,
} from '../../config/constants.js';

export class CheckoutService {
  /**
   * 1. GET PRICING QUOTE
   */
  static async getQuote({ userId, couponCode = null }) {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('Valid authenticated user required to calculate quote.');
    }

    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
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

    return PricingService.calculateCartPricing({
      items: cart.items,
      couponCode,
      userId,
    });
  }

  /**
   * 2. PROCESS CHECKOUT (Creates Pending Order & Cashfree Payment Session)
   */
  static async processCheckout({
    userId,
    couponCode = null,
    paymentMethod = 'CASHFREE',
    idempotencyKey = null,
  }) {
    if (!userId || !mongoose.isValidObjectId(userId)) {
      throw new Error('Valid authenticated user required for checkout.');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Student user profile not found.');
    }

    // 1. Idempotency Check: Prevent duplicate charge/order if user double-clicks Pay
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const existingPayment = await Payment.findOne({
        userId,
        transactionReference: idempotencyKey,
      });

      if (existingPayment) {
        const existingOrder = await Order.findById(existingPayment.orderId);
        if (existingOrder) {
          // If already paid
          if (existingOrder.paymentStatus === PAYMENT_STATUS.SUCCESS) {
            return {
              success: true,
              isIdempotentReplay: true,
              orderId: existingOrder.orderId,
              order: existingOrder,
              paymentStatus: PAYMENT_STATUS.SUCCESS,
              message: 'Checkout already completed successfully for this transaction.',
            };
          }

          // If still pending, reuse existing payment session if available
          if (existingPayment.paymentSessionId) {
            return {
              success: true,
              isIdempotentReplay: true,
              orderId: existingOrder.orderId,
              paymentSessionId: existingPayment.paymentSessionId,
              orderAmount: existingOrder.finalAmount,
              currency: existingOrder.currency,
              paymentStatus: existingPayment.status,
            };
          }
        }
      }
    }

    // 2. Load Cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty.');
    }

    // 3. Authoritative Re-Pricing at exact time of checkout
    const pricing = await PricingService.calculateCartPricing({
      items: cart.items,
      couponCode,
      userId,
    });

    const validItems = pricing.items.filter((i) => !i.unavailable && !i.alreadyOwned);
    if (validItems.length === 0) {
      throw new Error('No purchasable items available in cart.');
    }

    // Check if any item was marked already owned
    const alreadyOwnedItems = pricing.items.filter((i) => i.alreadyOwned);
    if (alreadyOwnedItems.length > 0) {
      const titles = alreadyOwnedItems.map((i) => i.title).join(', ');
      const error = new Error(`You already own: ${titles}. Please remove from cart before proceeding.`);
      error.code = 'COURSE_ALREADY_OWNED';
      throw error;
    }

    // 4. Validate Coupon Quota if applied
    let targetCouponDoc = null;
    if (pricing.coupon && pricing.coupon.applied && pricing.coupon.couponId) {
      targetCouponDoc = await Coupon.findOne({
        _id: pricing.coupon.couponId,
        status: 'ACTIVE',
        $expr: { $lt: ['$usedCount', '$usageLimit'] },
      });

      if (!targetCouponDoc) {
        const error = new Error('This coupon has just reached its maximum usage limit.');
        error.code = 'COUPON_USAGE_LIMIT_REACHED';
        throw error;
      }
    }

    const orderIdCode = `LMS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 5. Create Internal PENDING Order
    const order = await Order.create({
      orderId: orderIdCode,
      userId,
      provider: 'CASHFREE',
      items: validItems.map((item) => ({
        productType: item.productType,
        productId: item.productId,
        courseId: item.courseId,
        title: item.title,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        finalPrice: item.finalPrice,
        currency: item.currency,
      })),
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      couponId: targetCouponDoc ? targetCouponDoc._id : null,
      couponCode: targetCouponDoc ? targetCouponDoc.code : null,
      couponDiscount: pricing.discount,
      tax: pricing.tax,
      credit: pricing.credit,
      finalAmount: pricing.finalAmount,
      currency: pricing.currency,
      paymentStatus: PAYMENT_STATUS.INITIATED,
      orderStatus: ORDER_STATUS.PAYMENT_PENDING,
    });

    // 6. Create OrderItems
    const createdOrderItems = [];
    for (const item of validItems) {
      const orderItem = await OrderItem.create({
        orderId: order._id,
        productType: item.productType,
        productId: item.productId,
        courseId: item.courseId,
        instructorId: item.instructorId,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        finalPrice: item.finalPrice,
        currency: item.currency,
      });
      createdOrderItems.push(orderItem);
    }

    // 7. Handle 100% Free / Zero Amount Order (Instant Finalization)
    if (pricing.finalAmount === 0) {
      const finalizeResult = await PaymentService.finalizeSuccessfulPayment({
        orderId: order.orderId,
        provider: 'ZERO_AMOUNT_CHECKOUT',
        providerOrderId: order.orderId,
        providerPaymentId: `FREE-${Date.now()}`,
        amount: 0,
        currency: pricing.currency,
        paymentMethod: 'FREE_COUPON',
      });

      return {
        success: true,
        orderId: order.orderId,
        order: finalizeResult.order,
        isZeroAmount: true,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        message: 'Order completed at ₹0 via promotional discount.',
      };
    }

    // 8. Handle Direct Test/Mock Payment (for isolated local unit tests)
    if (paymentMethod === 'MOCK_TEST_PAYMENT') {
      const finalizeResult = await PaymentService.finalizeSuccessfulPayment({
        orderId: order.orderId,
        provider: 'MOCK_TEST_PAYMENT',
        providerOrderId: order.orderId,
        providerPaymentId: `MOCK-${Date.now()}`,
        amount: order.finalAmount,
        currency: order.currency,
        paymentMethod: 'MOCK_TEST_PAYMENT',
      });

      return {
        success: true,
        orderId: order.orderId,
        order: finalizeResult.order,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        message: 'Mock test payment completed.',
      };
    }

    // 9. CREATE CASHFREE PG ORDER (Live Sandbox / Production)
    let cfOrder;
    try {
      cfOrder = await CashfreeService.createOrder({
        orderId: order.orderId,
        orderAmount: order.finalAmount,
        currency: order.currency || 'INR',
        customerId: user._id.toString(),
        customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
        customerEmail: user.email,
        customerPhone: user.phone || '9999999999',
        returnUrl: `${cashfreeConfig.frontendUrl}/checkout/result?order_id={order_id}`,
        notifyUrl: `${cashfreeConfig.backendPublicUrl}/api/v1/payments/cashfree/webhook`,
        orderNote: `LMS Course Purchase - Order ${order.orderId}`,
      });
    } catch (cfErr) {
      console.error('[Cashfree Order Creation Failure]:', cfErr.message);
      order.orderStatus = ORDER_STATUS.PAYMENT_FAILED;
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();
      throw new Error(`Payment gateway initialization failed: ${cfErr.message}`);
    }

    // 10. Record Initialized Payment Record
    const payment = await Payment.create({
      orderId: order._id,
      userId,
      provider: 'CASHFREE',
      providerOrderId: cfOrder.order_id || order.orderId,
      paymentSessionId: cfOrder.payment_session_id,
      amount: order.finalAmount,
      currency: order.currency,
      status: PAYMENT_STATUS.INITIATED,
      transactionReference: idempotencyKey || order.orderId,
      rawProviderReference: cfOrder,
    });

    order.paymentId = payment._id.toString();
    order.providerOrderId = cfOrder.order_id || order.orderId;
    await order.save();

    return {
      success: true,
      data: {
        orderId: order.orderId,
        paymentSessionId: cfOrder.payment_session_id,
        orderAmount: order.finalAmount,
        currency: order.currency,
        customer: {
          id: user._id.toString(),
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
          email: user.email,
          phone: user.phone || '9999999999',
        },
      },
    };
  }

  /**
   * 3. GET ORDER DETAILS (Historical Snapshot)
   */
  static async getOrderDetails(orderId, userId = null) {
    const query = mongoose.isValidObjectId(orderId)
      ? { $or: [{ _id: orderId }, { orderId }] }
      : { orderId };

    const order = await Order.findOne(query).lean();
    if (!order) {
      throw new Error('Order not found.');
    }

    if (userId && order.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized to view this order.');
    }

    const orderItems = await OrderItem.find({ orderId: order._id }).lean();

    return {
      ...order,
      orderItems,
    };
  }

  /**
   * 4. GET CHECKOUT & PAYMENT STATUS
   */
  static async getCheckoutStatus(orderId, userId) {
    return PaymentService.verifyAndReconcileOrderPayment(orderId, userId);
  }
}
