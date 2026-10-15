import mongoose from 'mongoose';
import {
  User,
  InstructorProfile,
  Course,
  Order,
  Payment,
  Refund,
  Booking,
  TeachingSlot,
  SupportTicket,
  SupportMessage,
  CommunicationLog,
  Notification,
  AuditLog,
} from '../../models/index.js';
import { AppError } from '../../utils/apiResponse.js';
import { AuditLogger } from '../../utils/auditLogger.js';
import { ROLES, USER_STATUS, PAYMENT_STATUS, ORDER_STATUS } from '../../config/constants.js';
import { LearningPathService } from '../learningPaths/learningPath.service.js';

export class AdminService {
  /**
   * Page 1: Admin Dashboard Real Real-time Overview
   * Derived 100% from actual MongoDB records
   */
  static async getDashboardOverview({ startDate, endDate } = {}) {
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const [
      totalStudents,
      newStudentsThisMonth,
      totalInstructors,
      pendingInstructors,
      totalCourses,
      publishedCourses,
      draftCourses,
      verifiedPaymentsAgg,
      totalRefundsAgg,
      totalOrdersCount,
      upcomingConsultationsCount,
      openSupportTicketsCount,
      recentActivityLogs,
      upcomingConsultationsList,
    ] = await Promise.all([
      // 1. Students count
      User.countDocuments({ role: ROLES.STUDENT }),
      // New students this month
      User.countDocuments({
        role: ROLES.STUDENT,
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      }),
      // 2. Instructors count
      User.countDocuments({ role: ROLES.INSTRUCTOR }),
      InstructorProfile.countDocuments({ isVerified: false }),
      // 3. Courses count
      Course.countDocuments(),
      Course.countDocuments({ status: 'PUBLISHED' }),
      Course.countDocuments({ status: { $in: ['DRAFT', 'UNDER_REVIEW'] } }),
      // 4. Gross Verified Payments (Successful Cashfree payments only)
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.SUCCESS,
            ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalGross: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Verified Refunds
      Refund.aggregate([
        {
          $match: {
            status: { $in: ['PROCESSED', 'SUCCESS'] },
            ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
          },
        },
        {
          $group: {
            _id: null,
            totalRefunded: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      // Total orders
      Order.countDocuments({ orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] } }),
      // 5. Consultations
      Booking.countDocuments({
        startTime: { $gte: new Date() },
        status: { $in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      }),
      // 6. Support Tickets
      SupportTicket.countDocuments({ status: { $in: ['OPEN', 'IN_PROGRESS'] } }),
      // 7. Recent activity (from audit logs)
      AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(6)
        .populate('actorId', 'firstName lastName email role')
        .lean(),
      // 8. Upcoming consultations list
      Booking.find({
        startTime: { $gte: new Date() },
        status: { $in: ['CONFIRMED', 'PENDING_PAYMENT'] },
      })
        .sort({ startTime: 1 })
        .limit(5)
        .populate('userId', 'firstName lastName email profilePhoto')
        .populate('instructorId', 'firstName lastName email profilePhoto')
        .lean(),
    ]);

    const grossRevenue = verifiedPaymentsAgg[0]?.totalGross || 0;
    const verifiedPurchasesCount = verifiedPaymentsAgg[0]?.count || 0;
    const refundedAmount = totalRefundsAgg[0]?.totalRefunded || 0;
    const netRevenue = Math.max(0, grossRevenue - refundedAmount);

    // Compute monthly platform growth timeline for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [monthlyStudentsAgg, monthlyRevenueAgg] = await Promise.all([
      User.aggregate([
        {
          $match: {
            role: ROLES.STUDENT,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: PAYMENT_STATUS.SUCCESS,
            createdAt: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const growthTimeline = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mNum = d.getMonth() + 1;
      const yNum = d.getFullYear();
      const mLabel = `${months[d.getMonth()]} ${yNum}`;

      const sCount = monthlyStudentsAgg.find(
        (a) => a._id.year === yNum && a._id.month === mNum
      )?.count || 0;

      const rAmount = monthlyRevenueAgg.find(
        (a) => a._id.year === yNum && a._id.month === mNum
      )?.revenue || 0;

      growthTimeline.push({
        label: mLabel,
        students: sCount,
        revenue: rAmount,
      });
    }

    return {
      metrics: {
        totalStudents,
        newStudentsThisMonth,
        totalInstructors,
        pendingInstructors,
        totalCourses,
        publishedCourses,
        draftCourses,
        grossRevenue,
        refundedAmount,
        netRevenue,
        verifiedPurchasesCount,
        totalOrdersCount,
        upcomingConsultationsCount,
        openSupportTicketsCount,
      },
      growthTimeline,
      recentActivity: recentActivityLogs.map((log) => ({
        id: log._id.toString(),
        action: log.action,
        resourceType: log.resourceType,
        timestamp: log.timestamp || log.createdAt,
        actor: log.actorId
          ? {
              name: `${log.actorId.firstName || ''} ${log.actorId.lastName || ''}`.trim() || 'System',
              email: log.actorId.email,
              role: log.actorId.role,
            }
          : { name: 'System', email: 'system@vstudyonline.internal', role: 'SYSTEM' },
      })),
      upcomingConsultations: upcomingConsultationsList.map((c) => ({
        id: c._id.toString(),
        startTime: c.startTime,
        durationMinutes: c.durationMinutes || 45,
        status: c.status,
        fee: c.fee || 0,
        currency: c.currency || 'INR',
        student: c.userId
          ? {
              name: `${c.userId.firstName || ''} ${c.userId.lastName || ''}`.trim() || 'Student',
              email: c.userId.email,
              avatar: c.userId.profilePhoto || null,
            }
          : { name: 'Unknown Student', email: '', avatar: null },
        instructor: c.instructorId
          ? {
              name: `${c.instructorId.firstName || ''} ${c.instructorId.lastName || ''}`.trim() || 'Instructor',
              email: c.instructorId.email,
              avatar: c.instructorId.profilePhoto || null,
            }
          : { name: 'Unknown Instructor', email: '', avatar: null },
      })),
    };
  }

  /**
   * Page 2: Student Management
   */
  static async getStudents({ search, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    const filter = { role: ROLES.STUDENT };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.$or = [
        { firstName: new RegExp(search.trim(), 'i') },
        { lastName: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [students, total] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .select('-passwordHash -refreshTokenHash')
        .lean(),
      User.countDocuments(filter),
    ]);

    // Aggregate course counts & purchases for these students
    const studentIds = students.map((s) => s._id);
    const ordersAgg = await Order.aggregate([
      {
        $match: {
          userId: { $in: studentIds },
          orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$finalAmount' },
          coursesCount: { $sum: { $size: { $ifNull: ['$items', []] } } },
        },
      },
    ]);

    const formatted = students.map((s) => {
      const agg = ordersAgg.find((o) => o._id.toString() === s._id.toString());
      return {
        id: s._id.toString(),
        name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student',
        email: s.email,
        phone: s.phone || 'N/A',
        status: s.status,
        country: s.country || 'N/A',
        registeredOn: s.createdAt,
        coursesCount: agg?.coursesCount || 0,
        totalSpent: agg?.totalSpent || 0,
        currency: 'INR',
      };
    });

    return {
      students: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async getStudentById(id) {
    const student = await User.findOne({ _id: id, role: ROLES.STUDENT })
      .select('-passwordHash -refreshTokenHash')
      .lean();
    if (!student) throw new AppError('Student not found.', 404);

    const [orders, consultations] = await Promise.all([
      Order.find({ userId: id }).sort({ createdAt: -1 }).lean(),
      Booking.find({ userId: id })
        .sort({ startTime: -1 })
        .populate('instructorId', 'firstName lastName email profilePhoto')
        .lean(),
    ]);

    return {
      student,
      orders,
      consultations,
    };
  }

  static async updateStudentStatus(id, { status, reason }, adminUser) {
    if (![USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.INACTIVE].includes(status)) {
      throw new AppError('Invalid account status.', 400);
    }

    const student = await User.findOne({ _id: id, role: ROLES.STUDENT });
    if (!student) throw new AppError('Student not found.', 404);

    const oldStatus = student.status;
    student.status = status;
    await student.save();

    await AuditLogger.log({
      actorId: adminUser.userId,
      action: status === USER_STATUS.SUSPENDED ? 'STUDENT_SUSPENDED' : 'STUDENT_REACTIVATED',
      resourceType: 'USER',
      resourceId: student._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status, reason },
    });

    return {
      id: student._id.toString(),
      status: student.status,
      message: `Student account successfully ${status.toLowerCase()}.`,
    };
  }

  /**
   * Page 3: Instructor Management (Routine view & status, Super Admin retains verification authority)
   */
  static async getInstructors({ search, status, page = 1, limit = 10 } = {}) {
    const filter = { role: ROLES.INSTRUCTOR };
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (search && search.trim()) {
      filter.$or = [
        { firstName: new RegExp(search.trim(), 'i') },
        { lastName: new RegExp(search.trim(), 'i') },
        { email: new RegExp(search.trim(), 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [instructors, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-passwordHash -refreshTokenHash')
        .lean(),
      User.countDocuments(filter),
    ]);

    const instructorUserIds = instructors.map((i) => i._id);
    const [profiles, coursesAgg] = await Promise.all([
      InstructorProfile.find({ userId: { $in: instructorUserIds } }).lean(),
      Course.aggregate([
        { $match: { instructorId: { $in: instructorUserIds } } },
        { $group: { _id: '$instructorId', count: { $sum: 1 } } },
      ]),
    ]);

    const formatted = instructors.map((ins) => {
      const prof = profiles.find((p) => p.userId.toString() === ins._id.toString());
      const cAgg = coursesAgg.find((c) => c._id.toString() === ins._id.toString());

      return {
        id: ins._id.toString(),
        name: `${ins.firstName || ''} ${ins.lastName || ''}`.trim() || 'Instructor',
        email: ins.email,
        title: prof?.headline || prof?.bio?.slice(0, 40) || 'Instructor',
        expertise: prof?.expertise || prof?.skills || ['Engineering'],
        organization: prof?.institution || prof?.currentCompany || 'VStudyOnline Community',
        registeredOn: ins.createdAt,
        isVerified: prof?.isVerified || false,
        verificationStatus: prof?.verificationStatus || (prof?.isVerified ? 'APPROVED' : 'PENDING'),
        status: ins.status,
        coursesCount: cAgg?.count || 0,
      };
    });

    return {
      instructors: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async getInstructorById(id) {
    const instructor = await User.findOne({ _id: id, role: ROLES.INSTRUCTOR })
      .select('-passwordHash -refreshTokenHash')
      .lean();
    if (!instructor) throw new AppError('Instructor not found.', 404);

    const [profile, courses, consultations] = await Promise.all([
      InstructorProfile.findOne({ userId: id }).lean(),
      Course.find({ instructorId: id }).lean(),
      Booking.find({ instructorId: id }).sort({ startTime: -1 }).limit(20).lean(),
    ]);

    return {
      instructor,
      profile,
      courses,
      consultations,
    };
  }

  static async updateInstructorStatus(id, { status, reason }, adminUser) {
    if (![USER_STATUS.ACTIVE, USER_STATUS.SUSPENDED, USER_STATUS.INACTIVE].includes(status)) {
      throw new AppError('Invalid account status.', 400);
    }

    const instructor = await User.findOne({ _id: id, role: ROLES.INSTRUCTOR });
    if (!instructor) throw new AppError('Instructor not found.', 404);

    const oldStatus = instructor.status;
    instructor.status = status;
    await instructor.save();

    await AuditLogger.log({
      actorId: adminUser.userId,
      action: status === USER_STATUS.SUSPENDED ? 'INSTRUCTOR_SUSPENDED' : 'INSTRUCTOR_REACTIVATED',
      resourceType: 'USER',
      resourceId: instructor._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status, reason },
    });

    return {
      id: instructor._id.toString(),
      status: instructor.status,
      message: `Instructor account status updated to ${status}.`,
    };
  }

  /**
   * Page 4: Course Management
   */
  static async getCourses({ search, status, category, page = 1, limit = 10 } = {}) {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (search && search.trim()) {
      filter.$or = [
        { title: new RegExp(search.trim(), 'i') },
        { description: new RegExp(search.trim(), 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('instructorId', 'firstName lastName email profilePhoto')
        .lean(),
      Course.countDocuments(filter),
    ]);

    // Aggregate enrollments count from OrderItems
    const courseIds = courses.map((c) => c._id);
    const enrollmentsAgg = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.COMPLETED] },
          'items.productId': { $in: courseIds },
        },
      },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $in: courseIds } } },
      { $group: { _id: '$items.productId', enrollments: { $sum: 1 } } },
    ]);

    const formatted = courses.map((c) => {
      const eAgg = enrollmentsAgg.find((e) => e._id.toString() === c._id.toString());
      return {
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        thumbnail: c.thumbnail || null,
        instructor: c.instructorId
          ? {
              name: `${c.instructorId.firstName || ''} ${c.instructorId.lastName || ''}`.trim() || 'Instructor',
              email: c.instructorId.email,
            }
          : { name: 'Staff Instructor', email: '' },
        category: c.category || 'General',
        price: c.price || 0,
        currency: c.currency || 'INR',
        status: c.status,
        enrollments: eAgg?.enrollments || c.studentsCount || 0,
        createdAt: c.createdAt,
      };
    });

    return {
      courses: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async updateCourseStatus(id, { status }, adminUser) {
    if (!['PUBLISHED', 'DRAFT', 'ARCHIVED', 'UNPUBLISHED'].includes(status)) {
      throw new AppError('Invalid course status.', 400);
    }

    const course = await Course.findById(id);
    if (!course) throw new AppError('Course not found.', 404);

    const oldStatus = course.status;
    course.status = status;
    await course.save();

    await AuditLogger.log({
      actorId: adminUser.userId,
      action: 'COURSE_STATUS_UPDATED',
      resourceType: 'COURSE',
      resourceId: course._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status },
    });

    if (['PUBLISHED', 'ACTIVE'].includes((course.status || '').toUpperCase())) {
      await LearningPathService.syncCourseWithLearningPath(course).catch((err) =>
        console.error('[LearningPathSync] Error in admin updateCourseStatus:', err)
      );
    }

    return {
      id: course._id.toString(),
      status: course.status,
      message: `Course status updated to ${status}.`,
    };
  }

  /**
   * Page 5: Payments & Purchases
   * Authoritative transaction ledger using verified Cashfree records
   */
  static async getPayments({ search, status, page = 1, limit = 10, startDate, endDate } = {}) {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email')
        .populate('orderId')
        .lean(),
      Payment.countDocuments(filter),
    ]);

    const formatted = payments.map((p) => {
      const order = p.orderId;
      const firstItem = order?.items?.[0];
      const productTitle = firstItem?.title || firstItem?.productTitle || 'Learning Product';

      return {
        id: p._id.toString(),
        orderId: order?.orderId || p.providerOrderId || p._id.toString(),
        cashfreeReference: p.providerPaymentId || p.transactionReference || 'N/A',
        student: p.userId
          ? {
              name: `${p.userId.firstName || ''} ${p.userId.lastName || ''}`.trim() || 'Student',
              email: p.userId.email,
            }
          : { name: 'Customer', email: 'N/A' },
        course: productTitle,
        amount: p.amount || 0,
        currency: p.currency || 'INR',
        paymentMethod: p.paymentMethod || 'Online (Cashfree Gateway)',
        status: p.status,
        date: p.paidAt || p.createdAt,
      };
    });

    return {
      payments: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Page 6: Consultation Management (1-on-1 Mentorship Bookings)
   */
  static async getConsultations({ search, status, page = 1, limit = 10 } = {}) {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email profilePhoto')
        .populate('instructorId', 'firstName lastName email profilePhoto')
        .lean(),
      Booking.countDocuments(filter),
    ]);

    const formatted = bookings.map((b) => ({
      id: b._id.toString(),
      bookingId: b._id.toString().slice(-6).toUpperCase(),
      student: b.userId
        ? {
            name: `${b.userId.firstName || ''} ${b.userId.lastName || ''}`.trim() || 'Student',
            email: b.userId.email,
          }
        : { name: 'Student', email: '' },
      instructor: b.instructorId
        ? {
            name: `${b.instructorId.firstName || ''} ${b.instructorId.lastName || ''}`.trim() || 'Instructor',
            email: b.instructorId.email,
          }
        : { name: 'Instructor', email: '' },
      date: b.startTime,
      duration: `${b.durationMinutes || 45} min`,
      fee: b.fee || 0,
      currency: b.currency || 'INR',
      status: b.status,
      paymentStatus: b.paymentStatus || 'FREE',
    }));

    return {
      consultations: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Page 7: Support & Complaints (Support Tickets)
   */
  static async getSupportTickets({ search, status, priority, page = 1, limit = 10 } = {}) {
    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (priority && priority !== 'ALL') {
      filter.priority = priority;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email role')
        .populate('assignedTo', 'firstName lastName email')
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    const formatted = tickets.map((t) => ({
      id: t._id.toString(),
      ticketId: t.ticketId || `SUP-${t._id.toString().slice(-4).toUpperCase()}`,
      raisedBy: t.userId
        ? {
            name: `${t.userId.firstName || ''} ${t.userId.lastName || ''}`.trim() || 'User',
            email: t.userId.email,
            role: t.userId.role,
          }
        : { name: 'User', email: '', role: 'STUDENT' },
      category: t.category || 'General',
      subject: t.subject,
      description: t.description,
      priority: t.priority || 'MEDIUM',
      status: t.status || 'OPEN',
      assignedTo: t.assignedTo
        ? `${t.assignedTo.firstName || ''} ${t.assignedTo.lastName || ''}`.trim()
        : 'Unassigned',
      createdAt: t.createdAt,
    }));

    return {
      tickets: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  static async updateSupportTicket(id, { status, priority, assignedTo }, adminUser) {
    const ticket = await SupportTicket.findById(id);
    if (!ticket) throw new AppError('Support ticket not found.', 404);

    const oldStatus = ticket.status;
    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assignedTo && mongoose.isValidObjectId(assignedTo)) ticket.assignedTo = assignedTo;

    if (status === 'RESOLVED') ticket.resolvedAt = new Date();
    await ticket.save();

    await AuditLogger.log({
      actorId: adminUser.userId,
      action: 'SUPPORT_TICKET_UPDATED',
      resourceType: 'SUPPORT_TICKET',
      resourceId: ticket._id.toString(),
      oldValue: { status: oldStatus },
      newValue: { status: ticket.status, priority: ticket.priority },
    });

    return {
      id: ticket._id.toString(),
      status: ticket.status,
      message: 'Support ticket updated successfully.',
    };
  }

  /**
   * Page 8: Reports & Analytics
   */
  static async getReports({ range = '30d' } = {}) {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [
      totalStudents,
      totalInstructors,
      totalCourses,
      grossRevenueAgg,
      refundsAgg,
      consultationsCount,
      categoryEnrollmentsAgg,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.INSTRUCTOR }),
      Course.countDocuments({ status: 'PUBLISHED' }),
      Payment.aggregate([
        { $match: { status: PAYMENT_STATUS.SUCCESS, createdAt: { $gte: sinceDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Refund.aggregate([
        { $match: { status: { $in: ['PROCESSED', 'SUCCESS'] }, createdAt: { $gte: sinceDate } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Booking.countDocuments({ createdAt: { $gte: sinceDate } }),
      Course.aggregate([
        { $group: { _id: { $ifNull: ['$category', 'General'] }, count: { $sum: 1 } } },
      ]),
    ]);

    const gross = grossRevenueAgg[0]?.total || 0;
    const refunded = refundsAgg[0]?.total || 0;

    return {
      overview: {
        totalStudents,
        totalInstructors,
        totalCourses,
        grossRevenue: gross,
        netRevenue: Math.max(0, gross - refunded),
        consultationsCount,
      },
      categoryBreakdown: categoryEnrollmentsAgg.map((c) => ({
        category: c._id,
        count: c.count,
      })),
    };
  }

  /**
   * Page 9: Notifications & Delivery Monitoring
   */
  static async getNotifications({ page = 1, limit = 15 } = {}) {
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total] = await Promise.all([
      Notification.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('userId', 'firstName lastName email')
        .lean(),
      Notification.countDocuments(),
    ]);

    const formatted = notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type || 'SYSTEM',
      recipient: n.userId?.email || 'System Recipient',
      recipientName: `${n.userId?.firstName || ''} ${n.userId?.lastName || ''}`.trim() || 'User',
      title: n.title,
      message: n.message,
      status: n.status || (n.isRead ? 'Delivered' : 'Sent'),
      createdAt: n.createdAt,
    }));

    return {
      notifications: formatted,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  }

  /**
   * Page 10: Admin Settings (Own Account Profile)
   */
  static async getAdminProfile(adminUserId) {
    const user = await User.findById(adminUserId)
      .select('-passwordHash -refreshTokenHash')
      .lean();
    if (!user) throw new AppError('Admin account not found.', 404);

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.department || 'Operations',
      adminPermissions: user.adminPermissions || [],
      phone: user.phone || '',
      profilePhoto: user.profilePhoto || null,
      createdAt: user.createdAt,
    };
  }

  static async updateAdminProfile(adminUserId, { firstName, lastName, phone, profilePhoto }) {
    const user = await User.findById(adminUserId);
    if (!user) throw new AppError('Admin account not found.', 404);

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      department: user.department,
      adminPermissions: user.adminPermissions,
      message: 'Profile updated successfully.',
    };
  }
}
