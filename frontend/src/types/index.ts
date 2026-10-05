export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | 'SUPER_ADMIN';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  isProfileCompleted?: boolean;
  skills?: string[];
  interests?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'STUDENT' | 'INSTRUCTOR';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Category {
  id: string;
  name: string;
  count: string;
  icon: string;
  bgGradient: string;
  iconColor: string;
}

export interface Course {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  instructorName: string;
  instructorTitle?: string;
  instructorAvatar?: string;
  rating: number;
  reviewCount: string;
  price: number;
  coursePrice?: number;
  originalPrice?: number;
  thumbnail: string;
  banner?: string;
  category: string;
  duration?: string;
  level?: string;
  studentCount?: string;
  badge?: string;
  description?: string;
  shortDescription?: string;
  detailedOverview?: string;
  language?: string;
  skills?: string[];
  requirements?: string[];
  learningObjectives?: string[];
  hardwareRequirements?: string[];
  softwareRequirements?: string[];
  requiredAccounts?: string[];
  foundationalConcepts?: string[];
  recommendedPriorKnowledge?: string[];
  coreTools?: string[];
  courseIncludes?: any;
  syllabusUrl?: string;
  syllabusFileName?: string;
  // Optional Enrollment Cap & Rich Card Attributes (Image 1)
  maxEnrollmentLimit?: number | null;
  enrolledCount?: number;
  isSoldOut?: boolean;
  remainingSeats?: number | null;
  schedule?: string;
  mentorStatus?: string;
  professionalTags?: string[];
  experienceMetrics?: string[];
  qualifications?: string[];
  totalSessions?: number | null;
  durationHours?: string;
  isWishlisted?: boolean;
}

export interface CartItem {
  id: string;
  type: 'COURSE' | 'TOPIC';
  title: string;
  price: number;
  originalPrice?: number;
  thumbnail?: string;
  category?: string;
  instructorName?: string;
  courseId?: string;
  courseSlug?: string;
  upgradeCredit?: number;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  coursesCount: string;
  price: number;
  icon: string;
  category: string;
  bgColor: string;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  coursesCount: number;
  duration: string;
  price: number;
  thumbnail: string;
  category: string;
}

export interface Webinar {
  id: string;
  title: string;
  slug: string;
  instructorName: string;
  instructorAvatar?: string;
  instructorTitle?: string;
  date: string;
  time: string;
  attendingCount: string;
  thumbnail: string;
  isLive?: boolean;
  category: string;
}

export interface Instructor {
  id: string;
  name: string;
  role: string;
  company: string;
  coursesCount: number;
  studentsCount: string;
  rating: number;
  reviewsCount: string;
  avatar: string;
}

export interface StatItem {
  value: string;
  label: string;
  icon: string;
}
