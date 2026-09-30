import { User } from '../../models/index.js';
import { AppError } from '../../utils/apiResponse.js';
import { AuditLogger } from '../../utils/auditLogger.js';

export class UsersService {
  /**
   * Retrieve current authenticated user profile
   */
  static async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  /**
   * Safely update profile with strict whitelist filtering
   */
  static async updateProfile(userId, updateData) {
    // Whitelisted editable profile fields
    const allowedFields = [
      'firstName',
      'lastName',
      'phone',
      'profilePhoto',
      'country',
      'state',
      'city',
      'timezone',
      'preferredLanguage',
      'learningPreferences',
      'qualification',
      'institution',
      'graduationYear',
      'skills',
      'interests',
    ];

    const safeUpdates = {};
    for (const key of allowedFields) {
      if (key in updateData) {
        safeUpdates[key] = updateData[key];
      }
    }

    // Check if client attempted to alter privileged fields
    const privilegedFields = [
      'role',
      'status',
      'email',
      'passwordHash',
      'emailVerified',
      'verificationToken',
      'passwordResetToken',
      'passwordResetExpires',
      'refreshTokenHash',
    ];

    const attemptedPrivileged = privilegedFields.filter((field) => field in updateData);
    if (attemptedPrivileged.length > 0) {
      await AuditLogger.log({
        actorId: userId,
        action: 'PRIVILEGED_FIELD_UPDATE_ATTEMPT_BLOCKED',
        resourceType: 'USER',
        resourceId: userId.toString(),
        newValue: { blockedFields: attemptedPrivileged },
      });
    }

    const user = await User.findByIdAndUpdate(userId, safeUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    return user;
  }
}
