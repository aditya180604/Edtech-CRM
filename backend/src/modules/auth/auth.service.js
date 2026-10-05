import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User, InstructorProfile } from '../../models/index.js';
import { config } from '../../config/env.js';
import { AppError } from '../../utils/apiResponse.js';
import { ROLES, USER_STATUS } from '../../config/constants.js';
import { AuditLogger } from '../../utils/auditLogger.js';

export class AuthService {
  /**
   * Helper to hash a token with SHA-256 for secure DB storage
   */
  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generate JWT Access Token and Refresh Token with cryptographic JTI
   */
  static generateTokens(user) {
    const jti = crypto.randomBytes(16).toString('hex');

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshToken = jwt.sign({ ...payload, jti }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Public Registration — Strictly restricted to STUDENT and INSTRUCTOR roles
   */
  static async register({
    firstName,
    lastName,
    email,
    phone,
    password,
    role = ROLES.STUDENT,
  }) {
    // 1. Enforce Role Restriction: Block ADMIN and SUPER_ADMIN public registration
    if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
      await AuditLogger.log({
        action: 'PUBLIC_ADMIN_REGISTRATION_REJECTED',
        resourceType: 'AUTH',
        newValue: { attemptedRole: role, email },
      });
      throw new AppError(
        'Public registration is restricted to STUDENT and INSTRUCTOR roles only.',
        400
      );
    }

    if (![ROLES.STUDENT, ROLES.INSTRUCTOR].includes(role)) {
      throw new AppError('Invalid user role specified.', 400);
    }

    // 2. Validate email uniqueness
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 400);
    }

    // 3. Hash password with bcrypt
    const passwordHash = await User.hashPassword(password);

    // 4. Generate email verification token (stored as SHA-256 hash)
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    const verificationToken = this.hashToken(rawVerifyToken);

