import mongoose from 'mongoose';
import { CashfreeService } from '../../services/cashfree.service.js';
import { config } from '../../config/env.js';
import {
  PlatformFee,
  Course,
  User,
  Notification,
  FinancialLedger,
} from '../../models/index.js';
import { ROLES, TRANSACTION_TYPES } from '../../config/constants.js';

export class PaymentsService {
  /**
   * 1. Create Cashfree Publishing Fee Order (10% Platform Fee)
   * Strictly calculates 10% fee server-side and stores PENDING record
   */
  static async createPublishingFeeOrder(userId, courseId, returnUrl) {
    const course = await Course.findOne({
      _id: courseId,
      instructorId: new mongoose.Types.ObjectId(userId),
    });

    if (!course) {
      throw new Error('Course not found or you are not authorized to manage this course.');
    }

    const price = Number(course.coursePrice || 0);
    const calculatedFee = price > 0 ? Number((price * 0.10).toFixed(2)) : 0;

    course.publishingFeeAmount = calculatedFee;
    course.platformFee = calculatedFee;
    course.instructorEarnings = Number((price - calculatedFee).toFixed(2));

    // For free courses (₹0), waive publishing fee immediately
    if (calculatedFee === 0) {
      course.publishingFeePaid = true;
      course.publishingFeePaidAt = course.publishingFeePaidAt || new Date();
      await course.save();

      return {
        alreadyPaid: true,
        amount: 0,
        currency: 'INR',
        coursePrice: 0,
        courseId: course._id.toString(),
        courseTitle: course.title,
        message: 'Publishing fee is waived for free courses (₹0).',
        paymentStatus: 'SUCCESS',
      };
    }

    // Check if course already has a verified SUCCESS payment
    if (course.publishingFeePaid) {
      return {
        alreadyPaid: true,
        amount: calculatedFee,
        currency: 'INR',
        coursePrice: price,
        courseId: course._id.toString(),
        courseTitle: course.title,
        message: 'Platform fee has already been paid and verified for this course.',
        paymentStatus: 'SUCCESS',
        orderId: course.cashfreeOrderId,
        paymentId: course.cashfreePaymentId,
      };
    }

    const instructor = await User.findById(userId).lean();
    const orderId = `PUBFEE_${course._id.toString().slice(-6)}_${Date.now()}`;
    const amount = calculatedFee;

    // Create internal database record with initial status PENDING
    const platformFeeRecord = await PlatformFee.create({
      order_id: orderId,
      course_id: course._id,
      instructor_id: new mongoose.Types.ObjectId(userId),
      amount,
      coursePrice: price,
      currency: 'INR',
      payment_status: 'PENDING',
    });

    // Create Cashfree PG Order using Cashfree Server API
    const cfOrder = await CashfreeService.createOrder({
      orderId,
      orderAmount: amount,
      currency: 'INR',
      customerId: `INST_${userId.toString().slice(-6)}`,
      customerName: `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim() || 'Instructor',
      customerEmail: instructor?.email || 'instructor@example.com',
      customerPhone: instructor?.phone || '9999999999',
      returnUrl: returnUrl || `http://localhost:5173/dashboard/instructor`,
      orderNote: `10% Platform Publishing Fee for "${course.title}"`,
    });

    // Update database records with Cashfree payment session information
    platformFeeRecord.cashfreePaymentSessionId = cfOrder.paymentSessionId;
    platformFeeRecord.cashfreeOrderId = cfOrder.cfOrderId || cfOrder.orderId;
    await platformFeeRecord.save();

    course.cashfreeOrderId = orderId;
    course.cashfreePaymentSessionId = cfOrder.paymentSessionId;
    await course.save();

    return {
      success: true,
      orderId: cfOrder.orderId,
      paymentSessionId: cfOrder.paymentSessionId,
      amount,
      coursePrice: price,
      currency: 'INR',
      courseId: course._id.toString(),
      courseTitle: course.title,
      environment: config.cashfree.env.toLowerCase(),
      paymentStatus: 'PENDING',
    };
  }

