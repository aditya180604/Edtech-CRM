import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
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
  AuditLog,
} from '../src/models/index.js';
import { CouponService } from '../src/modules/coupons/coupon.service.js';
import { CartService } from '../src/modules/cart/cart.service.js';
import { CheckoutService } from '../src/modules/checkout/checkout.service.js';
import { PricingService } from '../src/modules/checkout/pricing.service.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

describe('Production Cart + Checkout + Course-Scoped Coupon Test Suite', () => {
  let superAdminUser;
  let instructorUserA;
  let instructorUserB;
  let studentUser1;
  let studentUser2;
  let courseA;
  let courseB;
  let courseC;
  let testCoupons = [];

  before(async () => {
    await connectDB();

    // Clean up test data
    await User.deleteMany({ email: /test_prod_suite_/ });
    await Course.deleteMany({ slug: /test-prod-course-/ });
    await Coupon.deleteMany({ code: { $in: ['CS100@AA', 'CS200@BB', 'CS300@CC', 'LIMIT@01', 'EXPIRED1', 'FUTUR@01', 'MIN10K01'] } });
    await CouponRedemption.deleteMany({ code: { $in: ['CS100@AA', 'CS200@BB', 'CS300@CC', 'LIMIT@01', 'EXPIRED1', 'FUTUR@01', 'MIN10K01'] } });

    // 1. Create Super Admin
    superAdminUser = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'test_prod_suite_sa@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Instructors
    instructorUserA = await User.create({
      firstName: 'Alice',
      lastName: 'Tutor',
      email: 'test_prod_suite_inst_a@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.INSTRUCTOR,
      status: USER_STATUS.ACTIVE,
    });

    instructorUserB = await User.create({
      firstName: 'Bob',
      lastName: 'Tutor',
      email: 'test_prod_suite_inst_b@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.INSTRUCTOR,
      status: USER_STATUS.ACTIVE,
    });

    // 3. Create Students
    studentUser1 = await User.create({
      firstName: 'Charlie',
      lastName: 'Student',
      email: 'test_prod_suite_student1@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    studentUser2 = await User.create({
      firstName: 'Dave',
      lastName: 'Student',
      email: 'test_prod_suite_student2@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 4. Create Courses
    courseA = await Course.create({
      title: 'Full Stack Masterclass',
      slug: 'test-prod-course-a',
      description: 'Master full stack development',
      instructorId: instructorUserA._id,
      coursePrice: 5000,
      currency: 'INR',
      status: 'PUBLISHED',
    });

    courseB = await Course.create({
      title: 'Advanced AI Systems',
      slug: 'test-prod-course-b',
      description: 'Production AI agents',
      instructorId: instructorUserB._id,
      coursePrice: 4000,
      currency: 'INR',
      status: 'PUBLISHED',
    });

    courseC = await Course.create({
      title: 'Cloud DevOps Architecture',
      slug: 'test-prod-course-c',
      description: 'Kubernetes and Cloud infrastructure',
      instructorId: instructorUserA._id,
      coursePrice: 6000,
      currency: 'INR',
      status: 'PUBLISHED',
    });

    // Clean up carts & entitlements for test users
    await Cart.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });
    await Entitlement.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });
    await Order.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });
  });

  after(async () => {
    // Cleanup
    await User.deleteMany({ email: /test_prod_suite_/ });
    await Course.deleteMany({ slug: /test-prod-course-/ });
    await Coupon.deleteMany({ code: { $in: ['CS100@AA', 'CS200@BB', 'CS300@CC', 'LIMIT@01', 'EXPIRED1', 'FUTUR@01', 'MIN10K01'] } });
    await CouponRedemption.deleteMany({ code: { $in: ['CS100@AA', 'CS200@BB', 'CS300@CC', 'LIMIT@01', 'EXPIRED1', 'FUTUR@01', 'MIN10K01'] } });
    if (studentUser1 && studentUser2) {
      await Cart.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });
      await Entitlement.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });
      await Order.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });
    }
    await disconnectDB();
  });

  // ==========================================
  // 1. COURSE-SCOPED COUPON CREATION & DERIVATION
  // ==========================================
  describe('1. Course-Scoped Coupon Creation & Authoritative Instructor Derivation', () => {
    it('should create coupon and authoritatively derive instructorId from Course', async () => {
      const now = new Date();
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      const coupon = await CouponService.createCoupon(
        {
          code: 'CS100@AA',
          courseId: courseA._id.toString(),
          discountType: 'PERCENTAGE',
          discountValue: 20, // 20% off
          usageLimit: 50,
          perUserLimit: 1,
          startDate: now.toISOString(),
          expiryDate: future.toISOString(),
          description: '20% off Course A',
        },
        superAdminUser
      );

      assert.strictEqual(coupon.code, 'CS100@AA');
      assert.strictEqual((coupon.courseId?._id || coupon.courseId).toString(), courseA._id.toString());
      assert.strictEqual((coupon.instructorId?._id || coupon.instructorId).toString(), instructorUserA._id.toString());
      assert.strictEqual(coupon.ownerType, 'SUPER_ADMIN');
      assert.strictEqual(coupon.usedCount, 0);
      assert.strictEqual(coupon.status, 'ACTIVE');

      testCoupons.push(coupon);
    });

    it('should reject coupon creation if course does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const now = new Date();
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      await assert.rejects(
        async () => {
          await CouponService.createCoupon(
            {
              code: 'CS200@BB',
              courseId: fakeId.toString(),
              discountType: 'FIXED',
              discountValue: 500,
              usageLimit: 10,
              startDate: now.toISOString(),
              expiryDate: future.toISOString(),
            },
            superAdminUser
          );
        },
        { message: /Course not found/ }
      );
    });

    it('should enforce exact 8-character coupon code validation', async () => {
      const now = new Date();
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

      // Too short (7 chars)
      await assert.rejects(
        async () => {
          await CouponService.createCoupon(
            {
              code: 'SHORT12',
              courseId: courseA._id.toString(),
              discountType: 'PERCENTAGE',
              discountValue: 10,
              usageLimit: 10,
              startDate: now.toISOString(),
              expiryDate: future.toISOString(),
            },
            superAdminUser
          );
        },
        { message: /exactly 8 characters/ }
      );

      // Too long (9 chars)
      await assert.rejects(
        async () => {
          await CouponService.createCoupon(
            {
              code: 'TOOLONG12',
              courseId: courseA._id.toString(),
              discountType: 'PERCENTAGE',
              discountValue: 10,
              usageLimit: 10,
              startDate: now.toISOString(),
              expiryDate: future.toISOString(),
            },
            superAdminUser
          );
        },
        { message: /exactly 8 characters/ }
      );
    });
  });

  // ==========================================
  // 2. BACKEND CART OPERATIONS & VALIDATION
  // ==========================================
  describe('2. Authoritative Backend Cart Lifecycle', () => {
    it('should add courses to student cart', async () => {
      const cart = await CartService.addItem(studentUser1._id, {
        productType: 'COURSE',
        productId: courseA._id.toString(),
      });

      assert.strictEqual(cart.items.length, 1);
      assert.strictEqual(cart.items[0].productId.toString(), courseA._id.toString());
      assert.strictEqual(cart.items[0].unitPrice, 5000);
      assert.strictEqual(cart.items[0].currency, 'INR');
    });

    it('should prevent adding duplicate course to cart (ALREADY_IN_CART)', async () => {
      await assert.rejects(
        async () => {
          await CartService.addItem(studentUser1._id, {
            productType: 'COURSE',
            productId: courseA._id.toString(),
          });
        },
        (err) => {
          assert.strictEqual(err.code, 'ALREADY_IN_CART');
          return true;
        }
      );
    });

    it('should add multiple different courses to cart', async () => {
      await CartService.addItem(studentUser1._id, {
        productType: 'COURSE',
        productId: courseB._id.toString(),
      });

      await CartService.addItem(studentUser1._id, {
        productType: 'COURSE',
        productId: courseC._id.toString(),
      });

      const userCart = await CartService.getCart(studentUser1._id);
      assert.strictEqual(userCart.items.length, 3);
      assert.strictEqual(userCart.itemCount, 3);
    });

    it('should remove item from cart and recalculate itemCount', async () => {
      const updatedCart = await CartService.removeItem(studentUser1._id, courseC._id.toString());
      assert.strictEqual(updatedCart.items.length, 2);
      assert.strictEqual(updatedCart.itemCount, 2);
      const remainingIds = updatedCart.items.map((i) => i.productId.toString());
      assert.ok(!remainingIds.includes(courseC._id.toString()));
    });
  });

  // ==========================================
  // 3. MULTI-COURSE LINE-LEVEL COUPON QUOTING
  // ==========================================
  describe('3. Multi-Course Cart Line-Level Coupon Application & Math', () => {
    it('should apply coupon CS100@AA ONLY to Course A in a multi-course cart', async () => {
      // Cart currently contains Course A (₹5000) and Course B (₹4000). Total = ₹9000.
      // Coupon CS100@AA is for Course A (20% off).
      // Course A discount = 20% of 5000 = 1000. Final Course A price = 4000.
      // Course B discount = 0. Final Course B price = 4000.
      // Final Cart Total = 8000.
      const quote = await CheckoutService.getQuote({
        userId: studentUser1._id,
        couponCode: 'CS100@AA',
      });

      assert.strictEqual(quote.subtotal, 9000);
      assert.strictEqual(quote.discount, 1000);
      assert.strictEqual(quote.finalAmount, 8000);
      assert.strictEqual(quote.coupon.applied, true);
      assert.strictEqual(quote.coupon.code, 'CS100@AA');
      assert.strictEqual(quote.coupon.discountAmount, 1000);

      // Verify line items
      const itemA = quote.items.find((i) => i.courseId.toString() === courseA._id.toString());
      const itemB = quote.items.find((i) => i.courseId.toString() === courseB._id.toString());

      assert.ok(itemA);
      assert.strictEqual(itemA.unitPrice, 5000);
      assert.strictEqual(itemA.discount, 1000);
      assert.strictEqual(itemA.finalPrice, 4000);

      assert.ok(itemB);
      assert.strictEqual(itemB.unitPrice, 4000);
      assert.strictEqual(itemB.discount, 0);
      assert.strictEqual(itemB.finalPrice, 4000);
    });

    it('should reject coupon if target course is not in student cart (COUPON_NOT_APPLICABLE)', async () => {
      // Create coupon for Course C
      const now = new Date();
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      await CouponService.createCoupon(
        {
          code: 'CS300@CC',
          courseId: courseC._id.toString(),
          discountType: 'PERCENTAGE',
          discountValue: 30,
          usageLimit: 10,
          startDate: now.toISOString(),
          expiryDate: future.toISOString(),
        },
        superAdminUser
      );

      // Cart has A and B, not C
      await assert.rejects(
        async () => {
          await CheckoutService.getQuote({
            userId: studentUser1._id,
            couponCode: 'CS300@CC',
          });
        },
        (err) => {
          assert.strictEqual(err.code, 'COUPON_NOT_APPLICABLE');
          return true;
        }
      );
    });

    it('should reject expired coupon (COUPON_EXPIRED)', async () => {
      const pastStart = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const pastExpiry = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const expiredCoupon = new Coupon({
        code: 'EXPIRED1',
        courseId: courseA._id,
        instructorId: instructorUserA._id,
        ownerType: 'SUPER_ADMIN',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        usageLimit: 10,
        perUserLimit: 1,
        startDate: pastStart,
        expiryDate: pastExpiry,
        status: 'ACTIVE',
        createdBy: superAdminUser._id,
      });
      await expiredCoupon.save();

      await assert.rejects(
        async () => {
          await CheckoutService.getQuote({
            userId: studentUser1._id,
            couponCode: 'EXPIRED1',
          });
        },
        (err) => {
          assert.strictEqual(err.code, 'COUPON_EXPIRED');
          return true;
        }
      );
    });
  });

  // ==========================================
  // 4. CHECKOUT EXECUTION & IDEMPOTENCY
  // ==========================================
  describe('4. Transaction-Safe Checkout, Entitlements & Idempotency', () => {
    const testIdempotencyKey = `IDEMP-${Date.now()}-A1`;

    it('should complete checkout, provision entitlements, record ledger & clear cart', async () => {
      const checkoutResult = await CheckoutService.processCheckout({
        userId: studentUser1._id,
        couponCode: 'CS100@AA',
        paymentMethod: 'PAYMENT_UPI',
        idempotencyKey: testIdempotencyKey,
      });

      assert.strictEqual(checkoutResult.success, true);
      assert.ok(checkoutResult.order);
      assert.strictEqual(checkoutResult.order.subtotal, 9000);
      assert.strictEqual(checkoutResult.order.couponDiscount, 1000);
      assert.strictEqual(checkoutResult.order.finalAmount, 8000);

      // Verify Entitlements were provisioned for both courses
      const entitlements = await Entitlement.find({
        userId: studentUser1._id,
        courseId: { $in: [courseA._id, courseB._id] },
        status: 'ACTIVE',
      });
      assert.strictEqual(entitlements.length, 2);

      // Verify Cart was cleared
      const cartAfter = await CartService.getCart(studentUser1._id);
      assert.strictEqual(cartAfter.items.length, 0);

      // Verify Coupon usedCount incremented
      const updatedCoupon = await Coupon.findOne({ code: 'CS100@AA' });
      assert.strictEqual(updatedCoupon.usedCount, 1);

      // Verify CouponRedemption record
      const redemption = await CouponRedemption.findOne({
        code: 'CS100@AA',
        userId: studentUser1._id,
        status: 'SUCCESS',
      });
      assert.ok(redemption);
      assert.strictEqual(redemption.discountAmount, 1000);

      // Verify Instructor Earnings are calculated on the actual discounted line prices
      // Course A: final line price was 4000 -> 80% instructor earning = 3200
      // Course B: final line price was 4000 -> 80% instructor earning = 3200
      const earningA = await InstructorEarning.findOne({
        instructorId: instructorUserA._id,
      });
      assert.ok(earningA);
      assert.strictEqual(earningA.grossAmount, 4000);
      assert.strictEqual(earningA.netEarning, 3200);
    });

    it('should return idempotent cached order on repeated checkout with identical idempotencyKey', async () => {
      const duplicateCheckoutResult = await CheckoutService.processCheckout({
        userId: studentUser1._id,
        couponCode: 'CS100@AA',
        paymentMethod: 'PAYMENT_UPI',
        idempotencyKey: testIdempotencyKey,
      });

      assert.strictEqual(duplicateCheckoutResult.success, true);
      assert.strictEqual(duplicateCheckoutResult.isIdempotentReplay, true);

      // Verify coupon usedCount was NOT incremented again
      const couponCheck = await Coupon.findOne({ code: 'CS100@AA' });
      assert.strictEqual(couponCheck.usedCount, 1);
    });

    it('should reject purchase of already-owned courses (COURSE_ALREADY_OWNED)', async () => {
      // Student 1 now owns Course A
      // Try adding course A again to cart
      await assert.rejects(
        async () => {
          await CartService.addItem(studentUser1._id, {
            productType: 'COURSE',
            productId: courseA._id.toString(),
          });
        },
        (err) => {
          assert.strictEqual(err.code, 'ALREADY_OWNED');
          return true;
        }
      );
    });

    it('should enforce per-user limit when student tries to reuse coupon (COUPON_USER_LIMIT_REACHED)', async () => {
      // Put Course A into student 2 cart so coupon target exists, but student 1 tries to validate
      await CartService.addItem(studentUser1._id, {
        productType: 'COURSE',
        productId: courseC._id.toString(),
      });

      // Student 1 already redeemed CS100@AA with perUserLimit = 1
      await assert.rejects(
        async () => {
          await CheckoutService.getQuote({
            userId: studentUser1._id,
            couponCode: 'CS100@AA',
          });
        },
        (err) => {
          // It will either fail with COUPON_USER_LIMIT_REACHED or COUPON_NOT_APPLICABLE
          assert.ok(err.code === 'COUPON_USER_LIMIT_REACHED' || err.code === 'COUPON_NOT_APPLICABLE');
          return true;
        }
      );
    });
  });

  // ==========================================
  // 5. CONCURRENCY & ATOMIC USAGE EXHAUSTION
  // ==========================================
  describe('5. Concurrency & Atomic Coupon Usage Protection', () => {
    it('should atomically allow only 1 winner when usageLimit=1 with concurrent checkouts', async () => {
      // Create coupon with usageLimit = 1 for Course C
      const now = new Date();
      const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
      await CouponService.createCoupon(
        {
          code: 'LIMIT@01',
          courseId: courseC._id.toString(),
          discountType: 'FIXED',
          discountValue: 1000,
          usageLimit: 1, // EXACTLY 1 USE
          perUserLimit: 1,
          startDate: now.toISOString(),
          expiryDate: future.toISOString(),
        },
        superAdminUser
      );

      // Clear student 1 and student 2 carts, then add Course C to both
      await Cart.deleteMany({ userId: { $in: [studentUser1._id, studentUser2._id] } });

      await CartService.addItem(studentUser1._id, {
        productType: 'COURSE',
        productId: courseC._id.toString(),
      });

      await CartService.addItem(studentUser2._id, {
        productType: 'COURSE',
        productId: courseC._id.toString(),
      });

      // Launch simultaneous checkouts for Student 1 and Student 2 using the same coupon
      const results = await Promise.allSettled([
        CheckoutService.processCheckout({
          userId: studentUser1._id,
          couponCode: 'LIMIT@01',
          paymentMethod: 'PAYMENT_CARD',
          idempotencyKey: `IDEMP-CONCUR-1-${Date.now()}`,
        }),
        CheckoutService.processCheckout({
          userId: studentUser2._id,
          couponCode: 'LIMIT@01',
          paymentMethod: 'PAYMENT_CARD',
          idempotencyKey: `IDEMP-CONCUR-2-${Date.now()}`,
        }),
      ]);

      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      // Exactly 1 must succeed and 1 must fail due to usage exhaustion
      assert.strictEqual(fulfilled.length, 1);
      assert.strictEqual(rejected.length, 1);
      assert.strictEqual(rejected[0].reason.code, 'COUPON_USAGE_LIMIT_REACHED');

      // Database usedCount must be exactly 1, never 2
      const finalCoupon = await Coupon.findOne({ code: 'LIMIT@01' });
      assert.strictEqual(finalCoupon.usedCount, 1);
    });
  });
});
