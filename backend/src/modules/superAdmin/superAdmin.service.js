import mongoose from 'mongoose';
import { User, Course, Order, AuditLog } from '../../models/index.js';
import { ROLES } from '../../config/constants.js';

export class SuperAdminService {
  /**
   * Get Super Admin foundation system status & platform counts
   */
  static async getSystemStatus(currentAdminId) {
    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalAdmins,
      totalCourses,
      totalOrders,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.INSTRUCTOR }),
      User.countDocuments({ role: { $in: [ROLES.ADMIN, ROLES.SUPER_ADMIN] } }),
      Course.countDocuments(),
      Order.countDocuments(),
      AuditLog.find().sort({ timestamp: -1 }).limit(10),
    ]);

    return {
      governanceStatus: 'ACTIVE',
      database: {
        name: mongoose.connection.db.databaseName,
        status: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      },
      counts: {
        users: totalUsers,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
        courses: totalCourses,
        orders: totalOrders,
      },
      recentActivity: recentAuditLogs,
      authenticatedSuperAdmin: currentAdminId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Retrieve paginated audit logs for security observability
   */
  static async getAuditLogs({ page = 1, limit = 20, action, resourceType }) {
    const filter = {};
    if (action) filter.action = action;
    if (resourceType) filter.resourceType = resourceType;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'firstName lastName email role'),
      AuditLog.countDocuments(filter),
    ]);

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Real-time query of platform users, students, and instructors
   */
  static async getUsersList({
    role,
    search,
    status,
    page = 1,
    limit = 50,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const query = {};

    if (role && role !== 'ALL') {
      query.role = role.toUpperCase();
    }

    if (status && status !== 'ALL') {
      query.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [users, total, totalAll, totalStudents, totalInstructors, totalAdmins, totalSuperAdmins] =
      await Promise.all([
        User.find(query)
          .select('-passwordHash -refreshTokenHash -verificationToken -passwordResetToken')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit, 10))
          .lean(),
        User.countDocuments(query),
        User.countDocuments(),
        User.countDocuments({ role: ROLES.STUDENT }),
        User.countDocuments({ role: ROLES.INSTRUCTOR }),
        User.countDocuments({ role: ROLES.ADMIN }),
        User.countDocuments({ role: ROLES.SUPER_ADMIN }),
      ]);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
      counts: {
        all: totalAll,
        students: totalStudents,
        instructors: totalInstructors,
        admins: totalAdmins,
        superAdmins: totalSuperAdmins,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Real-time update of user status or role by Super Admin
   */
  static async updateUserStatus(userId, { status, role }) {
    const updateData = {};
    if (status) updateData.status = status;
    if (role) updateData.role = role;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select('-passwordHash -refreshTokenHash');

    return user;
  }
}