  /**
   * 2. Verify Cashfree Publishing Fee Payment
   * Queries Cashfree API directly and only transitions status to SUCCESS if genuine
   */
  static async verifyPublishingFeePayment(userId, courseId, orderId) {
    let course;
    let targetOrderId = orderId;

    if (courseId) {
      course = await Course.findOne({
        _id: courseId,
        instructorId: new mongoose.Types.ObjectId(userId),
      });
      if (!course) {
        throw new Error('Course not found or unauthorized.');
      }
      targetOrderId = orderId || course.cashfreeOrderId;
    } else if (targetOrderId) {
      const pf = await PlatformFee.findOne({ order_id: targetOrderId });
      if (pf) {
        course = await Course.findOne({
          _id: pf.course_id,
          instructorId: new mongoose.Types.ObjectId(userId),
        });
      }
      if (!course) {
        course = await Course.findOne({
          cashfreeOrderId: targetOrderId,
          instructorId: new mongoose.Types.ObjectId(userId),
        });
      }
      if (!course) {
        throw new Error('Associated course not found or unauthorized for this order.');
      }
    } else {
      throw new Error('Either courseId or orderId is required.');
    }

    if (!targetOrderId) {
      throw new Error('No order ID provided or found for this course.');
    }

    let platformFee = await PlatformFee.findOne({ order_id: targetOrderId });
    if (!platformFee) {
      platformFee = await PlatformFee.findOne({ course_id: course._id }).sort({ created_at: -1 });
    }

    // If already verified SUCCESS, return verified result
    if (platformFee && platformFee.payment_status === 'SUCCESS') {
      course.publishingFeePaid = true;
      course.publishingFeePaidAt = platformFee.paidAt || new Date();
      course.cashfreeOrderId = platformFee.order_id;
      course.cashfreePaymentId = platformFee.cashfreePaymentId;
      await course.save();

      return {
        paymentStatus: 'SUCCESS',
        orderId: platformFee.order_id,
        paymentId: platformFee.cashfreePaymentId,
        amount: platformFee.amount,
        courseId: course._id.toString(),
        message: 'Payment has already been verified as SUCCESS.',
        course,
      };
    }

    let cashfreeStatus = 'PENDING';
    let paymentId = null;
    let paymentMethod = null;
    let failureReason = null;

    try {
      const orderData = await CashfreeService.getOrder(targetOrderId);
      const rawStatus = orderData.order_status;

      if (rawStatus === 'PAID') {
        cashfreeStatus = 'SUCCESS';
      } else if (rawStatus === 'EXPIRED') {
        cashfreeStatus = 'EXPIRED';
      } else if (rawStatus === 'TERMINATED') {
        cashfreeStatus = 'FAILED';
      }

      // Check payment attempts for precise details
      const payments = await CashfreeService.getOrderPayments(targetOrderId).catch(() => []);
      if (Array.isArray(payments) && payments.length > 0) {
        const successfulPayment = payments.find((p) => p.payment_status === 'SUCCESS');
        if (successfulPayment) {
          cashfreeStatus = 'SUCCESS';
          paymentId = successfulPayment.cf_payment_id || String(successfulPayment.payment_id || '');
          paymentMethod = successfulPayment.payment_group || successfulPayment.payment_method;
        } else {
          const userDropped = payments.find((p) => p.payment_status === 'USER_DROPPED');
          const failed = payments.find((p) => p.payment_status === 'FAILED');
          if (userDropped) {
            cashfreeStatus = 'USER_DROPPED';
          } else if (failed) {
            cashfreeStatus = 'FAILED';
            failureReason = failed.error_details?.error_description || 'Payment transaction failed.';
          }
        }
      }
    } catch (err) {
      console.warn('[Cashfree Verification Query Warning]:', err.message);
    }

    // Update PlatformFee record based on verified status
    if (platformFee) {
      platformFee.payment_status = cashfreeStatus;
      if (paymentId) platformFee.cashfreePaymentId = paymentId;
      if (paymentMethod) platformFee.paymentMethod = paymentMethod;
      if (failureReason) platformFee.errorMessage = failureReason;

      if (cashfreeStatus === 'SUCCESS') {
        platformFee.paidAt = platformFee.paidAt || new Date();
      }
      await platformFee.save();
    }

    if (cashfreeStatus === 'SUCCESS') {
      course.publishingFeePaid = true;
      course.publishingFeePaidAt = new Date();
      course.cashfreeOrderId = targetOrderId;
      course.cashfreePaymentId = paymentId || targetOrderId;
      await course.save();

      // Trigger asynchronous notifications and financial ledger registration
      await this._onPaymentSuccess({
        orderId: targetOrderId,
        paymentId: paymentId || targetOrderId,
        amount: platformFee?.amount || course.publishingFeeAmount || 0,
        course,
        instructorId: userId,
      });

      return {
        paymentStatus: 'SUCCESS',
        orderId: targetOrderId,
        paymentId: paymentId || targetOrderId,
        amount: platformFee?.amount || course.publishingFeeAmount,
        courseId: course._id.toString(),
        message: 'Payment verified successfully. Course submission is unlocked.',
        course,
      };
    }

    return {
      paymentStatus: cashfreeStatus,
      orderId: targetOrderId,
      amount: platformFee?.amount || course.publishingFeeAmount,
      courseId: course._id.toString(),
      message:
        cashfreeStatus === 'FAILED'
          ? 'Payment failed. No platform fee was charged successfully. Please try again.'
          : cashfreeStatus === 'USER_DROPPED'
          ? 'Payment was not completed. You exited the checkout process.'
          : cashfreeStatus === 'EXPIRED'
          ? 'Payment session has expired. Please try again.'
          : 'Payment is being verified. Please wait.',
    };
  }

