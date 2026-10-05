import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, Course, Coupon, CouponRedemption, AuditLog, Order } from '../src/models/index.js';
import { CouponService, COUPON_CODE_REGEX } from '../src/modules/coupons/coupon.service.js';
import { ROLES, USER_STATUS } from '../src/config/constants.js';

describe('Real Dynamic Coupon Code System — Super Admin & Authoritative Checkout Suite', () => {
  let superAdminUser;
  let testStudentUser;
  let testCourse;

  before(async () => {
    await connectDB();

    // Clean up test coupons and users
    await Coupon.deleteMany({ code: { $in: ['Ab7@X2!Q', 'SAVE@25#', 'aB9$kP2!', 'X7@mN4#q', 'TST@100#', 'EXP@2026', 'FUT@2099', 'MAX@DIS#', 'FIX@500#'] } });
    await CouponRedemption.deleteMany({ code: { $in: ['Ab7@X2!Q', 'SAVE@25#', 'aB9$kP2!', 'X7@mN4#q', 'TST@100#'] } });
    await Course.deleteMany({ slug: 'test-coupon-suite-course' });
    await User.deleteMany({ email: /test_coupon_suite_/ });

    // 1. Create Super Admin
    superAdminUser = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'test_coupon_suite_sa@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
    });

    // 2. Create Student
    testStudentUser = await User.create({
      firstName: 'Student',
      lastName: 'Tester',
      email: 'test_coupon_suite_student@example.com',
      passwordHash: 'dummyhash',
      role: ROLES.STUDENT,
      status: USER_STATUS.ACTIVE,
    });

    // 3. Create Course
    testCourse = await Course.create({
      title: 'Full Stack Masterclass',
      slug: 'test-coupon-suite-course',
      description: 'Master full stack development',
      instructorId: superAdminUser._id,
      coursePrice: 5000,
      currency: 'INR',
      status: 'PUBLISHED',
    });
  });

  after(async () => {
    // Cleanup
    await Coupon.deleteMany({ code: { $in: ['Ab7@X2!Q', 'SAVE@25#', 'aB9$kP2!', 'X7@mN4#q', 'TST@100#', 'EXP@2026', 'FUT@2099', 'MAX@DIS#', 'FIX@500#'] } });
    await CouponRedemption.deleteMany({ code: { $in: ['Ab7@X2!Q', 'SAVE@25#', 'aB9$kP2!', 'X7@mN4#q', 'TST@100#'] } });
    await Course.deleteMany({ slug: 'test-coupon-suite-course' });
    await User.deleteMany({ email: /test_coupon_suite_/ });
    await disconnectDB();
  });

  // ==========================================
  // 1. CREATION & VALIDATION TESTS
  // ==========================================
  describe('1. Coupon Code Format & Creation Validation', () => {
    it('should validate exact 8-character regex pattern with uppercase, lowercase, numbers, and allowed symbols', () => {
      assert.strictEqual(COUPON_CODE_REGEX.test('Ab7@X2!Q'), true);
      assert.strictEqual(COUPON_CODE_REGEX.test('SAVE@25#'), true);
      assert.strictEqual(COUPON_CODE_REGEX.test('aB9$kP2!'), true);
      assert.strictEqual(COUPON_CODE_REGEX.test('X7@mN4#q'), true);

      // Invalid lengths
      assert.strictEqual(COUPON_CODE_REGEX.test('EDU10'), false); // 5 chars
      assert.strictEqual(COUPON_CODE_REGEX.test('TOOLONGCODE99'), false); // 13 chars

      // Invalid special characters
      assert.strictEqual(COUPON_CODE_REGEX.test('Ab7~X2!Q'), false); // ~ not allowed
      assert.strictEqual(COUPON_CODE_REGEX.test('Ab7 X2!Q'), false); // space not allowed
    });

    it('should successfully create a dynamic percentage coupon by Super Admin with audit log', async () => {
      const now = new Date(Date.now() - 1000 * 60); // 1 min ago
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days later

      const created = await CouponService.createCoupon(
        {
          code: 'Ab7@X2!Q',
          courseId: testCourse._id.toString(),
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minimumAmount: 1000,
          maximumDiscount: 2000,
          usageLimit: 100,
          perUserLimit: 1,
          startDate: now.toISOString(),
          expiryDate: expiry.toISOString(),
          status: 'ACTIVE',
          description: 'Special 20% platform discount',
        },
        superAdminUser,
        { ipAddress: '127.0.0.1', userAgent: 'NodeTestRunner' }
      );

      assert.strictEqual(created.code, 'Ab7@X2!Q');
      assert.strictEqual(created.discountType, 'PERCENTAGE');
      assert.strictEqual(created.discountValue, 20);
      assert.strictEqual(created.remainingUses, 100);
      assert.strictEqual(created.derivedStatus, 'ACTIVE');

      // Verify AuditLog was recorded
      const audit = await AuditLog.findOne({ resourceId: created._id.toString(), action: 'CREATE_COUPON' });
      assert.ok(audit, 'Audit log must exist for CREATE_COUPON');
    });

    it('should reject creating duplicate coupon code', async () => {
      await assert.rejects(
        async () => {
          await CouponService.createCoupon(
            {
              code: 'Ab7@X2!Q',
              courseId: testCourse._id.toString(),
              discountType: 'PERCENTAGE',
              discountValue: 10,
              startDate: new Date(),
              expiryDate: new Date(Date.now() + 100000),
            },
            superAdminUser
          );
        },
        { message: /already exists/ }
      );
    });

    it('should reject invalid discount values (percentage > 100 or <= 0)', async () => {
      await assert.rejects(
        async () => {
          await CouponService.createCoupon(
            {
              code: 'SAVE@25#',
              courseId: testCourse._id.toString(),
              discountType: 'PERCENTAGE',
              discountValue: 150, // invalid
              startDate: new Date(),
              expiryDate: new Date(Date.now() + 100000),
            },
            superAdminUser
          );
        },
        { message: /cannot exceed 100%/ }
      );
    });

    it('should reject coupon with startDate >= expiryDate', async () => {
      const now = new Date();
      const past = new Date(Date.now() - 1000 * 60 * 60);

      await assert.rejects(
        async () => {
          await CouponService.createCoupon(
            {
              code: 'SAVE@25#',
              courseId: testCourse._id.toString(),
              discountType: 'PERCENTAGE',
              discountValue: 25,
              startDate: now.toISOString(),
              expiryDate: past.toISOString(), // earlier than start
            },
            superAdminUser
          );
        },
        { message: /startDate must be before expiryDate/ }
      );
    });
  });

  // ==========================================
  // 2. AUTHORITATIVE VALIDATION & DISCOUNT CALCULATION
  // ==========================================
  describe('2. Authoritative Checkout Validation & Calculation', () => {
    it('should calculate 20% discount on ₹5,000 subtotal = ₹1,000 discount, ₹4,000 final amount', async () => {
      const result = await CouponService.validateCoupon({
        code: 'Ab7@X2!Q',
        subtotal: 5000,
        userId: testStudentUser._id,
      });

      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.discountAmount, 1000);
      assert.strictEqual(result.subtotal, 5000);
      assert.strictEqual(result.finalAmount, 4000);
    });

    it('should correctly enforce maximumDiscount cap on large order amounts', async () => {
      // 20% of 20,000 is 4,000, but maximumDiscount cap is 2,000
      const result = await CouponService.validateCoupon({
        code: 'Ab7@X2!Q',
        subtotal: 20000,
        userId: testStudentUser._id,
      });

      assert.strictEqual(result.discountAmount, 2000);
      assert.strictEqual(result.finalAmount, 18000);
    });

    it('should reject coupon if subtotal is below minimum order amount requirement', async () => {
      // Ab7@X2!Q requires minimumAmount: 1000
      await assert.rejects(
        async () => {
          await CouponService.validateCoupon({
            code: 'Ab7@X2!Q',
            subtotal: 500, // below minimum 1000
            userId: testStudentUser._id,
          });
        },
        { message: /Minimum order amount/ }
      );
    });

    it('should calculate fixed discount correctly and never allow negative final amount', async () => {
      const now = new Date(Date.now() - 1000 * 60);
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      await CouponService.createCoupon(
        {
          code: 'FIX@500#',
          courseId: testCourse._id.toString(),
          discountType: 'FIXED',
          discountValue: 500,
          usageLimit: 50,
          startDate: now.toISOString(),
          expiryDate: expiry.toISOString(),
          status: 'ACTIVE',
        },
        superAdminUser
      );

      // Normal ₹3,000 course with ₹500 discount -> ₹2,500
      const res1 = await CouponService.validateCoupon({
        code: 'FIX@500#',
        subtotal: 3000,
      });
      assert.strictEqual(res1.discountAmount, 500);
      assert.strictEqual(res1.finalAmount, 2500);

      // Small ₹300 topic with ₹500 discount -> discount capped at ₹300, finalAmount = ₹0 (never negative)
      const res2 = await CouponService.validateCoupon({
        code: 'FIX@500#',
        subtotal: 300,
      });
      assert.strictEqual(res2.discountAmount, 300);
      assert.strictEqual(res2.finalAmount, 0);
    });

    it('should reject expired coupons', async () => {
      const pastStart = new Date(Date.now() - 1000 * 60 * 60 * 48);
      const pastExpiry = new Date(Date.now() - 1000 * 60 * 60 * 24);

      await CouponService.createCoupon(
        {
          code: 'EXP@2026',
          courseId: testCourse._id.toString(),
          discountType: 'PERCENTAGE',
          discountValue: 10,
          startDate: pastStart.toISOString(),
          expiryDate: pastExpiry.toISOString(),
          status: 'ACTIVE',
        },
        superAdminUser
      );

      await assert.rejects(
        async () => {
          await CouponService.validateCoupon({
            code: 'EXP@2026',
            subtotal: 2000,
          });
        },
        { message: /Coupon has expired/ }
      );
    });

    it('should reject future coupons that have not started yet', async () => {
      const futureStart = new Date(Date.now() + 1000 * 60 * 60 * 24 * 5);
      const futureExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 20);

      await CouponService.createCoupon(
        {
          code: 'FUT@2099',
          courseId: testCourse._id.toString(),
          discountType: 'PERCENTAGE',
          discountValue: 15,
          startDate: futureStart.toISOString(),
          expiryDate: futureExpiry.toISOString(),
          status: 'ACTIVE',
        },
        superAdminUser
      );

      await assert.rejects(
        async () => {
          await CouponService.validateCoupon({
            code: 'FUT@2099',
            subtotal: 2000,
          });
        },
        { message: /Coupon is not active yet/ }
      );
    });

    it('should reject deactivated / inactive coupons', async () => {
      const now = new Date(Date.now() - 1000 * 60);
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      const coupon = await CouponService.createCoupon(
        {
          code: 'aB9$kP2!',
          courseId: testCourse._id.toString(),
          discountType: 'PERCENTAGE',
          discountValue: 10,
          startDate: now.toISOString(),
          expiryDate: expiry.toISOString(),
          status: 'INACTIVE',
        },
        superAdminUser
      );

      await assert.rejects(
        async () => {
          await CouponService.validateCoupon({
            code: 'aB9$kP2!',
            subtotal: 2000,
          });
        },
        { message: /Coupon is currently inactive/ }
      );
    });
  });

  // ==========================================
  // 3. REDEMPTION & USAGE LIMIT ATOMICITY
  // ==========================================
  describe('3. Atomic Redemption & Per-User Limit Enforcement', () => {
    it('should successfully record redemption and increment usedCount atomically', async () => {
      const coupon = await Coupon.findOne({ code: 'Ab7@X2!Q' });
      const initialUsedCount = coupon.usedCount;

      const redemption = await CouponService.redeemCoupon({
        couponId: coupon._id,
        userId: testStudentUser._id,
        orderId: new mongoose.Types.ObjectId(),
        discountAmount: 1000,
      });

      assert.ok(redemption, 'Redemption record must be created');
      assert.strictEqual(redemption.code, 'Ab7@X2!Q');
      assert.strictEqual(redemption.status, 'REDEEMED');

      const updatedCoupon = await Coupon.findById(coupon._id);
      assert.strictEqual(updatedCoupon.usedCount, initialUsedCount + 1);
    });

    it('should block the student from redeeming the coupon again when perUserLimit is 1', async () => {
      // Student already redeemed Ab7@X2!Q once above (perUserLimit: 1)
      await assert.rejects(
        async () => {
          await CouponService.validateCoupon({
            code: 'Ab7@X2!Q',
            subtotal: 5000,
            userId: testStudentUser._id,
          });
        },
        { message: /maximum allowed times/ }
      );
    });

    it('should block validation when total usageLimit is exhausted', async () => {
      const now = new Date(Date.now() - 1000 * 60);
      const expiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      // Create coupon with usageLimit = 1
      const limitedCoupon = await CouponService.createCoupon(
        {
          code: 'TST@100#',
          courseId: testCourse._id.toString(),
          discountType: 'FIXED',
          discountValue: 100,
          usageLimit: 1,
          perUserLimit: 5,
          startDate: now.toISOString(),
          expiryDate: expiry.toISOString(),
          status: 'ACTIVE',
        },
        superAdminUser
      );

      // Redeem the 1 slot
      await CouponService.redeemCoupon({
        couponId: limitedCoupon._id,
        userId: testStudentUser._id,
        orderId: new mongoose.Types.ObjectId(),
        discountAmount: 100,
      });

      // Second user tries to validate
      await assert.rejects(
        async () => {
          await CouponService.validateCoupon({
            code: 'TST@100#',
            subtotal: 1000,
            userId: new mongoose.Types.ObjectId(),
          });
        },
        { message: /usage limit has been reached/ }
      );
    });
  });

  // ==========================================
  // 4. SUPER ADMIN MANAGEMENT & AUDIT TRAIL
  // ==========================================
  describe('4. Super Admin Management & Safe Archiving', () => {
    it('should allow Super Admin to list coupons with pagination and computed remaining uses', async () => {
      const result = await CouponService.getCoupons({ page: 1, limit: 10 });
      assert.ok(result.coupons.length > 0);
      assert.ok(result.stats.totalCoupons >= 1);
      assert.ok(result.pagination.total >= 1);

      const target = result.coupons.find((c) => c.code === 'Ab7@X2!Q');
      assert.ok(target);
      assert.strictEqual(target.remainingUses, target.usageLimit - target.usedCount);
    });

    it('should safely soft-delete (archive) a coupon that has historical redemptions to preserve order auditability', async () => {
      const coupon = await Coupon.findOne({ code: 'Ab7@X2!Q' });
      assert.ok(coupon.usedCount > 0, 'Coupon must have historical usage');

      const delResult = await CouponService.deleteCoupon(coupon._id, superAdminUser, { ipAddress: '127.0.0.1' });
      assert.strictEqual(delResult.success, true);

      // Coupon should still exist in database as ARCHIVED
      const archived = await Coupon.findById(coupon._id);
      assert.ok(archived, 'Coupon document must not be hard deleted');
      assert.strictEqual(archived.status, 'ARCHIVED');

      // Check AuditLog
      const audit = await AuditLog.findOne({ resourceId: coupon._id.toString(), action: 'DELETE_COUPON' });
      assert.ok(audit, 'AuditLog for coupon archiving must exist');
    });
  });
});
