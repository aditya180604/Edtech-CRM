// ==========================================
// Centralized Mongoose Models Registry
// Total: 54 Models matching the Edutech LMS specification
// ==========================================

// 1-2: Identity & Profiles
export { User, InstructorProfile } from './identity.models.js';

// 3-9: Learning Content Hierarchy
export {
  Course,
  Module,
  Topic,
  Lesson,
  Resource,
  Video,
  LearningPath,
  LearningPathDomain,
  LearningPathDomainTopic,
  TopicContentOffering,
} from './content.models.js';

// 10-14: Assessments & Assignments
export {
  Quiz,
  Question,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
} from './assessment.models.js';

// 15-23: Commerce & Financial Data
export {
  Cart,
  Order,
  OrderItem,
  Payment,
  Refund,
  Entitlement,
  TopicCredit,
  CourseUpgrade,
  FinancialLedger,
} from './commerce.models.js';

// 24-26: Learning Progress & Certificates
export {
  LearningProgress,
  VideoProgress,
  Certificate,
} from './learning.models.js';

// 27-31: Social, Ratings & Q&A
export {
  Review,
  Rating,
  CommunityQuestion,
  Answer,
  Wishlist,
} from './engagement.models.js';

// 32-34: Live Learning & Webinars
export {
  Webinar,
  LiveSession,
  Booking,
} from './live.models.js';

// 35-38: CRM & Events
export {
  Lead,
  LeadEvent,
  Campaign,
  Event,
} from './crm.models.js';

// 39-43: Unified Communications & Notifications
export {
  Conversation,
  Message,
  CommunicationLog,
  Notification,
  NotificationPreference,
} from './communication.models.js';

// 44-54: Operations, Marketing, Earnings, Audit, AI & Analytics
export {
  ContentVersion,
  ContentAccessRule,
  SupportTicket,
  SupportMessage,
  Coupon,
  Promotion,
  InstructorEarning,
  Payout,
  AuditLog,
  Recommendation,
  Analytics,
} from './governance.models.js';
