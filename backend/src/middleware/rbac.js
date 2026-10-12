import { ROLES } from '../config/constants.js';
import { AppError } from '../utils/apiResponse.js';
import { AuditLogger } from '../utils/auditLogger.js';

/**
 * Role-Based Access Control middleware.
 * Accepts one or more allowed roles.
 */
export function authorize(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication required. Unauthorized access.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      // Audit security-sensitive unauthorized access attempts on privileged routes
      if (allowedRoles.includes(ROLES.SUPER_ADMIN) || allowedRoles.includes(ROLES.ADMIN)) {
        await AuditLogger.log({
          actorId: req.user.userId,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          resourceType: 'ROUTE',
          resourceId: req.originalUrl,
          newValue: {
            userRole: req.user.role,
            requiredRoles: allowedRoles,
            method: req.method,
          },
          ipAddress: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent'),
        });
      }

      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
}

/**
 * Super Admin only authorization guard
 */
export const authorizeSuperAdmin = authorize(ROLES.SUPER_ADMIN);

/**
 * Admin & Super Admin authorization guard
 */
export const authorizeAdmin = authorize(ROLES.ADMIN, ROLES.SUPER_ADMIN);

/**
 * Granular Permission Guard:
 * - SUPER_ADMIN always has full access.
 * - ADMIN must possess the specific required permission in their user record.
 */
export function requirePermission(permission) {
  return async (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication required. Unauthorized access.', 401));
    }

    // Super Admin retains universal operational authority
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Must be at least ADMIN
    if (req.user.role !== ROLES.ADMIN) {
      return next(
        new AppError(
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    // Check granular permissions
    const userPermissions = Array.isArray(req.user.adminPermissions)
      ? req.user.adminPermissions
      : [];

    if (!userPermissions.includes(permission)) {
      await AuditLogger.log({
        actorId: req.user.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'PERMISSION',
        resourceId: permission,
        newValue: {
          assignedPermissions: userPermissions,
          requiredPermission: permission,
          endpoint: req.originalUrl,
          method: req.method,
        },
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('User-Agent'),
      });

      return next(
        new AppError(
          `Permission denied. Missing required permission '${permission}'.`,
          403
        )
      );
    }

    next();
  };
}

/**
 * Instructor only authorization guard
 */
export const authorizeInstructor = authorize(ROLES.INSTRUCTOR);

/**
 * Flexible authorizeRole alias that accepts array or spread arguments
 */
export const authorizeRole = (...roles) => authorize(...roles.flat());