  /**
   * 3. Handle Cashfree Webhooks (Cryptographically Verified & Idempotent)
   */
  static async handleCashfreeWebhook({ signature, rawBody, timestamp, body }) {
    // 1. Verify Webhook Signature
    const isValid = CashfreeService.verifyWebhookSignature(signature, rawBody, timestamp);
    if (!isValid) {
      const error = new Error('Invalid Cashfree Webhook Signature');
      error.statusCode = 400;
      throw error;
    }

    const eventType = body?.type || body?.event || '';
    const data = body?.data || body;
    const orderId = data?.order?.order_id || data?.order_id || data?.orderId;
    const payment = data?.payment;
    const paymentStatus = payment?.payment_status || (eventType.includes('SUCCESS') ? 'SUCCESS' : 'PENDING');
    const paymentId = payment?.cf_payment_id || payment?.payment_id;

    if (!orderId) {
      return { received: true, ignored: true, reason: 'Missing order_id in webhook payload' };
    }

    const platformFee = await PlatformFee.findOne({ order_id: orderId });
    if (!platformFee) {
      console.warn(`[Webhook]: No internal PlatformFee found for order ${orderId}`);
      return { received: true, ignored: true, reason: 'Order not found' };
    }

    // Idempotency: If already SUCCESS, acknowledge 200 without duplicate actions
    if (platformFee.payment_status === 'SUCCESS') {
      return { received: true, idempotent: true, status: 'SUCCESS' };
    }

    if (paymentStatus === 'SUCCESS' || eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
      platformFee.payment_status = 'SUCCESS';
      platformFee.cashfreePaymentId = paymentId ? String(paymentId) : platformFee.cashfreePaymentId;
      platformFee.paidAt = new Date();
      platformFee.paymentMethod = payment?.payment_group || payment?.payment_method;
      await platformFee.save();

      const course = await Course.findById(platformFee.course_id);
      if (course) {
        course.publishingFeePaid = true;
        course.publishingFeePaidAt = new Date();
        course.cashfreeOrderId = orderId;
        course.cashfreePaymentId = paymentId ? String(paymentId) : orderId;
        await course.save();

        await this._onPaymentSuccess({
          orderId,
          paymentId: paymentId ? String(paymentId) : orderId,
          amount: platformFee.amount,
          course,
          instructorId: platformFee.instructor_id,
        });
      }

      return { received: true, status: 'SUCCESS' };
    } else if (paymentStatus === 'FAILED' || eventType === 'PAYMENT_FAILED_WEBHOOK') {
      platformFee.payment_status = 'FAILED';
      platformFee.errorMessage = payment?.payment_message || 'Payment failed';
      await platformFee.save();
      return { received: true, status: 'FAILED' };
    } else if (paymentStatus === 'USER_DROPPED' || eventType === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      platformFee.payment_status = 'USER_DROPPED';
      await platformFee.save();
      return { received: true, status: 'USER_DROPPED' };
    }

    return { received: true, status: platformFee.payment_status };
  }

