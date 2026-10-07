import mongoose from 'mongoose';
import {
  Order,
  OrderItem,
  Payment,
  Entitlement,
  Coupon,
  CouponRedemption,
  InstructorEarning,
  FinancialLedger,
  TopicCredit,
  CourseUpgrade,
  Cart,
} from '../../models/index.js';
import { CashfreeService } from './providers/cashfree/cashfree.service.js';
import {
  PAYMENT_STATUS,
  ORDER_STATUS,
  ENTITLEMENT_STATUS,
  PRODUCT_TYPES,
  TRANSACTION_TYPES,
} from '../../config/constants.js';

export class PaymentService {
  /**
   * 1. IDEMPOTENT PAYMENT SUCCESS FINALIZATION
   * Single authoritative transaction boundary that transitions order -> PAID,
   * grants Entitlements, records CouponRedemption, records Instructor Earnings,
   * records Ledger, and clears Cart.
   */
  static async finalizeSuccessfulPayment({
    orderId,
    provider = 'CASHFREE',
    providerOrderId = null,
    providerPaymentId = null,
    amount = null,
    currency = 'INR',
    paymentMethod = 'CASHFREE',
    rawProviderReference = null,
    webhookEventId = null,
  }) {
    if (!orderId) {
      throw new Error('Valid order ID required to finalize payment.');
    }

    // 1. Fetch Order by custom orderId (e.g. LMS-...) or MongoDB _id
    const orderQuery = mongoose.isValidObjectId(orderId)
      ? { $or: [{ _id: orderId }, { orderId }] }
      : { orderId };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      throw new Error(`Order ${orderId} not found in LMS system.`);
    }

    // 2. Idempotency Guard: If order is already completed/paid, return existing state
    if (order.paymentStatus === PAYMENT_STATUS.SUCCESS && (order.orderStatus === ORDER_STATUS.PAID || order.orderStatus === ORDER_STATUS.COMPLETED)) {
      console.log(`[Payment Finalization] Order ${order.orderId} already finalized. Replaying success safely.`);
      return {
        alreadyFinalized: true,
        order,
      };
    }

    // 3. Amount & Currency Reconciliation Guard
    if (amount !== null && amount !== undefined) {
      const verifiedAmount = Number(amount);
      const expectedAmount = Number(order.finalAmount);

      if (Math.abs(verifiedAmount - expectedAmount) > 0.5) {
        console.error(`[Payment Reconciliation Mismatch] Order ${order.orderId}: expected ₹${expectedAmount}, received ₹${verifiedAmount}`);
        order.paymentStatus = PAYMENT_STATUS.FAILED;
        order.orderStatus = ORDER_STATUS.PAYMENT_FAILED;
        await order.save();
        throw new Error(`Payment amount mismatch: Expected ₹${expectedAmount}, received ₹${verifiedAmount}`);
      }
    }

    // 4. Update or Create Authoritative Payment Record
    let payment = await Payment.findOne({ orderId: order._id });
    if (!payment) {
      payment = new Payment({
        orderId: order._id,
        userId: order.userId,
        amount: order.finalAmount,
        currency: order.currency || 'INR',
      });
    }

    payment.provider = provider;
    payment.providerOrderId = providerOrderId || order.providerOrderId || order.orderId;
    payment.providerPaymentId = providerPaymentId || payment.providerPaymentId;
    payment.status = PAYMENT_STATUS.SUCCESS;
    payment.paymentMethod = paymentMethod;
    payment.rawProviderReference = rawProviderReference;
    payment.webhookEventId = webhookEventId || payment.webhookEventId;
    payment.paidAt = new Date();
    await payment.save();

    // 5. Update Order Status
    order.paymentStatus = PAYMENT_STATUS.SUCCESS;
    order.orderStatus = ORDER_STATUS.PAID;
    order.paymentId = payment._id.toString();
    if (providerOrderId) order.providerOrderId = providerOrderId;
    await order.save();

