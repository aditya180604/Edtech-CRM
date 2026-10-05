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
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        userId: decoded.userId,
        _id: decoded.userId,
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      return next();
    } catch (jwtErr) {
      // If not a valid local JWT, fall through to Firebase verification
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
        req.user = {
          userId: decoded.userId,
          _id: decoded.userId,
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
        return next();
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
        if (user) {
          req.user = {
            userId: user._id.toString(),
            _id: user._id.toString(),
            id: user._id.toString(),
            email: user.email,
            role: user.role,
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
