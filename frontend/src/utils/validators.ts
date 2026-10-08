export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const SPECIAL_CHAR_REGEX = /[@$!%*?&#^()_+=\-[\]{};:'",.<>~`/\\|]/;
export const NAME_REGEX = /^[a-zA-Z\s'-]{2,50}$/;
export const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

export interface PasswordStrength {
  score: number; // 0 to 4
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  rules: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export const getPasswordStrength = (password: string): PasswordStrength => {
  const rules = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: SPECIAL_CHAR_REGEX.test(password),
  };

  let satisfiedCount = 0;
  if (rules.minLength) satisfiedCount++;
  if (rules.hasUpper) satisfiedCount++;
  if (rules.hasLower) satisfiedCount++;
  if (rules.hasNumber) satisfiedCount++;
  if (rules.hasSpecial) satisfiedCount++;

  let score = 0;
  let label: PasswordStrength['label'] = 'Weak';
  let color = 'bg-red-500';

  if (password.length === 0) {
    score = 0;
    label = 'Weak';
    color = 'bg-slate-200';
  } else if (satisfiedCount <= 2 || !rules.minLength) {
    score = 1;
    label = 'Weak';
    color = 'bg-red-500';
  } else if (satisfiedCount === 3) {
    score = 2;
    label = 'Fair';
    color = 'bg-amber-500';
  } else if (satisfiedCount === 4) {
    score = 3;
    label = 'Good';
    color = 'bg-blue-500';
  } else {
    score = 4;
    label = 'Strong';
    color = 'bg-emerald-500';
  }

  return { score, label, color, rules };
};

export const validateEmail = (email: string): string | null => {
  if (!email || !email.trim()) {
    return 'Email address is required.';
  }
  const trimmed = email.trim();
  if (trimmed.length > 100) {
    return 'Email cannot exceed 100 characters.';
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return 'Please enter a valid email address (e.g. user@example.com).';
  }
  return null;
};

export const validateFullName = (name: string): string | null => {
  if (!name || !name.trim()) {
    return 'Full name is required.';
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }
  if (trimmed.length > 50) {
    return 'Name cannot exceed 50 characters.';
  }
  if (!NAME_REGEX.test(trimmed)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  if (password.length > 128) {
    return 'Password cannot exceed 128 characters.';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number.';
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'Password must contain at least one special character (e.g. !@#$%^&*).';
  }
  return null;
};

export const validatePasswordConfirm = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) {
    return 'Please confirm your password.';
  }
  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }
  return null;
};

export const validatePhone = (phone?: string): string | null => {
  if (!phone || !phone.trim()) {
    return null; // Phone is optional in most cases
  }
  const trimmed = phone.trim();
  const cleaned = trimmed.replace(/[\s-]/g, '');
  if (!PHONE_REGEX.test(trimmed) || cleaned.length < 10 || cleaned.length > 15) {
    return 'Please enter a valid phone number (10 to 15 digits).';
  }
  return null;
};
