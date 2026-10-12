import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/apiResponse.js';
import { User } from '../models/index.js';
import { getFirebaseAuth } from '../config/firebase.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in.', 401));
    }

    // 1. Try legacy JWT token verification first
    let isLocalJwt = false;
    let decoded = null;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
      isLocalJwt = true;
    } catch (jwtErr) {
      // If not a valid local JWT, fall through to Firebase verification
    }

    if (isLocalJwt && decoded?.userId) {
      const user = await User.findById(decoded.userId).select('status role email firebaseUid');
      if (!user) {
        return next(new AppError('User account not found.', 401));
      }
      if (user.status !== 'ACTIVE') {
        return next(new AppError(`Account is ${user.status ? user.status.toLowerCase() : 'inactive'}. Access revoked.`, 403));
      }
      req.user = {
        userId: user._id.toString(),
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
      };
      return next();
    }

    // 2. Try Firebase ID Token verification
    try {
      const auth = getFirebaseAuth();
      const decodedFirebase = await auth.verifyIdToken(token);

      // Find authoritative MongoDB user by firebaseUid or verified email
      let user = await User.findOne({
        $or: [
          { firebaseUid: decodedFirebase.uid },
          { email: (decodedFirebase.email || '').toLowerCase() },
        ],
      });

      if (!user) {
        return next(new AppError('User account not found for this Firebase identity.', 401));
      }

      if (user.status !== 'ACTIVE') {
        return next(new AppError(`Account is ${user.status ? user.status.toLowerCase() : 'inactive'}. Access revoked.`, 403));
      }

      // Link firebaseUid if not set
      if (!user.firebaseUid) {
        user.firebaseUid = decodedFirebase.uid;
        await user.save();
      }

      req.user = {
        userId: user._id.toString(),
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        status: user.status,
        firebaseUid: user.firebaseUid,
      };

      return next();
    } catch (fbErr) {
      return next(new AppError('Invalid or expired authentication token.', 401));
    }
  } catch (error) {
    return next(new AppError('Invalid authentication token.', 401));
  }
}

export async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      // 1. Try local JWT
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.userId).select('status role email firebaseUid');
        if (user && user.status === 'ACTIVE') {
          req.user = {
            userId: user._id.toString(),
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            status: user.status,
          };
          return next();
        }
      } catch (e) {}

      // 2. Try Firebase ID Token
      try {
        const auth = getFirebaseAuth();
        const decodedFirebase = await auth.verifyIdToken(token);
        const user = await User.findOne({
          $or: [
            { firebaseUid: decodedFirebase.uid },
            { email: (decodedFirebase.email || '').toLowerCase() },
          ],
        });
        if (user && user.status === 'ACTIVE') {
          req.user = {
            userId: user._id.toString(),
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            status: user.status,
            firebaseUid: user.firebaseUid,
          };
        }
      } catch (e) {}
    }
  } catch (error) {
    // Silently continue for optional auth
  }
  return next();
}

/**
 * Role-Based Access Control middleware export
 * Supports either array `authorizeRole(['INSTRUCTOR', 'SUPER_ADMIN'])`
 * or spread arguments `authorizeRole('INSTRUCTOR', 'SUPER_ADMIN')`
 */
export function authorizeRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new AppError('Authentication required. Unauthorized access.', 401));
    }
    if (!allowed.includes(req.user.role)) {
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

export const authorize = authorizeRole;