    // 6. Record Coupon Redemption & Increment usedCount atomically
    if (order.couponCode && order.couponId) {
      const existingRedemption = await CouponRedemption.findOne({
        orderId: order._id,
        couponId: order.couponId,
        status: 'SUCCESS',
      });

      if (!existingRedemption) {
        // Atomic conditional increment on coupon
        await Coupon.findOneAndUpdate(
          {
            _id: order.couponId,
            status: 'ACTIVE',
            $expr: { $lt: ['$usedCount', '$usageLimit'] },
          },
          { $inc: { usedCount: 1 } },
          { new: true }
        );

        await CouponRedemption.create({
          couponId: order.couponId,
          userId: order.userId,
          courseId: order.items?.[0]?.courseId || null,
          orderId: order._id,
          code: order.couponCode,
          discountAmount: order.couponDiscount || 0,
          currency: order.currency || 'INR',
          status: 'SUCCESS',
          redeemedAt: new Date(),
        });
      }
    }

    // 7. Grant Entitlements for all purchased courses / offerings
    const orderItems = await OrderItem.find({ orderId: order._id });
    const itemsToProvision = orderItems.length > 0 ? orderItems : order.items;

    for (const item of itemsToProvision) {
      const productType = item.productType || PRODUCT_TYPES.COURSE;
      const targetCourseId = item.courseId || item.productId;

      if (productType === PRODUCT_TYPES.COURSE) {
        // Check for accumulated Topic Credit upgrade deduction
        const topicCredit = await TopicCredit.findOne({
          userId: order.userId,
          courseId: targetCourseId,
          status: 'ACTIVE',
          remainingAmount: { $gt: 0 },
        });

        let creditUsed = item.creditDeduction || 0;
        if (topicCredit) {
          if (creditUsed === 0) {
            creditUsed = Math.min(item.unitPrice || 0, topicCredit.remainingAmount);
          }
          topicCredit.usedAmount = (topicCredit.usedAmount || 0) + creditUsed;
          topicCredit.remainingAmount = Math.max(0, topicCredit.remainingAmount - creditUsed);
          if (topicCredit.remainingAmount <= 0) {
            topicCredit.status = 'CONSUMED';
          }
          await topicCredit.save();

          // Create CourseUpgrade record
          await CourseUpgrade.create({
            upgradeId: `UPG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            userId: order.userId,
            courseId: targetCourseId,
            coursePrice: item.unitPrice || item.finalPrice || 0,
            eligibleCredit: creditUsed,
            upgradePrice: item.finalPrice || 0,
            currency: item.currency || order.currency || 'INR',
            orderId: order._id,
            status: 'COMPLETED',
            completedAt: new Date(),
          });
        }

        const existingEntitlement = await Entitlement.findOne({
          userId: order.userId,
          productType: PRODUCT_TYPES.COURSE,
          productId: targetCourseId,
          status: ENTITLEMENT_STATUS.ACTIVE,
        });

        if (!existingEntitlement) {
          await Entitlement.create({
            userId: order.userId,
            productType: PRODUCT_TYPES.COURSE,
            productId: targetCourseId,
            courseId: targetCourseId,
            orderId: order._id,
            source: topicCredit && creditUsed > 0 ? 'UPGRADE' : 'PURCHASE',
            status: ENTITLEMENT_STATUS.ACTIVE,
            grantedAt: new Date(),
          });
        }
      } else if (productType === PRODUCT_TYPES.CONTENT_OFFERING || productType === 'TOPIC') {
        const existingEntitlement = await Entitlement.findOne({
          userId: order.userId,
          productType: PRODUCT_TYPES.CONTENT_OFFERING,
          productId: item.productId,
          status: ENTITLEMENT_STATUS.ACTIVE,
        });

        if (!existingEntitlement) {
          await Entitlement.create({
            userId: order.userId,
            productType: PRODUCT_TYPES.CONTENT_OFFERING,
            productId: item.productId,
            contentOfferingId: item.productId,
            courseId: item.courseId,
            topicId: item.topicId,
            orderId: order._id,
            source: 'PURCHASE',
            status: ENTITLEMENT_STATUS.ACTIVE,
            grantedAt: new Date(),
          });
        }

        // Accrue TopicCredit toward future course upgrade
        if (item.courseId) {
          const topicPrice = Number(item.finalPrice ?? item.unitPrice ?? 0);
          if (topicPrice > 0) {
            let creditDoc = await TopicCredit.findOne({
              userId: order.userId,
              courseId: item.courseId,
              status: 'ACTIVE',
            });

            const topicRefId = item.productId || item.topicId;
            if (!creditDoc) {
              await TopicCredit.create({
                creditId: `CRD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
                userId: order.userId,
                courseId: item.courseId,
                sourceTopicPurchases: topicRefId ? [topicRefId] : [],
                eligibleAmount: topicPrice,
                usedAmount: 0,
                remainingAmount: topicPrice,
                status: 'ACTIVE',
              });
            } else {
              creditDoc.eligibleAmount += topicPrice;
              creditDoc.remainingAmount += topicPrice;
              if (topicRefId && !creditDoc.sourceTopicPurchases.some((id) => id?.toString() === topicRefId.toString())) {
                creditDoc.sourceTopicPurchases.push(topicRefId);
              }
              await creditDoc.save();
            }
          }
        }
      } else if (productType === PRODUCT_TYPES.LEARNING_PATH) {
        const existingEntitlement = await Entitlement.findOne({
          userId: order.userId,
          productType: PRODUCT_TYPES.LEARNING_PATH,
          productId: item.productId,
          status: ENTITLEMENT_STATUS.ACTIVE,
        });

        if (!existingEntitlement) {
          await Entitlement.create({
            userId: order.userId,
            productType: PRODUCT_TYPES.LEARNING_PATH,
            productId: item.productId,
            learningPathId: item.productId,
            orderId: order._id,
            source: 'PURCHASE',
            status: ENTITLEMENT_STATUS.ACTIVE,
            grantedAt: new Date(),
          });
        }
      }
    }

    // 8. Calculate and record Instructor Earnings on actual discounted prices
    for (const item of itemsToProvision) {
      if (item.instructorId) {
        const itemFinal = item.finalPrice !== undefined ? item.finalPrice : item.price || 0;
        const platformCommission = Math.round(itemFinal * 0.2); // 20% platform fee
        const netEarning = Math.max(0, itemFinal - platformCommission);

        const existingEarning = await InstructorEarning.findOne({
          orderId: order._id,
          orderItemId: item._id || item.productId,
        });

        if (!existingEarning) {
          await InstructorEarning.create({
            instructorId: item.instructorId,
            orderId: order._id,
            orderItemId: item._id || new mongoose.Types.ObjectId(),
            grossAmount: itemFinal,
            discountAmount: item.discount || 0,
            platformCommission,
            netEarning,
            currency: item.currency || order.currency || 'INR',
            status: 'AVAILABLE',
          });
        }
      }
    }

    // 9. Record Financial Ledger Entry
    const existingLedger = await FinancialLedger.findOne({
      orderId: order._id,
      type: TRANSACTION_TYPES.ORDER_PAYMENT,
    });

    if (!existingLedger) {
      await FinancialLedger.create({
        ledgerId: `LED-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: order.userId,
        orderId: order._id,
        type: TRANSACTION_TYPES.ORDER_PAYMENT,
        amount: order.finalAmount,
        direction: 'CREDIT',
        currency: order.currency || 'INR',
        description: `Order Payment for ${order.orderId}`,
      });
    }

    // 10. Clear Student Cart after verified completion
    await Cart.findOneAndUpdate({ userId: order.userId }, { $set: { items: [] } });

    console.log(`[Payment Finalization] Order ${order.orderId} successfully finalized. Entitlements granted.`);

    return {
      success: true,
      order,
      payment,
    };
  }

  /**
   * 2. VERIFY & RECONCILE PAYMENT STATUS FROM CASHFREE
   * Invoked by return URL status query (/checkout/result) or periodic polling.
   */
  static async verifyAndReconcileOrderPayment(orderId, studentUserId = null) {
    if (!orderId) {
      throw new Error('Order ID is required to verify payment status.');
    }

    const orderQuery = mongoose.isValidObjectId(orderId)
      ? { $or: [{ _id: orderId }, { orderId }] }
      : { orderId };

    const order = await Order.findOne(orderQuery);
    if (!order) {
      const error = new Error('Order not found.');
      error.status = 404;
      throw error;
    }

    // Access control: ensure requesting student owns this order
    if (studentUserId && order.userId.toString() !== studentUserId.toString()) {
      const error = new Error('Unauthorized to view payment status for this order.');
      error.status = 403;
      throw error;
    }

    // If already finalized, return immediately
    if (order.paymentStatus === PAYMENT_STATUS.SUCCESS) {
      return {
        orderId: order.orderId,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        orderStatus: order.orderStatus,
        amount: order.finalAmount,
        currency: order.currency,
        paidAt: order.updatedAt,
      };
    }

    // Query Cashfree Server API for current transaction state
    const providerOrderId = order.providerOrderId || order.orderId;
    const cfStatusResult = await CashfreeService.getOrderPaymentStatus(providerOrderId);

    if (cfStatusResult.status === PAYMENT_STATUS.SUCCESS) {
      // Reconcile and finalize in LMS
      await this.finalizeSuccessfulPayment({
        orderId: order.orderId,
        provider: 'CASHFREE',
        providerOrderId,
        providerPaymentId: cfStatusResult.paymentId,
        amount: cfStatusResult.amount,
        currency: cfStatusResult.currency,
        paymentMethod: cfStatusResult.paymentMethod,
        rawProviderReference: cfStatusResult.latestPayment,
      });

      return {
        orderId: order.orderId,
        paymentStatus: PAYMENT_STATUS.SUCCESS,
        orderStatus: ORDER_STATUS.PAID,
        amount: order.finalAmount,
        currency: order.currency,
      };
    } else if (cfStatusResult.status === PAYMENT_STATUS.FAILED || cfStatusResult.status === PAYMENT_STATUS.CANCELLED) {
      order.paymentStatus = cfStatusResult.status;
      order.orderStatus = ORDER_STATUS.PAYMENT_FAILED;
      await order.save();

      await Payment.findOneAndUpdate(
        { orderId: order._id },
        {
          status: cfStatusResult.status,
          failureReason: cfStatusResult.failureReason || 'Payment failed on provider gateway',
        }
      );

      return {
        orderId: order.orderId,
        paymentStatus: cfStatusResult.status,
        orderStatus: ORDER_STATUS.PAYMENT_FAILED,
        failureReason: cfStatusResult.failureReason,
      };
    }

    return {
      orderId: order.orderId,
      paymentStatus: PAYMENT_STATUS.PENDING,
      orderStatus: ORDER_STATUS.PAYMENT_PENDING,
    };
  }

  /**
   * 3. HANDLE CASHFREE WEBHOOK EVENT
   */
  static async handleCashfreeWebhook({ rawBody, headers, body }) {
    const timestamp = headers['x-webhook-timestamp'];
    const signature = headers['x-webhook-signature'];

    // 1. Signature Verification
    const isValid = CashfreeService.verifyWebhook({ rawBody, timestamp, signature });
    if (!isValid) {
      console.error('[Cashfree Webhook] Invalid signature received.');
      const err = new Error('Invalid Cashfree webhook signature.');
      err.status = 400;
      throw err;
    }

    // 2. Extract Event Data
    const eventType = body?.type || body?.event || '';
    const data = body?.data || {};
    const orderData = data.order || {};
    const paymentData = data.payment || {};

    const orderId = orderData.order_id || body?.order_id;
    const paymentStatus = paymentData.payment_status || orderData.order_status || '';
    const cfPaymentId = paymentData.cf_payment_id?.toString() || null;
    const paymentAmount = paymentData.payment_amount || orderData.order_amount;
    const currency = paymentData.payment_currency || orderData.order_currency || 'INR';

    console.log(`[Cashfree Webhook] Verified event ${eventType} for order ${orderId}, status: ${paymentStatus}`);

    if (!orderId) {
      return { received: true, ignored: true, reason: 'No order_id in webhook payload' };
    }

    const normalizedStatus = CashfreeService.normalizePaymentStatus(paymentStatus);

    if (normalizedStatus === PAYMENT_STATUS.SUCCESS) {
      await this.finalizeSuccessfulPayment({
        orderId,
        provider: 'CASHFREE',
        providerOrderId: orderId,
        providerPaymentId: cfPaymentId,
        amount: paymentAmount,
        currency,
        paymentMethod: paymentData.payment_group || 'CASHFREE_WEBHOOK',
        rawProviderReference: body,
        webhookEventId: headers['x-request-id'] || `${orderId}_${cfPaymentId}_${timestamp}`,
      });
    } else if (normalizedStatus === PAYMENT_STATUS.FAILED || normalizedStatus === PAYMENT_STATUS.CANCELLED) {
      const order = await Order.findOne({ orderId });
      if (order && order.paymentStatus !== PAYMENT_STATUS.SUCCESS) {
        order.paymentStatus = normalizedStatus;
        order.orderStatus = ORDER_STATUS.PAYMENT_FAILED;
        await order.save();

        await Payment.findOneAndUpdate(
          { orderId: order._id },
          { status: normalizedStatus, failureReason: paymentData.payment_message || 'Payment failed via webhook notification' }
        );
      }
    }

    return { received: true, success: true };
  }
}
