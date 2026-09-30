import { AuditLog } from '../models/index.js';

export class AuditLogger {
  /**
   * Log a security or business event to the existing audit_logs collection
   */
  static async log({
    actorId = null,
    action,
    resourceType,
    resourceId = null,
    oldValue = null,
    newValue = null,
    ipAddress = null,
    userAgent = null,
  }) {
    try {
      // Ensure sensitive secrets are never logged
      const sanitizedOldValue = this.sanitize(oldValue);
      const sanitizedNewValue = this.sanitize(newValue);

      await AuditLog.create({
        actorId,
        action,
        resourceType,
        resourceId,
        oldValue: sanitizedOldValue,
        newValue: sanitizedNewValue,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });
    } catch (error) {
      // Non-blocking: log server-side error so core flow is not interrupted
      console.error('[AuditLogger] Failed to write audit log:', error.message);
    }
  }

  static sanitize(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    const sensitiveKeys = [
      'password',
      'passwordHash',
      'refreshToken',
      'refreshTokenHash',
      'verificationToken',
      'passwordResetToken',
      'token',
      'secret',
    ];

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
