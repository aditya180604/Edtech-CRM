import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Course,
  Coupon,
  CouponRedemption,
  Cart,
  Order,
  OrderItem,
  Payment,
  Entitlement,
  InstructorEarning,
  FinancialLedger,
} from '../src/models/index.js';
import { cashfreeConfig } from '../src/config/cashfree.js';
import { CashfreeService } from '../src/modules/payments/providers/cashfree/cashfree.service.js';
import { PaymentService } from '../src/modules/payments/payment.service.js';
import { CheckoutService } from '../src/modules/checkout/checkout.service.js';
import { ROLES, USER_STATUS, PAYMENT_STATUS, ORDER_STATUS, ENTITLEMENT_STATUS } from '../src/config/constants.js';

describe('Cashfree Payment Gateway Integration & Lifecycle Test Suite', () => {
  let superAdminUser;
  let instructorUser;
  let studentUser;
  let testCourse;
  let testCoupon;

  before(async () => {
    await connectDB();

    // Clean up test collections
    await User.deleteMany({ email: /test_cf_suite_/ });
    await Course.deleteMany({ slug: /test-cf-course-/ });
    await Coupon.deleteMany({ code: 'CFTEST99' });
    await CouponRedemption.deleteMany({ code: 'CFTEST99' });

    // 1. Create Super Admin
    superAdminUser = await User.create({
      firstName: 'CF Super',
      lastName: 'Admin',
      email: 'test_cf_suite_sa@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Instructor
    instructorUser = await User.create({
      firstName: 'CF Instructor',
      lastName: 'Pro',
      email: 'test_cf_suite_inst@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.INSTRUCTOR,
      status: USER_STATUS.ACTIVE,
    });

    // 3. Create Student
    studentUser = await User.create({
      firstName: 'CF Student',
      lastName: 'Learner',
      email: 'test_cf_suite_student@example.com',
      phone: '9876543210',
      passwordHash: 'dummyhash',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 4. Create Published Course (₹2,000)
    testCourse = await Course.create({
      title: 'Full-Stack Cashfree Mastery',
      slug: 'test-cf-course-mastery',
      instructorId: instructorUser._id,
      price: 2000,
      currency: 'INR',
      status: 'PUBLISHED',
      duration: '10 Hours',
      level: 'ADVANCED',
    });

    // 5. Create Course-Scoped Coupon (₹500 OFF, code: CFTEST99)
    testCoupon = await Coupon.create({
      code: 'CFTEST99',
      description: '₹500 off Cashfree Mastery',
      discountType: 'FIXED',
      discountValue: 500,
      courseId: testCourse._id,
      instructorId: testCourse.instructorId,
      status: 'ACTIVE',
      startDate: new Date(Date.now() - 3600000),
      expiryDate: new Date(Date.now() + 86400000 * 30),
      usageLimit: 10,
      usedCount: 0,
      createdBy: superAdminUser._id,
    });
  });

  after(async () => {
    // Teardown
    await User.deleteMany({ email: /test_cf_suite_/ });
    await Course.deleteMany({ slug: /test-cf-course-/ });
    await Coupon.deleteMany({ code: 'CFTEST99' });
    await CouponRedemption.deleteMany({ code: 'CFTEST99' });
    await disconnectDB();
  });

  // TEST 1: Cashfree Configuration & Environment Setup
  it('1. Should correctly load Cashfree Sandbox configuration from environment', () => {
    assert.ok(cashfreeConfig.appId, 'Cashfree App ID must be defined');
    assert.ok(cashfreeConfig.secretKey, 'Cashfree Secret Key must be defined');
    assert.strictEqual(cashfreeConfig.env, 'SANDBOX');
    assert.ok(cashfreeConfig.frontendUrl, 'FRONTEND_URL must be defined');
    assert.ok(cashfreeConfig.backendPublicUrl, 'BACKEND_PUBLIC_URL must be defined');
    assert.strictEqual(cashfreeConfig.apiVersion, '2023-08-01');
  });

  // TEST 2: Cashfree Webhook Signature Verification (HMAC-SHA256)
  it('2. Should verify valid Cashfree webhook signature and reject tampered signature', () => {
    const rawPayload = JSON.stringify({
      data: {
        order: { order_id: 'LMS-TEST-123', order_amount: 1500 },
        payment: { payment_status: 'SUCCESS', cf_payment_id: 998877 },
      },
      type: 'PAYMENT_SUCCESS_WEBHOOK',
    });
    const timestamp = Date.now().toString();

    // Generate valid signature using cashfreeConfig.secretKey
    const signatureData = timestamp + rawPayload;
    const validSignature = crypto
      .createHmac('sha256', cashfreeConfig.secretKey)
      .update(signatureData)
      .digest('base64');

    const isValid = CashfreeService.verifyWebhook({
      rawBody: rawPayload,
      timestamp,
      signature: validSignature,
    });
    assert.strictEqual(isValid, true, 'Valid signature must return true');

    // Tampered signature
    const isTamperedValid = CashfreeService.verifyWebhook({
      rawBody: rawPayload,
      timestamp,
      signature: 'InvalidSignatureBase64==',
    });
    assert.strictEqual(isTamperedValid, false, 'Tampered signature must return false');
  });

  // TEST 3: Full End-to-End Idempotent Payment Finalization Lifecycle
  it('3. Should execute complete idempotent payment finalization, unlocking course, paying instructor, and clearing cart', async () => {
    // 3.1 Setup Cart with Course
    await Cart.findOneAndUpdate(
      { userId: studentUser._id },
      {
        $set: {
          items: [
            {
              productType: 'COURSE',
              productId: testCourse._id,
              courseId: testCourse._id,
              instructorId: instructorUser._id,
              title: testCourse.title,
              unitPrice: 2000,
              discount: 500,
              finalPrice: 1500,
              currency: 'INR',
            },
          ],
        },
      },
      { upsert: true, new: true }
    );

    // 3.2 Create Order
    const orderIdCode = `LMS-TEST-ORDER-${Date.now()}`;
    const order = await Order.create({
      orderId: orderIdCode,
      userId: studentUser._id,
      provider: 'CASHFREE',
      items: [
        {
          productType: 'COURSE',
          productId: testCourse._id,
          courseId: testCourse._id,
          instructorId: instructorUser._id,
          title: testCourse.title,
          unitPrice: 2000,
          discount: 500,
          finalPrice: 1500,
          currency: 'INR',
        },
      ],
      subtotal: 2000,
      discount: 500,
      couponId: testCoupon._id,
      couponCode: testCoupon.code,
      couponDiscount: 500,
      finalAmount: 1500,
      currency: 'INR',
      paymentStatus: PAYMENT_STATUS.INITIATED,
      orderStatus: ORDER_STATUS.PAYMENT_PENDING,
    });

    await OrderItem.create({
      orderId: order._id,
      productType: 'COURSE',
      productId: testCourse._id,
      courseId: testCourse._id,
      instructorId: instructorUser._id,
      unitPrice: 2000,
      discount: 500,
      finalPrice: 1500,
      currency: 'INR',
    });

    // 3.3 Authoritatively finalize payment
    const finalizationResult = await PaymentService.finalizeSuccessfulPayment({
      orderId: order.orderId,
      provider: 'CASHFREE',
      providerOrderId: order.orderId,
      providerPaymentId: 'CF-PAY-98765',
      amount: 1500,
      currency: 'INR',
      paymentMethod: 'UPI',
    });

    assert.strictEqual(finalizationResult.success, true);

    // 3.4 Verify Order State
    const updatedOrder = await Order.findOne({ orderId: order.orderId });
    assert.strictEqual(updatedOrder.paymentStatus, PAYMENT_STATUS.SUCCESS);
    assert.strictEqual(updatedOrder.orderStatus, ORDER_STATUS.PAID);

    // 3.5 Verify Payment Record
    const payment = await Payment.findOne({ orderId: order._id });
    assert.ok(payment, 'Payment record must exist');
    assert.strictEqual(payment.status, PAYMENT_STATUS.SUCCESS);
    assert.strictEqual(payment.amount, 1500);
    assert.strictEqual(payment.providerPaymentId, 'CF-PAY-98765');

    // 3.6 Verify Entitlement (Course Unlocked)
    const entitlement = await Entitlement.findOne({
      userId: studentUser._id,
      productId: testCourse._id,
      status: ENTITLEMENT_STATUS.ACTIVE,
    });
    assert.ok(entitlement, 'Active course entitlement must be granted to student');
    assert.strictEqual(entitlement.source, 'PURCHASE');

    // 3.7 Verify Coupon Redemption & Usage Count
    const redemption = await CouponRedemption.findOne({
      orderId: order._id,
      code: testCoupon.code,
    });
    assert.ok(redemption, 'Coupon redemption record must be created');
    assert.strictEqual(redemption.discountAmount, 500);

    const refreshedCoupon = await Coupon.findById(testCoupon._id);
    assert.strictEqual(refreshedCoupon.usedCount, 1, 'Coupon usedCount must increment by 1');

    // 3.8 Verify Instructor Earnings (80% net = ₹1,200, 20% platform commission = ₹300)
    const instructorEarning = await InstructorEarning.findOne({ orderId: order._id });
    assert.ok(instructorEarning, 'Instructor earning must be created');
    assert.strictEqual(instructorEarning.grossAmount, 1500);
    assert.strictEqual(instructorEarning.platformCommission, 300);
    assert.strictEqual(instructorEarning.netEarning, 1200);

    // 3.9 Verify Financial Ledger Entry
    const ledgerEntry = await FinancialLedger.findOne({ orderId: order._id });
    assert.ok(ledgerEntry, 'Financial ledger entry must be posted');
    assert.strictEqual(ledgerEntry.amount, 1500);

    // 3.10 Verify Student Cart is Cleared
    const studentCart = await Cart.findOne({ userId: studentUser._id });
    assert.strictEqual(studentCart.items.length, 0, 'Cart must be emptied after successful payment');
  });

  // TEST 4: Idempotency & Duplicate Webhook Replay Protection
  it('4. Should handle duplicate finalization calls and webhook replays without double-granting entitlements or double-counting coupons', async () => {
    const existingOrder = await Order.findOne({ userId: studentUser._id, paymentStatus: PAYMENT_STATUS.SUCCESS });
    assert.ok(existingOrder);

    const initialCouponCount = (await Coupon.findById(testCoupon._id)).usedCount;
    const initialEntitlementsCount = await Entitlement.countDocuments({ userId: studentUser._id, productId: testCourse._id });
    const initialEarningsCount = await InstructorEarning.countDocuments({ orderId: existingOrder._id });

    // Replay Finalization
    const replayResult = await PaymentService.finalizeSuccessfulPayment({
      orderId: existingOrder.orderId,
      provider: 'CASHFREE',
      providerOrderId: existingOrder.orderId,
      providerPaymentId: 'CF-PAY-DUPLICATE',
      amount: 1500,
    });

    assert.strictEqual(replayResult.alreadyFinalized, true);

    // Verify Counts did not increment
    const couponAfterReplay = await Coupon.findById(testCoupon._id);
    assert.strictEqual(couponAfterReplay.usedCount, initialCouponCount);

    const entitlementsAfterReplay = await Entitlement.countDocuments({ userId: studentUser._id, productId: testCourse._id });
    assert.strictEqual(entitlementsAfterReplay, initialEntitlementsCount);

    const earningsAfterReplay = await InstructorEarning.countDocuments({ orderId: existingOrder._id });
    assert.strictEqual(earningsAfterReplay, initialEarningsCount);
  });

  // TEST 5: Payment Amount Reconciliation Guard
  it('5. Should reject payment finalization when provider amount does not match order amount', async () => {
    const mismatchOrder = await Order.create({
      orderId: `LMS-MISMATCH-${Date.now()}`,
      userId: studentUser._id,
      items: [{ productId: testCourse._id, finalPrice: 2000 }],
      finalAmount: 2000,
      paymentStatus: PAYMENT_STATUS.INITIATED,
      orderStatus: ORDER_STATUS.PAYMENT_PENDING,
    });

    await assert.rejects(
      async () => {
        await PaymentService.finalizeSuccessfulPayment({
          orderId: mismatchOrder.orderId,
          amount: 500, // Tampered / wrong amount received
        });
      },
      /Payment amount mismatch/,
      'Must reject on price tampering or mismatch'
    );

    const refreshedOrder = await Order.findOne({ orderId: mismatchOrder.orderId });
    assert.strictEqual(refreshedOrder.paymentStatus, PAYMENT_STATUS.FAILED);
  });
});