    // 5. Create user record
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      passwordHash,
      role,
      status: USER_STATUS.ACTIVE,
      emailVerified: false,
      verificationToken,
    });

    // 6. If registered as instructor, initialize instructor profile
    if (role === ROLES.INSTRUCTOR) {
      await InstructorProfile.create({
        userId: user._id,
        bio: '',
        skills: [],
        expertise: [],
        isCompleted: false,
      });
    }

    // 7. Issue session tokens and store hashed refresh token for rotation
    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshTokenHash = this.hashToken(refreshToken);
    await user.save();

    await AuditLogger.log({
      actorId: user._id,
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: user._id.toString(),
      newValue: { email: user.email, role: user.role },
    });

    const userPayload = await this.formatUserPayload(user);

    return {
      user: userPayload,
      accessToken,
      refreshToken,
    };
  }

  static async formatUserPayload(user) {
    let isProfileCompleted = user.isProfileCompleted || false;
    let instructorProfile = null;

    if (user.role === ROLES.INSTRUCTOR) {
      instructorProfile = await InstructorProfile.findOne({ userId: user._id }).lean();
      if (
        instructorProfile?.isCompleted ||
        (instructorProfile?.bio && instructorProfile?.workExperience && instructorProfile?.expertise?.length > 0)
      ) {
        isProfileCompleted = true;
      }
    } else {
      isProfileCompleted = true;
    }

    return {
      _id: user._id,
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      email: user.email,
      role: user.role,
      status: user.status,
      profilePhoto: user.profilePhoto || instructorProfile?.profilePhoto || null,
      isProfileCompleted,
      instructorProfile: instructorProfile || undefined,
    };
  }

  /**
   * Universal Login for all roles (STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN)
   */
  static async login({ email, password, ipAddress = null, userAgent = null }) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +refreshTokenHash');

    if (!user) {
      await AuditLogger.log({
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        newValue: { email: normalizedEmail, reason: 'USER_NOT_FOUND' },
        ipAddress,
        userAgent,
      });
      throw new AppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await AuditLogger.log({
        actorId: user._id,
        action: 'LOGIN_FAILED',
        resourceType: 'AUTH',
        newValue: { email: normalizedEmail, reason: 'INVALID_PASSWORD' },
        ipAddress,
        userAgent,
      });
      throw new AppError('Invalid email or password.', 401);
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new AppError(`Account is ${user.status.toLowerCase()}. Please contact support.`, 403);
    }

    // Issue tokens and rotate refresh token hash
    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshTokenHash = this.hashToken(refreshToken);
    user.lastLoginAt = new Date();
    await user.save();

    // Audit login with dedicated event for Super Admin
    const loginAction = user.role === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN_LOGIN' : 'USER_LOGIN';
    await AuditLogger.log({
      actorId: user._id,
      action: loginAction,
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      newValue: { email: user.email, role: user.role },
      ipAddress,
      userAgent,
    });

    const userPayload = await this.formatUserPayload(user);

    return {
      user: userPayload,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Get Current Authenticated User profile
   */
  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw new AppError('User not found or inactive.', 404);
    }
    return await this.formatUserPayload(user);
  }

  /**
   * Single-Use Refresh Token Rotation & Invalidation
   */
  static async refreshToken(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw new AppError('Refresh token required.', 400);
    }

    try {
      const decoded = jwt.verify(incomingRefreshToken, config.jwt.refreshSecret);
      const user = await User.findById(decoded.userId).select(
        '+refreshTokenHash +previousRefreshTokenHash +refreshTokenRotatedAt +previousRefreshTokenExpiresAt'
      );

      if (!user || user.status !== USER_STATUS.ACTIVE) {
        throw new AppError('User not found or inactive.', 401);
      }

      // Check against stored token hash or recent grace-window rotated hash (30s)
      const incomingHash = this.hashToken(incomingRefreshToken);
      const isCurrentMatch = user.refreshTokenHash && user.refreshTokenHash === incomingHash;
      const isGracePeriodMatch =
        user.previousRefreshTokenHash &&
        user.previousRefreshTokenHash === incomingHash &&
        ((user.refreshTokenRotatedAt && Date.now() - new Date(user.refreshTokenRotatedAt).getTime() < 30000) ||
          (user.previousRefreshTokenExpiresAt && new Date(user.previousRefreshTokenExpiresAt) > new Date()));

      if (!isCurrentMatch && !isGracePeriodMatch) {
        // Token reuse or revoked session detected: revoke session completely
        user.refreshTokenHash = undefined;
        user.previousRefreshTokenHash = undefined;
        user.refreshTokenRotatedAt = undefined;
        user.previousRefreshTokenExpiresAt = undefined;
        await user.save();

        await AuditLogger.log({
          actorId: user._id,
          action: 'REFRESH_TOKEN_REUSE_DETECTED',
          resourceType: 'AUTH',
          resourceId: user._id.toString(),
        });

        throw new AppError('Invalid or expired refresh token. Please log in again.', 401);
      }

      // Rotate: Issue new token pair and update history with 30s grace window
      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);
      user.previousRefreshTokenHash = user.refreshTokenHash || incomingHash;
      user.previousRefreshTokenExpiresAt = new Date(Date.now() + 30000);
      user.refreshTokenHash = this.hashToken(newRefreshToken);
      user.refreshTokenRotatedAt = new Date();
      await user.save();

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid or expired refresh token.', 401);
    }
  }

  /**
   * Logout and invalidate active session
   */
  static async logout(userId) {
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        user.refreshTokenHash = undefined;
        await user.save();

        const logoutAction = user.role === ROLES.SUPER_ADMIN ? 'SUPER_ADMIN_LOGOUT' : 'USER_LOGOUT';
        await AuditLogger.log({
          actorId: user._id,
          action: logoutAction,
          resourceType: 'AUTH',
          resourceId: user._id.toString(),
        });
      }
    }
  }

  /**
   * Firebase Authentication Sync (Email/Password & Google Sign In)
   * Verifies Firebase ID Token, links existing MongoDB user or registers new Student
   */
  static async firebaseSync({ idToken }) {
    if (!idToken) {
      throw new AppError('Firebase ID Token is required.', 400);
    }

    const { getFirebaseAuth } = await import('../../config/firebase.js');
    const auth = getFirebaseAuth();

    let decoded;
    try {
      decoded = await auth.verifyIdToken(idToken);
    } catch (err) {
      throw new AppError(`Invalid or expired Firebase ID Token: ${err.message}`, 401);
    }

    const { uid, email, name, picture, email_verified } = decoded;

    if (!email) {
      throw new AppError('Firebase account must have a verified email address.', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Look for existing user by firebaseUid OR by email
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: normalizedEmail }],
    });

    let isNewUser = false;

    if (user) {
      // Existing user: Link firebaseUid if not set, update profile picture if missing
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
      }
      if (email_verified && !user.emailVerified) {
        user.emailVerified = true;
      }
      if (!user.profilePhoto && picture) {
        user.profilePhoto = picture;
      }
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // New user: Create user strictly with role = STUDENT (Plan Section 6 & 10)
      isNewUser = true;

      let firstName = 'User';
      let lastName = '';

      if (name) {
        const parts = name.trim().split(' ');
        firstName = parts[0] || 'User';
        lastName = parts.slice(1).join(' ') || '';
      }

      user = await User.create({
        firebaseUid: uid,
        email: normalizedEmail,
        firstName,
        lastName,
        profilePhoto: picture || null,
        role: ROLES.STUDENT, // Strictly STUDENT
        status: USER_STATUS.ACTIVE,
        emailVerified: !!email_verified,
        lastLoginAt: new Date(),
      });
    }

    // Generate app tokens for backwards compatibility and sessions
    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshTokenHash = this.hashToken(refreshToken);
    user.refreshTokenRotatedAt = new Date();
    await user.save();

    await AuditLogger.log({
      actorId: user._id,
      action: isNewUser ? 'FIREBASE_REGISTER' : 'FIREBASE_LOGIN',
      resourceType: 'AUTH',
      resourceId: user._id.toString(),
      newValue: { email: user.email, role: user.role, firebaseUid: uid },
    });

    return {
      user: {
        _id: user._id,
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profilePhoto: user.profilePhoto,
        emailVerified: user.emailVerified,
        isProfileCompleted: user.isProfileCompleted,
        skills: user.skills || [],
        interests: user.interests || [],
        firebaseUid: user.firebaseUid,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
      refreshToken,
      isNewUser,
    };
  }
}