  /**
   * 4. Helper for successful payment side effects (Notifications & Financial Ledger)
   */
  static async _onPaymentSuccess({ orderId, paymentId, amount, course, instructorId }) {
    try {
      // 1. Notify all Super Admins
      const superAdmins = await User.find({ role: ROLES.SUPER_ADMIN }).select('_id').lean();
      const instructor = await User.findById(instructorId).select('firstName lastName email').lean();
      const instructorName = `${instructor?.firstName || ''} ${instructor?.lastName || ''}`.trim() || 'Instructor';

      const notificationDocs = superAdmins.map((admin) => ({
        userId: admin._id,
        title: `Platform Fee Paid: ₹${amount.toLocaleString('en-IN')}`,
        message: `Instructor ${instructorName} paid the 10% platform fee (₹${amount}) for course "${course.title}". Order ID: ${orderId}`,
        type: 'PAYMENT',
        priority: 'HIGH',
        metadata: {
          orderId,
          paymentId,
          amount,
          courseId: course._id.toString(),
          courseTitle: course.title,
          instructorEmail: instructor?.email,
        },
      }));

      if (notificationDocs.length > 0) {
        await Notification.insertMany(notificationDocs).catch((e) =>
          console.warn('[Notification Error]:', e.message)
        );
      }

      // 2. Record in Financial Ledger (Idempotent check by referenceId)
      const existingLedger = await FinancialLedger.findOne({ referenceId: orderId });
      if (!existingLedger) {
        await FinancialLedger.create({
          ledgerId: `LEDG_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: instructorId,
          type: TRANSACTION_TYPES.PLATFORM_FEE,
          referenceId: orderId,
          amount,
          currency: 'INR',
          direction: 'CREDIT',
          description: `Platform fee (10%) collected via Cashfree for course: ${course.title} (Order: ${orderId})`,
        }).catch((e) => console.warn('[FinancialLedger Warning]:', e.message));
      }
    } catch (err) {
      console.error('[Payment Success Handler Error]:', err);
    }
  }

  /**
   * 5. Super Admin Platform Fees Overview & Ledger
   * Shows all collected platform fees with metrics, search, and pagination
   */
  static async getPlatformFeesOverview({ search, status, page = 1, limit = 50 }) {
    const query = {};

    if (status && status !== 'ALL') {
      query.payment_status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [allFeesForMetrics, rawFees, totalCount] = await Promise.all([
      PlatformFee.find({}, 'amount payment_status').lean(),
      PlatformFee.find(query).sort({ created_at: -1 }).skip(skip).limit(limitNum).lean(),
      PlatformFee.countDocuments(query),
    ]);

    const courseIds = [...new Set(rawFees.map((f) => f.course_id).filter(Boolean))];
    const instructorIds = [...new Set(rawFees.map((f) => f.instructor_id).filter(Boolean))];

    const [courses, users] = await Promise.all([
      Course.find({ _id: { $in: courseIds } }, 'title category coursePrice thumbnail status').lean(),
      User.find({ _id: { $in: instructorIds } }, 'firstName lastName email profilePhoto avatar role').lean(),
    ]);

    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    let fees = rawFees.map((f) => {
      const course = f.course_id ? courseMap.get(f.course_id.toString()) : null;
      const instructor = f.instructor_id ? userMap.get(f.instructor_id.toString()) : null;
      return {
        id: f._id.toString(),
        orderId: f.order_id,
        courseId: f.course_id?.toString() || '',
        courseTitle: course?.title || 'Course',
        coursePrice: f.coursePrice || course?.coursePrice || 0,
        amount: f.amount,
        currency: f.currency || 'INR',
        paymentStatus: f.payment_status,
        cashfreePaymentId: f.cashfreePaymentId || '—',
        paymentMethod: f.paymentMethod || 'Cashfree PG',
        instructor: {
          id: f.instructor_id?.toString() || '',
          name: instructor ? `${instructor.firstName || ''} ${instructor.lastName || ''}`.trim() : 'Instructor',
          email: instructor?.email || '—',
          avatar: instructor?.profilePhoto || instructor?.avatar,
        },
        createdAt: f.created_at,
        paidAt: f.paidAt,
        errorMessage: f.errorMessage,
      };
    });

    // Apply search filter in memory if needed
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      fees = fees.filter((f) => {
        const orderMatch = f.orderId?.toLowerCase().includes(q);
        const cfPayMatch = f.cashfreePaymentId?.toLowerCase().includes(q);
        const courseMatch = f.courseTitle?.toLowerCase().includes(q);
        const instMatch =
          f.instructor?.email?.toLowerCase().includes(q) ||
          f.instructor?.name?.toLowerCase().includes(q);
        return orderMatch || cfPayMatch || courseMatch || instMatch;
      });
    }

    const successFees = allFeesForMetrics.filter((f) => f.payment_status === 'SUCCESS');
    const pendingFees = allFeesForMetrics.filter((f) => f.payment_status === 'PENDING');
    const failedFees = allFeesForMetrics.filter((f) => ['FAILED', 'USER_DROPPED', 'EXPIRED'].includes(f.payment_status));

    const totalCollected = successFees.reduce((sum, f) => sum + (f.amount || 0), 0);

    const metrics = {
      totalCollected: Number(totalCollected.toFixed(2)) || 0,
      successfulTransactions: successFees.length,
      pendingTransactions: pendingFees.length,
      failedTransactions: failedFees.length,
      totalTransactions: allFeesForMetrics.length,
    };

    return {
      fees,
      metrics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
    };
  }
}

