import { AppError } from '../../utils/apiResponse.js';
import { ROLES } from '../../config/constants.js';

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+=\-[\]{};:'",.<>~`/\\|])[A-Za-z\d@$!%*?&#^()_+=\-[\]{};:'",.<>~`/\\|]{8,128}$/;
export const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;
export const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

export class AuthValidator {
  static validateRegister(req, res, next) {
    let { firstName, lastName, fullName, name, email, phone, password, role } = req.body;

    // Support combined name fields
    if (!firstName && (fullName || name)) {
      const combined = (fullName || name).trim();
      const parts = combined.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
      req.body.firstName = firstName;
      req.body.lastName = lastName;
    }

    // 1. First Name Validation
    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      return next(new AppError('First name is required.', 400));
    }
    firstName = firstName.trim();
    if (firstName.length < 2 || firstName.length > 50) {
      return next(new AppError('First name must be between 2 and 50 characters.', 400));
    }
    if (!NAME_REGEX.test(firstName)) {
      return next(new AppError('First name can only contain letters, hyphens, and apostrophes.', 400));
    }

    // 2. Last Name Validation (if provided)
    if (lastName && typeof lastName === 'string') {
      lastName = lastName.trim();
      if (lastName.length > 50) {
        return next(new AppError('Last name cannot exceed 50 characters.', 400));
      }
      if (lastName.length > 0 && !NAME_REGEX.test(lastName)) {
        return next(new AppError('Last name can only contain letters, hyphens, and apostrophes.', 400));
      }
    }

    // 3. Email Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new AppError('Email address is required.', 400));
    }
    email = email.trim();
    if (email.length > 100) {
      return next(new AppError('Email address cannot exceed 100 characters.', 400));
    }
    if (!EMAIL_REGEX.test(email)) {
      return next(new AppError('Please enter a valid email address (e.g. user@example.com).', 400));
    }

    // 4. Password Validation
    if (!password || typeof password !== 'string') {
      return next(new AppError('Password is required.', 400));
    }
    if (password.length < 8) {
      return next(new AppError('Password must be at least 8 characters long.', 400));
    }
    if (password.length > 128) {
      return next(new AppError('Password cannot exceed 128 characters.', 400));
    }
    if (!PASSWORD_REGEX.test(password)) {
      return next(
        new AppError(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
          400
        )
      );
    }

    // 5. Phone Validation (Optional)
    if (phone && typeof phone === 'string' && phone.trim()) {
      phone = phone.trim();
      const cleanedPhone = phone.replace(/[\s-]/g, '');
      if (!PHONE_REGEX.test(phone) || cleanedPhone.length < 10 || cleanedPhone.length > 15) {
        return next(new AppError('Please enter a valid phone number (10 to 15 digits).', 400));
      }
    }

    // 6. Role Validation
    if (role && ![ROLES.STUDENT, ROLES.INSTRUCTOR].includes(role)) {
      if (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) {
        return next(new AppError('Direct registration for Admin or Super Admin is prohibited.', 403));
      }
      return next(new AppError('Invalid role. Role must be STUDENT or INSTRUCTOR.', 400));
    }

    next();
  }

  static validateLogin(req, res, next) {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return next(new AppError('Email address is required.', 400));
    }
    if (!password || typeof password !== 'string') {
      return next(new AppError('Password is required.', 400));
    }

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return next(new AppError('Please enter a valid email address.', 400));
    }

    next();
  }

  static validateRefresh(req, res, next) {
    const incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingToken || typeof incomingToken !== 'string') {
      return next(new AppError('Refresh token required.', 400));
    }
    next();
  }
}
