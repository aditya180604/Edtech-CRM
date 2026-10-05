export interface CourseUpgradeOpportunity {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnail: string | null;
  currency: string;
  fullCoursePrice: number;
  accumulatedCredit: number;
  upgradePrice: number;
  eligibleTopicCount: number;
}

export interface StudentDashboardProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  profilePhoto: string | null;
  country: string | null;
  timezone: string | null;
  preferredLanguage: string | null;
  learningPreferences?: string | null;
  qualification?: string | null;
  institution?: string | null;
  skills?: string[];
  interests?: string[];
  status: string;
  completionPercentage: number;
  missingFields: string[];
}


export interface StudentDashboardStats {
  activeCoursesCount: number;
  purchasedTopicsCount: number;
  completedCoursesCount: number;
  certificatesCount: number;
  totalLearningHours: number;
}

export interface StudentDashboardStreak {
  currentStreak: number;
  lastActiveDate: string | null;
  isActiveToday: boolean;
}

export interface ActiveEnrolledCourse {
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  instructorName: string;
  enrolledTopicsCount: number;
  totalCourseTopicsCount: number;
  isFullCourseEnrolled: boolean;
  entitledProgressPercentage: number;
  lastAccessedLesson: {
    lessonId: string;
    title: string;
    topicId: string;
  } | null;
}

export interface UpcomingLiveSession {
  sessionId: string;
  title: string;
  type: 'WEBINAR' | 'LIVE_CLASS';
  scheduledAt: string;
  durationMinutes: number;
  instructorName: string;
  isBooked: boolean;
  priorityReason: 'BOOKED' | 'ENROLLED_COURSE' | 'ENROLLED_TOPIC' | 'INTEREST_MATCH' | 'PUBLIC';
  meetingUrl: string | null;
}

export interface RecentCertificateItem {
  certificateId: string;
  certificateNumber: string;
  courseTitle: string | null;
  issueDate: string;
  verificationUrl: string;
  certificateAssetUrl: string | null;
}

export interface WishlistItem {
  wishlistId: string;
  productType: 'COURSE' | 'TOPIC' | 'WEBINAR';
  productId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  currency: string;
}

export interface RecentOrderItem {
  orderId: string;
  orderNumber: string;
  itemTitle?: string;
  totalAmount: number;
  payableAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  itemsCount: number;
}

export interface NotificationItem {
  notificationId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface RecommendationItem {
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  coursePrice: number;
  currency: string;
  category: string;
  level: string;
  reason: string;
}

export interface StudentDashboardData {
  profile: StudentDashboardProfile;
  stats: StudentDashboardStats;
  streak: StudentDashboardStreak;
  activeCourses: ActiveEnrolledCourse[];
  upgradeOpportunities: CourseUpgradeOpportunity[];
  upcomingLiveSessions: UpcomingLiveSession[];
  recentCertificates: RecentCertificateItem[];
  wishlist: WishlistItem[];
  recentOrders: RecentOrderItem[];
  notifications: {
    unreadCount: number;
    recent: NotificationItem[];
  };
  recommendations: RecommendationItem[];
}
