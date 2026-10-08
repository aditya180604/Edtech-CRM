import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Video,
  Users,
  Star,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  Upload,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Layers,
  RefreshCw,
  ImageIcon,
  Globe,
  HardDrive,
  Trash2,
  Lock,
  Edit3,
  CreditCard,
  AlertTriangle,
  X,
  Clock,
  ExternalLink,
  User,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  Code,
  Quote,
  Strikethrough,
  FileText,
  Check,
  PlayCircle,
  Award,
  HelpCircle,
  Monitor,
  DollarSign,
  Eye,
  Shield,
  Tag,
  Laptop,
  Cpu,
  Key,
  Heart,
  Bookmark,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';
import { instructorApi, type InstructorDashboardData } from '../../api/instructor';
import { useToast } from '../../context/ToastContext';
import { NotificationBell } from '../../components/dashboard/NotificationBell';
import { LiveStartedBanner } from '../../components/dashboard/LiveStartedBanner';
import { InstructorQuizStudio } from '../../components/quiz/InstructorQuizStudio';

export const InstructorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  // Navigation Sub-tab state
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'courses' | 'create-course' | 'quizzes' | 'webinars' | 'students' | 'reviews' | 'qa' | 'analytics' | 'profile'
  >('dashboard');

  // Dashboard Telemetry Data
  const [dashboardData, setDashboardData] = useState<InstructorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState('30d');

  // Interactive State for Dashboard Views
  const [growthMetric, setGrowthMetric] = useState<'students' | 'revenue'>('students');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState<number>(1999);
  const [visibilityPublic, setVisibilityPublic] = useState(true);

  // In-UI Modal for Adding Module / Topic in Dashboard (No prompt!)
  const [showAddModuleModal, setShowAddModuleModal] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  // My Courses Tab State
  const [courseStatusTab, setCourseStatusTab] = useState('ALL');
  const [courseSearch, setCourseSearch] = useState('');
  const [courseCategory, setCourseCategory] = useState('ALL');
  const [coursesList, setCoursesList] = useState<any[]>([]);

  // Cashfree Publishing Fee & Rejection Feedback States (Workflow 2 & 3)
  const [feeModalCourse, setFeeModalCourse] = useState<any | null>(null);
  const [feeOrderData, setFeeOrderData] = useState<any | null>(null);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [processingFee, setProcessingFee] = useState(false);
  const [cashfreePaymentState, setCashfreePaymentState] = useState<
    'IDLE' | 'PROCESSING' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'USER_DROPPED' | 'EXPIRED'
  >('IDLE');
  const [checkoutButtonStep, setCheckoutButtonStep] = useState<'IDLE' | 'CREATING' | 'OPENING'>('IDLE');
  const [verifiedPaymentData, setVerifiedPaymentData] = useState<{
    orderId?: string;
    paymentId?: string;
    amount?: number;
  } | null>(null);
  const [rejectionModalCourse, setRejectionModalCourse] = useState<any | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [wizardPublishingFeePaid, setWizardPublishingFeePaid] = useState<boolean>(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);

  // Webinars Tab State
  const [webinarsTab, setWebinarsTab] = useState('ALL');
  const [webinarSearch, setWebinarSearch] = useState('');
  const [webinarsList, setWebinarsList] = useState<any[]>([]);
  const [webinarCounts, setWebinarCounts] = useState<any>({});
  const [showCreateWebinarModal, setShowCreateWebinarModal] = useState(false);
  const [newWebinar, setNewWebinar] = useState<{
    title: string;
    category: string;
    startTime: string;
    endTime: string;
    capacity: number;
    price: number;
    meetingType: 'IN_PLATFORM' | 'EXTERNAL';
    meetingUrl: string;
  }>({
    title: '',
    category: 'DevOps / Cloud',
    startTime: '',
    endTime: '',
    capacity: 100,
    price: 0,
    meetingType: 'IN_PLATFORM',
    meetingUrl: '',
  });

  // Edit Webinar State with 2-Hour Lock
  const [editingWebinar, setEditingWebinar] = useState<any | null>(null);
  const [showEditWebinarModal, setShowEditWebinarModal] = useState(false);

  // Reviews Tab State
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reviewsMetrics, setReviewsMetrics] = useState<any>({
    totalReviews: 0,
    averageRating: 0,
    verifiedPurchases: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | null>(null);
  const [reviewSearch, setReviewSearch] = useState('');

  // Analytics Tab State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30d');

  // Students Tab State
  const [studentsTab, setStudentsTab] = useState('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentCounts, setStudentCounts] = useState<any>({});

  // Q&A Tab State
  const [qaTab, setQaTab] = useState('ALL');
  const [qaSearch, setQaSearch] = useState('');
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [qaCounts, setQaCounts] = useState<any>({});
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  // Profile & Verification State
  const [profileData, setProfileData] = useState<any>({
    bio: '',
    headline: '',
    expertise: ['DevOps', 'Cloud Computing', 'Web Development'],
    skills: ['React', 'Node.js', 'Docker', 'AWS'],
    experience: '5+ Years',
    qualifications: ['Bachelor of Technology (CSE)'],
    currentOrganization: '',
    phone: '',
    profilePhoto: '',
    identityStatus: 'VERIFIED',
    verificationStatus: 'UNDER_REVIEW',
    kycStatus: 'NOT_STARTED',
    payoutStatus: 'NOT_CONNECTED',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newExpertiseInput, setNewExpertiseInput] = useState('');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');

  // 9-Step Create/Edit Course Wizard State
  const [createStep, setCreateStep] = useState(1);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    thumbnail: '',
    banner: '',
    category: 'Development',
    subcategory: '',
    level: 'Beginner',
    language: 'English',
    skills: [] as string[],
    detailedOverview: '',
    targetAudience: [] as string[],
    courseGoals: [] as string[],
    teachingMethodology: 'Hands-on Projects, Practical Architecture Labs, and Real-world Case Studies',
    learningObjectives: [] as string[],
    foundationalConcepts: [] as string[],
    recommendedPriorKnowledge: [] as string[],
    coreTools: [] as string[],
    requirements: [] as string[],
    hardwareRequirements: [] as string[],
    softwareRequirements: [] as string[],
    requiredAccounts: [] as string[],
    courseIncludes: {
      videoHours: '20+ Hours of On-Demand HD Video',
      resourcesCount: '15 Downloadable Architecture Guides & Source Repos',
      projectsCount: '3 Full-Stack Production Projects',
      certificate: true,
      qaSupport: true,
      lifetimeAccess: true,
      otherBenefits: [] as string[],
    },
    promotionalVideo: '',
    coursePrice: 0,
    discountPrice: 0,
    accessDuration: 'Lifetime Access',
    certificateSettings: {
      enableCertificate: true,
      certificateTitle: '',
    },
    currency: 'INR',
    syllabusUrl: '',
    syllabusFileName: '',
    // Optional Enrollment Cap & Rich Card Attributes
    maxEnrollmentLimit: '' as string | number,
    schedule: '',
    mentorStatus: 'Pro Mentor',
    professionalTags: ['Ex-Apple', 'Full Stack Engineer', 'MERN Developer'] as string[],
    experienceMetrics: ['18y Exp', 'Top 1% Mentor', '10x Engineer'] as string[],
    qualifications: [] as string[],
    totalSessions: '' as string | number,
    modules: [] as Array<{
      title: string;
      topics: Array<{
        title: string;
        description?: string;
        price: number;
        isFree: boolean;
        duration: number;
        videoUrl?: string;
        lessons?: Array<any>;
      }>;
    }>,
  });

  // Helper inputs for Step 1, 2, 3, 5, 6, 7
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newAudienceInput, setNewAudienceInput] = useState('');
  const [newLearningObjectiveInput, setNewLearningObjectiveInput] = useState('');
  const [newProfessionalTagInput, setNewProfessionalTagInput] = useState('');
  const [newExperienceMetricInput, setNewExperienceMetricInput] = useState('');
  const [newQualificationInput, setNewQualificationInput] = useState('');
  const [newFoundationalConceptInput, setNewFoundationalConceptInput] = useState('');
  const [newPriorKnowledgeInput, setNewPriorKnowledgeInput] = useState('');
  const [newCoreToolInput, setNewCoreToolInput] = useState('');
  const [newPrerequisiteInput, setNewPrerequisiteInput] = useState('');
  const [newHardwareReqInput, setNewHardwareReqInput] = useState('');
  const [newSoftwareReqInput, setNewSoftwareReqInput] = useState('');
  const [newRequiredAccountInput, setNewRequiredAccountInput] = useState('');
  const [newOtherBenefitInput, setNewOtherBenefitInput] = useState('');

  // Image Upload Mode state (device vs weburl)
  const [thumbUploadTab, setThumbUploadTab] = useState<'device' | 'url'>('device');
  const [thumbUrlInput, setThumbUrlInput] = useState('');
  const [newSkillTagInput, setNewSkillTagInput] = useState('');

  // Syllabus Upload Mode state
  const [syllabusUploadTab, setSyllabusUploadTab] = useState<'device' | 'url'>('device');
  const [syllabusUrlInput, setSyllabusUrlInput] = useState('');

  // Wizard In-UI Module and Topic Modals
  const [wizardModuleModal, setWizardModuleModal] = useState(false);
  const [wizardModuleTitle, setWizardModuleTitle] = useState('');
  const [wizardTopicModal, setWizardTopicModal] = useState(false);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
  const [wizardTopicForm, setWizardTopicForm] = useState({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    duration: 30,
    videoUrl: '',
    videoSourceTab: 'url' as 'device' | 'url',
  });

  // Utility to parse single, comma-separated, semicolon-separated, or multiline/bullet list inputs
  const parseMultiItems = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    return text
      .split(/\r?\n|,|;/)
      .map((s) => s.replace(/^[\s\d+.\-•*–—>)\]]+/, '').trim())
      .filter((s) => s.length > 0);
  };

  const handleAddPrerequisites = () => {
    const items = parseMultiItems(newPrerequisiteInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        requirements: [...(prev.requirements || []), ...items],
      }));
      setNewPrerequisiteInput('');
    }
  };

  const handleAddHardwareReqs = () => {
    const items = parseMultiItems(newHardwareReqInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        hardwareRequirements: [...(prev.hardwareRequirements || []), ...items],
      }));
      setNewHardwareReqInput('');
    }
  };

  const handleAddSoftwareReqs = () => {
    const items = parseMultiItems(newSoftwareReqInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        softwareRequirements: [...(prev.softwareRequirements || []), ...items],
      }));
      setNewSoftwareReqInput('');
    }
  };

  const handleAddRequiredAccounts = () => {
    const items = parseMultiItems(newRequiredAccountInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        requiredAccounts: [...(prev.requiredAccounts || []), ...items],
      }));
      setNewRequiredAccountInput('');
    }
  };

  const handleAddSkills = () => {
    const items = parseMultiItems(newSkillTagInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        skills: [...(prev.skills || []), ...items],
      }));
      setNewSkillTagInput('');
    }
  };

  const handleAddLearningOutcomes = () => {
    const items = parseMultiItems(newLearningObjectiveInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        learningObjectives: [...(prev.learningObjectives || []), ...items],
      }));
      setNewLearningObjectiveInput('');
    }
  };

  const handleAddFoundational = () => {
    const items = parseMultiItems(newFoundationalConceptInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        foundationalConcepts: [...(prev.foundationalConcepts || []), ...items],
      }));
      setNewFoundationalConceptInput('');
    }
  };

  const handleAddPriorKnowledge = () => {
    const items = parseMultiItems(newPriorKnowledgeInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        recommendedPriorKnowledge: [...(prev.recommendedPriorKnowledge || []), ...items],
      }));
      setNewPriorKnowledgeInput('');
    }
  };

  const handleAddCoreTools = () => {
    const items = parseMultiItems(newCoreToolInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        coreTools: [...(prev.coreTools || []), ...items],
      }));
      setNewCoreToolInput('');
    }
  };

  const handleAddAudience = () => {
    const items = parseMultiItems(newAudienceInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        targetAudience: [...(prev.targetAudience || []), ...items],
      }));
      setNewAudienceInput('');
    }
  };

  const handleAddGoals = () => {
    const items = parseMultiItems(newGoalInput);
    if (items.length > 0) {
      setCourseFormData((prev) => ({
        ...prev,
        courseGoals: [...(prev.courseGoals || []), ...items],
      }));
      setNewGoalInput('');
    }
  };

  // Load Dashboard Live Telemetry
  const fetchDashboard = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setRefreshing(true);
      const res = await instructorApi.getDashboard(timeframe);
      if (res.success && res.data) {
        setDashboardData(res.data);
        if (res.data.activeCourse) {
          setNewPrice(res.data.activeCourse.coursePrice || 1999);
          setVisibilityPublic(res.data.activeCourse.status === 'PUBLISHED');
        }
        if (res.data.syllabus) {
          const initExp: Record<string, boolean> = {};
          res.data.syllabus.forEach((m, idx) => {
            initExp[m._id] = idx < 2;
          });
          setExpandedModules(initExp);
        }
      }
    } catch (err) {
      console.error('Failed to load instructor dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  // Load Sub-views Data
  const loadSubViewData = useCallback(async () => {
    if (activeNav === 'courses') {
      const res = await instructorApi.getCourses({
        status: courseStatusTab,
        search: courseSearch,
        category: courseCategory,
      });
      if (res.success) setCoursesList(res.data.courses || []);
    } else if (activeNav === 'webinars') {
      const res = await instructorApi.getWebinars({
        status: webinarsTab,
        search: webinarSearch,
      });
      if (res.success) {
        setWebinarsList(res.data.webinars || []);
        setWebinarCounts(res.data.counts || {});
      }
    } else if (activeNav === 'students') {
      const res = await instructorApi.getStudents({
        status: studentsTab,
        search: studentSearch,
      });
      if (res.success) {
        setStudentsList(res.data.students || []);
        setStudentCounts(res.data.counts || {});
      }
    } else if (activeNav === 'reviews') {
      const res = await instructorApi.getReviews({
        rating: reviewRatingFilter || undefined,
        search: reviewSearch || undefined,
      });
      if (res.success && res.data) {
        setReviewsList(res.data.reviews || []);
        setReviewsMetrics(res.data.metrics || {});
      }
    } else if (activeNav === 'analytics') {
      const res = await instructorApi.getAnalytics({ timeframe: analyticsTimeframe });
      if (res.success && res.data) {
        setAnalyticsData(res.data);
      }
    } else if (activeNav === 'qa') {
      const res = await instructorApi.getQuestions({
        status: qaTab,
        search: qaSearch,
      });
      if (res.success) {
        setQuestionsList(res.data.questions || []);
        setQaCounts(res.data.counts || {});
      }
    } else if (activeNav === 'profile') {
      const res = await instructorApi.getProfile();
      if (res.success && res.data.profile) {
        setProfileData(res.data.profile);
      }
    }
  }, [
    activeNav,
    courseStatusTab,
    courseSearch,
    courseCategory,
    webinarsTab,
    webinarSearch,
    studentsTab,
    studentSearch,
    qaTab,
    qaSearch,
    reviewRatingFilter,
    reviewSearch,
    analyticsTimeframe,
  ]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    loadSubViewData();
  }, [loadSubViewData]);

  useEffect(() => {
    const onWebinarsChanged = () => {
      loadSubViewData();
      fetchDashboard(true);
    };
    window.addEventListener('webinarsChanged', onWebinarsChanged);
    return () => window.removeEventListener('webinarsChanged', onWebinarsChanged);
  }, [loadSubViewData, fetchDashboard]);

  // Mandatory Onboarding & Super Admin Verification Guard (Workflow 1 & 3)
  useEffect(() => {
    if (!user || user.role !== 'INSTRUCTOR') return;
    if (user.isProfileCompleted === false) {
      navigate('/instructor/onboarding', { replace: true });
      return;
    }

    const checkVerificationStatus = async () => {
      try {
        const res = await instructorApi.getProfile();
        if (res.success && res.data?.profile) {
          const prof = res.data.profile;
          setProfileData(prof);
          const status = (prof.verificationStatus || 'PENDING').toUpperCase();
          if (status !== 'VERIFIED' && status !== 'APPROVED') {
            navigate('/instructor/pending-verification', { replace: true });
          }
        }
      } catch (err) {
        console.error('Verification guard check error:', err);
      }
    };
    checkVerificationStatus();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleModuleAccordion = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // Image Upload from Device Handler
  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setCourseFormData((prev) => ({ ...prev, thumbnail: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // Image Upload from Web URL Handler
  const handleApplyWebUrl = () => {
    if (thumbUrlInput.trim()) {
      setCourseFormData((prev) => ({ ...prev, thumbnail: thumbUrlInput.trim() }));
      setThumbUrlInput('');
    }
  };

  // In-UI Add Module to Dashboard Course
  const handleAddModuleToActiveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !dashboardData?.activeCourse?._id) return;
    try {
      await instructorApi.addModule(dashboardData.activeCourse._id, { title: newModuleTitle.trim() });
      setNewModuleTitle('');
      setShowAddModuleModal(false);
      fetchDashboard(true);
    } catch (err) {
      console.error('Error adding module:', err);
    }
  };

  // In-UI Add Module in Wizard (Automated Module Numbering & Immutable Update)
  const handleWizardAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cleanTitle = wizardModuleTitle.trim().replace(/^Module\s*\d+\s*:\s*/i, '');
    if (!cleanTitle) return;

    setCourseFormData((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          title: cleanTitle,
          topics: [],
        },
      ],
    }));
    setWizardModuleTitle('');
    setWizardModuleModal(false);
  };

  // In-UI Save Topic in Wizard (Add or Edit with Strict Validations)
  const handleWizardSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedModuleIndex === null) return;

    // Strict Validations: All fields mandatory
    if (!wizardTopicForm.title.trim()) {
      toastError('Validation Error', 'Topic Title is mandatory.');
      return;
    }
    if (!wizardTopicForm.description.trim()) {
      toastError('Validation Error', 'Topic Description is mandatory for all topics.');
      return;
    }
    if (!wizardTopicForm.videoUrl.trim()) {
      toastError('Validation Error', 'Topic Video link or uploaded video is mandatory.');
      return;
    }
    if (!wizardTopicForm.isFree && (Number(wizardTopicForm.price) <= 0 || isNaN(Number(wizardTopicForm.price)))) {
      toastError('Validation Error', 'Please specify a valid topic price (₹) or enable "Mark as Free Preview Topic".');
      return;
    }
    if (Number(wizardTopicForm.duration) <= 0 || isNaN(Number(wizardTopicForm.duration))) {
      toastError('Validation Error', 'Topic duration must be greater than 0 minutes.');
      return;
    }

    const topicPayload = {
      title: wizardTopicForm.title.trim(),
      description: wizardTopicForm.description.trim(),
      price: wizardTopicForm.isFree ? 0 : Number(wizardTopicForm.price) || 0,
      isFree: wizardTopicForm.isFree,
      duration: Number(wizardTopicForm.duration) || 30,
      videoUrl: wizardTopicForm.videoUrl.trim(),
      lessons: [
        {
          title: wizardTopicForm.title.trim(),
          duration: Number(wizardTopicForm.duration) || 30,
          videoUrl: wizardTopicForm.videoUrl.trim(),
        },
      ],
    };

    setCourseFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, idx) => {
        if (idx !== selectedModuleIndex) return m;
        if (editingTopicIndex !== null) {
          return {
            ...m,
            topics: m.topics.map((t, ti) => (ti === editingTopicIndex ? topicPayload : t)),
          };
        } else {
          return {
            ...m,
            topics: [...m.topics, topicPayload],
          };
        }
      }),
    }));

    success(
      editingTopicIndex !== null ? 'Topic Updated' : 'Topic Added',
      `"${wizardTopicForm.title.trim()}" has been saved successfully.`
    );

    setWizardTopicForm({
      title: '',
      description: '',
      price: 0,
      isFree: false,
      duration: 30,
      videoUrl: '',
      videoSourceTab: 'url',
    });
    setEditingTopicIndex(null);
    setWizardTopicModal(false);
    setSelectedModuleIndex(null);
  };

  // Syllabus Upload Handlers
  const handleSyllabusFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setCourseFormData((prev) => ({
        ...prev,
        syllabusUrl: base64,
        syllabusFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplySyllabusUrl = () => {
    if (syllabusUrlInput.trim()) {
      setCourseFormData((prev) => ({
        ...prev,
        syllabusUrl: syllabusUrlInput.trim(),
        syllabusFileName: 'Course_Syllabus.pdf',
      }));
      setSyllabusUrlInput('');
    }
  };

  // Course Edit Functionality (Requirement 5)
  const handleEditCourse = async (courseId: string) => {
    try {
      setLoading(true);
      const res = await instructorApi.getCourseById(courseId);
      if (res.success && res.data) {
        const { course, modules } = res.data;
        setEditingCourseId(courseId);
        setCourseFormData({
          title: course.title || '',
          shortDescription: course.shortDescription || '',
          description: course.description || '',
          thumbnail: course.thumbnail || '',
          banner: course.banner || '',
          category: course.category || 'Development',
          subcategory: course.subcategory || '',
          level: course.level || 'Beginner',
          language: course.language || 'English',
          skills: course.skills || [],
          detailedOverview: course.detailedOverview || course.description || '',
          targetAudience: course.targetAudience || [],
          courseGoals: course.courseGoals || [],
          teachingMethodology: course.teachingMethodology || 'Hands-on Projects, Practical Architecture Labs, and Real-world Case Studies',
          learningObjectives: course.learningObjectives || [],
          foundationalConcepts: course.foundationalConcepts || [],
          recommendedPriorKnowledge: course.recommendedPriorKnowledge || [],
          coreTools: course.coreTools || [],
          requirements: course.requirements || [],
          hardwareRequirements: course.hardwareRequirements || [],
          softwareRequirements: course.softwareRequirements || [],
          requiredAccounts: course.requiredAccounts || [],
          courseIncludes: {
            videoHours: course.courseIncludes?.videoHours || '20+ Hours of On-Demand HD Video',
            resourcesCount: course.courseIncludes?.resourcesCount || '15 Downloadable Architecture Guides & Source Repos',
            projectsCount: course.courseIncludes?.projectsCount || '3 Full-Stack Production Projects',
            certificate: course.courseIncludes?.certificate ?? true,
            qaSupport: course.courseIncludes?.qaSupport ?? true,
            lifetimeAccess: course.courseIncludes?.lifetimeAccess ?? true,
            otherBenefits: course.courseIncludes?.otherBenefits || [],
          },
          promotionalVideo: course.promotionalVideo || '',
          coursePrice: course.coursePrice ?? 1999,
          discountPrice: course.discountPrice ?? 0,
          accessDuration: course.accessDuration || 'Lifetime Access',
          certificateSettings: {
            enableCertificate: course.certificateSettings?.enableCertificate ?? true,
            certificateTitle: course.certificateSettings?.certificateTitle || '',
          },
          currency: course.currency || 'INR',
          syllabusUrl: course.syllabusUrl || '',
          syllabusFileName: course.syllabusFileName || '',
          maxEnrollmentLimit: course.maxEnrollmentLimit ?? '',
          schedule: course.schedule || '',
          mentorStatus: course.mentorStatus || 'Pro Mentor',
          professionalTags: Array.isArray(course.professionalTags) ? course.professionalTags : ['Ex-Apple', 'Full Stack Engineer'],
          experienceMetrics: Array.isArray(course.experienceMetrics) ? course.experienceMetrics : ['18y Exp', 'Top 1% Mentor'],
          qualifications: Array.isArray(course.qualifications) ? course.qualifications : [],
          totalSessions: course.totalSessions ?? '',
          modules: (modules || []).map((m: any) => ({
            title: (m.title || '').replace(/^Module\s*\d+\s*:\s*/i, ''),
            topics: (m.topics || []).map((t: any) => ({
              title: t.title,
              description: t.description || '',
              price: t.price ?? 0,
              isFree: !!t.isFree,
              duration: t.duration || 30,
              videoUrl: t.videoUrl || '',
              lessons: t.lessons || [],
            })),
          })),
        });
        setWizardPublishingFeePaid(Boolean(course.publishingFeePaid));
        setActiveNav('create-course');
        setCreateStep(1);
      }
    } catch (err) {
      console.error('Failed to load course for editing:', err);
      toastError('Error', 'Could not load course details for editing.');
    } finally {
      setLoading(false);
    }
  };

  // Course Delete Functionality
  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"? This will permanently remove its curriculum modules, topics, and lessons.`)) {
      return;
    }
    try {
      await instructorApi.deleteCourse(courseId);
      success('Course Deleted', `Course "${courseTitle}" was deleted successfully.`);
      loadSubViewData();
      fetchDashboard(true);
    } catch (err) {
      console.error('Failed to delete course:', err);
      toastError('Delete Failed', 'Failed to delete course.');
    }
  };

  const handleSavePrice = async () => {
    if (!dashboardData?.activeCourse?._id) return;
    try {
      await instructorApi.updatePrice(dashboardData.activeCourse._id, {
        coursePrice: Number(newPrice),
        currency: 'INR',
      });
      setEditingPrice(false);
      fetchDashboard(true);
    } catch (err) {
      console.error('Error updating price:', err);
    }
  };

  const handleToggleVisibility = async () => {
    if (!dashboardData?.activeCourse?._id) return;
    const nextVal = !visibilityPublic;
    setVisibilityPublic(nextVal);
    try {
      await instructorApi.updateVisibility(dashboardData.activeCourse._id, {
        status: nextVal ? 'PUBLISHED' : 'DRAFT',
        visibility: nextVal ? 'PUBLIC' : 'PRIVATE',
      });
      fetchDashboard(true);
    } catch (err) {
      console.error('Error toggling visibility:', err);
    }
  };

  const handleAnswerSubmit = async (questionId: string) => {
    if (!answerText.trim()) return;
    try {
      await instructorApi.answerQuestion(questionId, { answer: answerText });
      setAnsweringQuestionId(null);
      setAnswerText('');
      loadSubViewData();
    } catch (err) {
      console.error('Error submitting answer:', err);
    }
  };

  const handleCreateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const scheduledDate = newWebinar.startTime ? new Date(newWebinar.startTime) : new Date(Date.now() + 86400000 * 3);
      const expiryDate = newWebinar.endTime ? new Date(newWebinar.endTime) : new Date(scheduledDate.getTime() + 7200000);

      if (expiryDate.getTime() <= scheduledDate.getTime()) {
        toastError('Invalid Expiry Time', 'Webinar expiry / end time must be after the scheduled start time.');
        return;
      }

      await instructorApi.createWebinar({
        title: newWebinar.title.trim(),
        category: newWebinar.category,
        startTime: scheduledDate.toISOString(),
        endTime: expiryDate.toISOString(),
        capacity: Number(newWebinar.capacity) || 100,
        price: Number(newWebinar.price) || 0,
        meetingType: newWebinar.meetingType || 'IN_PLATFORM',
        meetingUrl: newWebinar.meetingType === 'EXTERNAL' ? newWebinar.meetingUrl.trim() : undefined,
        status: 'SCHEDULED',
      });
      setShowCreateWebinarModal(false);
      setNewWebinar({ title: '', category: 'DevOps / Cloud', startTime: '', endTime: '', capacity: 100, price: 0, meetingType: 'IN_PLATFORM', meetingUrl: '' });
      success('Webinar Scheduled', 'Your live webinar was successfully created with an automated in-platform room!');
      window.dispatchEvent(new Event('webinarsChanged'));
      await loadSubViewData();
      fetchDashboard(true);
    } catch (err: any) {
      console.error('Error creating webinar:', err);
      toastError('Error', err.response?.data?.message || 'Failed to create webinar.');
    }
  };

  const handleUpdateWebinar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWebinar) return;
    try {
      const payload: any = {
        title: editingWebinar.title.trim(),
        category: editingWebinar.category,
        capacity: Number(editingWebinar.capacity) || 100,
        price: Number(editingWebinar.price) || 0,
        meetingType: editingWebinar.meetingType || 'IN_PLATFORM',
        meetingUrl: (editingWebinar.meetingUrl || '').trim(),
      };

      // Strict 2-Hour Cutoff: Only update startTime and endTime if not locked
      if (!editingWebinar.isTimingLocked && editingWebinar.startTime) {
        payload.startTime = new Date(editingWebinar.startTime).toISOString();
        if (editingWebinar.endTime) {
          payload.endTime = new Date(editingWebinar.endTime).toISOString();
        } else {
          payload.endTime = new Date(new Date(editingWebinar.startTime).getTime() + 7200000).toISOString();
        }
      } else if (!editingWebinar.isTimingLocked && editingWebinar.endTime) {
        payload.endTime = new Date(editingWebinar.endTime).toISOString();
      }

      await instructorApi.updateWebinar(editingWebinar._id, payload);
      setShowEditWebinarModal(false);
      setEditingWebinar(null);
      success('Webinar Updated', 'Webinar details updated successfully!');
      window.dispatchEvent(new Event('webinarsChanged'));
      await loadSubViewData();
      fetchDashboard(true);
    } catch (err: any) {
      console.error('Error updating webinar:', err);
      toastError('Update Failed', err.response?.data?.message || 'Could not update webinar.');
    }
  };

  const handleDeleteWebinar = async (webinarId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the scheduled webinar "${title}"?`)) return;
    try {
      await instructorApi.deleteWebinar(webinarId);
      success('Webinar Deleted', `Webinar "${title}" was deleted successfully.`);
      window.dispatchEvent(new Event('webinarsChanged'));
      await loadSubViewData();
      fetchDashboard(true);
    } catch (err) {
      console.error('Error deleting webinar:', err);
      toastError('Error', 'Failed to delete webinar.');
    }
  };

  // Genuine Cashfree Payment Verification with Backend
  // Genuine Cashfree Payment Verification with Backend
  const verifyBackendPaymentStatus = async (courseId: string, orderId?: string) => {
    try {
      setProcessingFee(true);
      const res = await instructorApi.getPublishingFeeStatus(courseId, orderId);
      const data = res?.data;
      const status = data?.paymentStatus || data?.payment_status;

      if (status === 'SUCCESS') {
        setCashfreePaymentState('SUCCESS');
        setWizardPublishingFeePaid(true);
        setVerifiedPaymentData({
          orderId: data.orderId || data.order_id || orderId,
          paymentId: data.paymentId || data.cashfreePaymentId || '—',
          amount: data.amount,
        });
        success(
          'Payment Verified Successfully! ✓',
          `Order ID: ${data.orderId || orderId}. Platform fee (₹${Number(data.amount || 0).toLocaleString('en-IN')}) registered. Platform fee revenue added to Super Admin Ledger.`
        );
        fetchDashboard(true);
      } else if (status === 'USER_DROPPED') {
        setCashfreePaymentState('USER_DROPPED');
      } else if (status === 'FAILED') {
        setCashfreePaymentState('FAILED');
      } else if (status === 'EXPIRED') {
        setCashfreePaymentState('EXPIRED');
      } else {
        setCashfreePaymentState('PENDING');
      }
    } catch (err: any) {
      console.error('Error verifying payment status with server:', err);
      setCashfreePaymentState('PENDING');
    } finally {
      setProcessingFee(false);
      setCheckoutButtonStep('IDLE');
    }
  };

  const handleWizardPayFee = async () => {
    if (!courseFormData.title.trim()) {
      toastError('Course Title Required', 'Please enter a course title in Step 1 before proceeding to payment.');
      setCreateStep(1);
      return;
    }
    try {
      setProcessingFee(true);
      setCheckoutButtonStep('CREATING');
      setCashfreePaymentState('PROCESSING');

      let targetCourseId = editingCourseId;
      if (!targetCourseId) {
        // Create initial draft course first to obtain courseId
        const res = await instructorApi.createCourse({
          ...courseFormData,
          status: 'DRAFT',
          approvalStatus: 'DRAFT',
        });
        targetCourseId = res.data?._id || res.data?.id;
        setEditingCourseId(targetCourseId);
      } else {
        // Update existing course draft
        await instructorApi.updateCourse(targetCourseId, {
          ...courseFormData,
          status: 'DRAFT',
          approvalStatus: 'DRAFT',
        });
      }

      if (!targetCourseId) {
        toastError('Error', 'Unable to initiate course for payment. Please try again.');
        setCashfreePaymentState('IDLE');
        setCheckoutButtonStep('IDLE');
        return;
      }

      // Initialize genuine Cashfree PG order on backend
      const feeRes = await instructorApi.createPublishingFeeOrder(targetCourseId);
      if (!feeRes.success || !feeRes.data) {
        throw new Error(feeRes.message || 'Failed to initialize payment order with Cashfree.');
      }

      const orderData = feeRes.data;
      setFeeOrderData(orderData);

      // Handle ₹0 free course waiver
      if (orderData.alreadyPaid && orderData.amount === 0) {
        setCashfreePaymentState('SUCCESS');
        setWizardPublishingFeePaid(true);
        setVerifiedPaymentData({
          orderId: orderData.orderId || 'FREE_WAIVER',
          paymentId: 'WAIVED',
          amount: 0,
        });
        success('Platform Fee Waived', 'Publishing fee is waived for free courses (₹0).');
        setCheckoutButtonStep('IDLE');
        return;
      }

      // Handle previously verified course
      if (orderData.alreadyPaid && orderData.paymentStatus === 'SUCCESS') {
        setCashfreePaymentState('SUCCESS');
        setWizardPublishingFeePaid(true);
        setVerifiedPaymentData({
          orderId: orderData.orderId,
          paymentId: orderData.paymentId,
          amount: orderData.amount,
        });
        success('Payment Verified', 'Platform fee has already been verified.');
        setCheckoutButtonStep('IDLE');
        return;
      }

      if (!orderData.paymentSessionId) {
        throw new Error('Cashfree payment session ID was not received from gateway.');
      }

      setCheckoutButtonStep('OPENING');

      // Initialize Cashfree official SDK
      const cfMode = orderData.environment === 'production' ? 'production' : 'sandbox';
      let cashfree: any = null;
      try {
        cashfree = await loadCashfree({ mode: cfMode });
      } catch (sdkErr) {
        console.warn('Cashfree SDK load notice:', sdkErr);
      }

      if (!cashfree) {
        throw new Error('Could not load Cashfree SDK modal. Please check your network connection.');
      }

      let userDropped = false;
      try {
        const checkoutResult: any = await cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: '_modal',
        });

        if (checkoutResult?.error) {
          console.warn('[Cashfree Checkout Event]:', checkoutResult.error);
          if (
            checkoutResult.error.code === 'USER_DROPPED' ||
            checkoutResult.error.message?.toLowerCase().includes('user dropped') ||
            checkoutResult.error.message?.toLowerCase().includes('closed') ||
            checkoutResult.error.message?.toLowerCase().includes('dismiss')
          ) {
            userDropped = true;
          }
        }
      } catch (checkoutErr: any) {
        console.warn('[Cashfree Checkout Warning]:', checkoutErr);
        if (
          checkoutErr?.message?.toLowerCase().includes('user dropped') ||
          checkoutErr?.message?.toLowerCase().includes('closed')
        ) {
          userDropped = true;
        }
      }

      if (userDropped) {
        setCashfreePaymentState('USER_DROPPED');
        setProcessingFee(false);
        setCheckoutButtonStep('IDLE');
        return;
      }

      // Verify payment with server (rely strictly on Cashfree server verification)
      await verifyBackendPaymentStatus(targetCourseId, orderData.orderId);
    } catch (err: any) {
      console.error('Error in handleWizardPayFee:', err);
      if (err.response?.status === 401) {
        toastError('Session Expired', 'Your session has expired. Please refresh the page or log in again.');
        setCashfreePaymentState('IDLE');
      } else {
        toastError('Payment Initialization Failed', err.response?.data?.message || err.message || 'Could not initiate payment.');
        setCashfreePaymentState('FAILED');
      }
    } finally {
      setProcessingFee(false);
      setCheckoutButtonStep('IDLE');
    }
  };

  const handleSubmitCourseForReview = async (saveAsDraftOnly = false) => {
    if (!courseFormData.title.trim()) {
      toastError('Title Required', 'Please provide a course title in Step 1 before submitting.');
      setCreateStep(1);
      return;
    }
    if (!saveAsDraftOnly && !wizardPublishingFeePaid) {
      toastError('Publishing Fee Required', 'Please pay the 10% platform publishing fee via Cashfree before submitting for Super Admin review.');
      return;
    }
    if (isSubmittingCourse) return;

    try {
      setIsSubmittingCourse(true);
      const statusToSet = saveAsDraftOnly ? 'DRAFT' : 'PENDING_APPROVAL';
      const approvalStatusToSet = saveAsDraftOnly ? 'DRAFT' : 'PENDING_APPROVAL';

      let savedCourseId = editingCourseId;
      if (editingCourseId) {
        await instructorApi.updateCourse(editingCourseId, {
          ...courseFormData,
          status: statusToSet,
          approvalStatus: approvalStatusToSet,
        });
      } else {
        const res = await instructorApi.createCourse({
          ...courseFormData,
          status: statusToSet,
          approvalStatus: approvalStatusToSet,
        });
        savedCourseId = res.data?._id || res.data?.id;
      }

      if (!saveAsDraftOnly && savedCourseId) {
        await instructorApi.submitForReview(savedCourseId);
        const orderIdDisp = verifiedPaymentData?.orderId || feeOrderData?.orderId || 'VERIFIED';
        success(
          'Course Submitted for Super Admin Review! 🎉',
          `Order ID: ${orderIdDisp}. Platform fee verified and course submitted for review. You can track approval progress in My Courses.`
        );
        setEditingCourseId(null);
        setWizardPublishingFeePaid(false);
        setCashfreePaymentState('IDLE');
        setVerifiedPaymentData(null);
        setActiveNav('courses');
        setCreateStep(1);
      } else {
        success('Course Draft Saved', 'Your course structure and curriculum have been saved as draft.');
        setEditingCourseId(null);
        setWizardPublishingFeePaid(false);
        setCashfreePaymentState('IDLE');
        setVerifiedPaymentData(null);
        setActiveNav('courses');
        setCreateStep(1);
      }
      setCourseFormData({
        title: '',
        shortDescription: '',
        description: '',
        thumbnail: '',
        banner: '',
        category: 'Development',
        subcategory: '',
        level: 'Beginner',
        language: 'English',
        skills: [],
        detailedOverview: '',
        targetAudience: [],
        courseGoals: [],
        teachingMethodology: 'Hands-on Projects, Practical Architecture Labs, and Real-world Case Studies',
        learningObjectives: [],
        foundationalConcepts: [],
        recommendedPriorKnowledge: [],
        coreTools: [],
        requirements: [],
        hardwareRequirements: [],
        softwareRequirements: [],
        requiredAccounts: [],
        courseIncludes: {
          videoHours: '20+ Hours of On-Demand HD Video',
          resourcesCount: '15 Downloadable Architecture Guides & Source Repos',
          projectsCount: '3 Full-Stack Production Projects',
          certificate: true,
          qaSupport: true,
          lifetimeAccess: true,
          otherBenefits: [],
        },
        promotionalVideo: '',
        coursePrice: 0,
        discountPrice: 0,
        accessDuration: 'Lifetime Access',
        certificateSettings: {
          enableCertificate: true,
          certificateTitle: '',
        },
        currency: 'INR',
        syllabusUrl: '',
        syllabusFileName: '',
        maxEnrollmentLimit: '',
        schedule: '',
        mentorStatus: 'Pro Mentor',
        professionalTags: [],
        experienceMetrics: [],
        qualifications: [],
        totalSessions: '',
        modules: [],
      });
      await loadSubViewData();
      fetchDashboard(true);
    } catch (err: any) {
      console.error('Error submitting course:', err);
      toastError('Submission Error', err.response?.data?.message || err.message || 'Could not submit course.');
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handleOpenFeeModal = async (course: any) => {
    const targetCourseId = course._id || course.id;
    if (!targetCourseId) return;

    try {
      setProcessingFee(true);
      const feeRes = await instructorApi.createPublishingFeeOrder(targetCourseId);
      if (!feeRes.success || !feeRes.data) {
        throw new Error(feeRes.message || 'Failed to initialize payment with Cashfree.');
      }

      const orderData = feeRes.data;
      if (orderData.alreadyPaid && orderData.amount === 0) {
        success('Platform Fee Waived', 'Publishing fee is waived for free courses.');
        await loadSubViewData();
        return;
      }

      if (orderData.alreadyPaid && orderData.paymentStatus === 'SUCCESS') {
        success('Platform Fee Verified', 'Platform fee has already been verified.');
        await loadSubViewData();
        return;
      }

      if (!orderData.paymentSessionId) {
        throw new Error('Cashfree payment session ID was not received from gateway.');
      }

      const cfMode = orderData.environment === 'production' ? 'production' : 'sandbox';
      let cashfree: any = null;
      try {
        cashfree = await loadCashfree({ mode: cfMode });
      } catch (sdkErr) {
        console.warn('Cashfree SDK load notice:', sdkErr);
      }

      if (!cashfree) {
        throw new Error('Cashfree Payment Gateway SDK failed to initialize.');
      }

      let userDropped = false;
      try {
        const checkoutResult: any = await cashfree.checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: '_modal',
        });

        if (checkoutResult?.error) {
          console.warn('[Cashfree Checkout Event]:', checkoutResult.error);
          if (
            checkoutResult.error.code === 'USER_DROPPED' ||
            checkoutResult.error.message?.toLowerCase().includes('user dropped') ||
            checkoutResult.error.message?.toLowerCase().includes('closed') ||
            checkoutResult.error.message?.toLowerCase().includes('dismiss')
          ) {
            userDropped = true;
          }
        }
      } catch (checkoutErr: any) {
        console.warn('[Cashfree Checkout Warning]:', checkoutErr);
        if (
          checkoutErr?.message?.toLowerCase().includes('user dropped') ||
          checkoutErr?.message?.toLowerCase().includes('closed')
        ) {
          userDropped = true;
        }
      }

      if (userDropped) {
        toastError('Payment Incomplete', 'Payment modal was closed without completing payment.');
        setProcessingFee(false);
        return;
      }

      // Verify payment with server (no simulation)
      const statusRes = await instructorApi.getPublishingFeeStatus(targetCourseId, orderData.orderId);
      if (statusRes.data?.paymentStatus === 'SUCCESS') {
        success('Payment Verified Successfully! ✓', `Order ID: ${orderData.orderId}. Platform fee registered and credited to Super Admin.`);
      } else {
        info('Payment Update', statusRes.data?.message || 'Payment status updated.');
      }
      await loadSubViewData();
      fetchDashboard(true);
    } catch (err: any) {
      console.error('Error initiating Cashfree payment:', err);
      toastError('Payment Failed', err.response?.data?.message || err.message || 'Payment initiation failed.');
    } finally {
      setProcessingFee(false);
    }
  };

  const handlePublishLive = async (courseId: string) => {
    try {
      await instructorApi.publishCourse(courseId);
      success('🚀 Course is Live!', 'Your course is now officially live on the Home Page and Courses Catalog.');
      await loadSubViewData();
      fetchDashboard(true);
    } catch (err: any) {
      toastError('Publish Failed', err.response?.data?.message || err.message || 'Could not publish course.');
    }
  };

  const handleSubmitExistingForReview = async (courseId: string) => {
    try {
      await instructorApi.submitForReview(courseId);
      success('Submitted for Review', 'Course submitted to Super Admin for approval.');
      await loadSubViewData();
    } catch (err: any) {
      toastError('Submission Failed', err.response?.data?.message || err.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await instructorApi.updateProfile(profileData);
      if (res.success || res.status === 'success' || res.profile) {
        success('Profile Saved', 'Your instructor profile, bio, and verification details have been updated.');
        await loadSubViewData();
        fetchDashboard(true);
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toastError('Update Failed', err.response?.data?.message || err.message || 'Could not update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const instructorName = `${user?.firstName || 'Instructor'} ${user?.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex w-full font-sans text-slate-800 antialiased">
      {/* =========================================================================
          LEFT SIDEBAR NAVIGATION (Docked Edge-to-Edge Full Height)
         ========================================================================= */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen p-5 flex flex-col justify-between sticky top-0 h-screen z-30 shadow-xs">
        <div>
          {/* Logo Badge in Sidebar */}
          <div className="flex items-center gap-3 px-2 py-2 mb-6 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                Edu<span className="text-indigo-600">Tech</span>
              </span>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Instructor Studio</p>
            </div>
          </div>

          {/* Sidebar Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'courses', label: 'My Courses', icon: BookOpen },
              { id: 'create-course', label: 'Create Course', icon: PlusCircle },
              { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
              { id: 'webinars', label: 'Webinars', icon: Video },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
              { id: 'qa', label: 'Questions (Q&A)', icon: MessageSquare },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'profile', label: 'Profile & Verification', icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Profile Capsule & Sign Out at bottom of Sidebar */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
              {instructorName[0] || 'I'}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{instructorName}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">Instructor</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA (Edge-to-Edge Responsive, No Side Margins)
         ========================================================================= */}
      <main className="flex-1 p-6 sm:p-8 space-y-6 min-w-0 overflow-y-auto">
        {/* Top Search & Actions Bar (Image 1 Header) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search courses, students, webinars..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <NotificationBell />

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                {instructorName[0] || 'I'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{instructorName}</p>
                <p className="text-[10px] text-slate-500 font-medium">Instructor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Webinar Started Notification Banner */}
        <LiveStartedBanner />

        {/* Global Loading Spinner for Initial Data Fetch */}
        {loading && !dashboardData ? (
          <div className="py-32 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="text-xs font-bold text-slate-500">Loading your instructor studio...</p>
          </div>
        ) : (
          <>
        {/* =========================================================================
            VIEW 1: MAIN DASHBOARD (Image 1 Exact Layout)
           ========================================================================= */}
        {activeNav === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Welcome back, {user?.firstName || 'Instructor'}!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">Here's an overview of your teaching journey.</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                  <option value="1y">Last 1 Year</option>
                  <option value="all">All Time</option>
                </select>

                <button
                  onClick={() => fetchDashboard(false)}
                  disabled={refreshing}
                  className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 shadow-xs cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* 4 Live Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. My Courses */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-indigo-100 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-2xl font-black text-slate-900">{dashboardData?.metrics.totalCourses ?? 0}</p>
                <p className="text-xs font-semibold text-slate-500">My Courses</p>
                <button
                  onClick={() => setActiveNav('courses')}
                  className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  View Courses <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 2. Total Topics */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-100 transition-all">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <p className="text-2xl font-black text-slate-900">{dashboardData?.metrics.totalTopics ?? 0}</p>
                <p className="text-xs font-semibold text-slate-500">Total Topics</p>
                <button
                  onClick={() => setActiveNav('courses')}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  View Topics <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 3. Total Students */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-blue-100 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {(dashboardData?.metrics.totalStudents ?? 0).toLocaleString()}
                </p>
                <p className="text-xs font-semibold text-slate-500">Total Students</p>
                <button
                  onClick={() => setActiveNav('students')}
                  className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  View Students <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* 4. Average Rating */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:border-amber-100 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">
                  {dashboardData?.metrics.averageRating ? dashboardData.metrics.averageRating.toFixed(1) : '0.0'}
                </p>
                <p className="text-xs font-semibold text-slate-500">Average Rating</p>
                <button
                  onClick={() => setActiveNav('reviews')}
                  className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700 inline-flex items-center gap-1 cursor-pointer"
                >
                  View Reviews <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Middle Section: Growth Chart & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Student Growth Chart (7 Cols) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">Student Growth</h3>
                    <p className="text-xs text-slate-400 font-medium">Monthly progression & acquisition</p>
                  </div>
                  <select
                    value={growthMetric}
                    onChange={(e) => setGrowthMetric(e.target.value as any)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  >
                    <option value="students">Students</option>
                    <option value="revenue">Revenue (₹)</option>
                  </select>
                </div>

                <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 pt-4 border-b border-slate-100">
                  {(dashboardData?.charts.studentGrowth || []).map((item) => {
                    const maxVal = growthMetric === 'students' ? 1000 : 100000;
                    const val = growthMetric === 'students' ? item.students : item.revenue;
                    const heightPercent = val > 0 ? Math.min(Math.round((val / maxVal) * 100), 100) : 4;

                    return (
                      <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5 group">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[20px] bg-indigo-500 group-hover:bg-indigo-600 rounded-t-md transition-all duration-300 relative"
                        >
                          {val > 0 && (
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap pointer-events-none transition-opacity">
                              {growthMetric === 'students' ? val : `₹${(val / 1000).toFixed(0)}k`}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">{item.month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Students by Course & Quick Actions (5 Cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Students by Course */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                  <h3 className="font-bold text-slate-900 text-sm mb-3">Students by Course</h3>
                  {dashboardData?.charts.studentsByCourse && dashboardData.charts.studentsByCourse.length > 0 ? (
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-full border-8 border-indigo-500 border-t-cyan-400 border-r-emerald-400 border-b-amber-400 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-black text-slate-900">{dashboardData?.metrics.totalStudents ?? 0}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Students</span>
                      </div>
                      <div className="space-y-1.5 flex-1 text-xs">
                        {dashboardData.charts.studentsByCourse.map((item) => (
                          <div key={item.courseId} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                              <span className="text-slate-600 font-semibold truncate">{item.title}</span>
                            </div>
                            <span className="font-bold text-slate-900">{item.studentsCount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-4 text-center font-medium">No enrolled students yet.</p>
                  )}
                </div>

                {/* Quick Actions Card */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quick Actions</p>
                  <button
                    onClick={() => {
                      setActiveNav('create-course');
                      setCreateStep(1);
                    }}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Course</span>
                  </button>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setActiveNav('webinars');
                        setShowCreateWebinarModal(true);
                      }}
                      className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-100 cursor-pointer"
                    >
                      <Video className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Create Webinar</span>
                    </button>
                    <button
                      onClick={() => info('Resource Uploader', 'Resource uploader opened.')}
                      className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-slate-100 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Upload Resource</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Course Curriculum & Course Details */}
            {dashboardData?.activeCourse && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. Course Curriculum (Syllabus Accordion) (7 Cols) */}
                <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Course Curriculum (Syllabus)</h3>
                      <p className="text-xs text-slate-400 font-medium">Manage modules, topics and lesson materials</p>
                    </div>
                    <button
                      onClick={() => setShowAddModuleModal(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Module</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(dashboardData?.syllabus || []).map((mod) => {
                      const isExpanded = !!expandedModules[mod._id];
                      return (
                        <div key={mod._id} className="border border-slate-200 rounded-2xl overflow-hidden">
                          <button
                            onClick={() => toggleModuleAccordion(mod._id)}
                            className="w-full p-4 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                              )}
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{mod.title}</h4>
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {mod.topicsCount} Topics • {mod.lessonsCount} Lessons • {mod.duration}
                                </p>
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-4 bg-white divide-y divide-slate-100 space-y-3">
                              {mod.topics.map((top) => (
                                <div key={top._id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2.5">
                                    <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                                    <div>
                                      <p className="font-semibold text-slate-800">{top.title}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{top.duration} mins • {top.lessons?.length || 0} Lessons</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {top.isFree ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                        FREE PREVIEW
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                        ₹{top.price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Course Details & Dynamic Pricing Control (5 Cols) */}
                <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Course Details</h3>
                      <button
                        onClick={() => setActiveNav('create-course')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden h-36 bg-slate-900">
                      {dashboardData.activeCourse.thumbnail ? (
                        <img
                          src={dashboardData.activeCourse.thumbnail}
                          alt="Course Banner"
                          className="w-full h-full object-cover opacity-90"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          <span>No course thumbnail</span>
                        </div>
                      )}
                      <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white uppercase tracking-wider">
                        {dashboardData.activeCourse.status || 'Published'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {dashboardData.activeCourse.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-3 font-medium">
                        {dashboardData.activeCourse.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Pricing & Public Visibility Controls */}
                  <div className="pt-4 border-t border-slate-100 mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pricing</p>
                        {editingPrice ? (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-slate-700">₹</span>
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(Number(e.target.value))}
                              className="w-24 px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                            />
                            <button
                              onClick={handleSavePrice}
                              className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPrice(false)}
                              className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-xl font-extrabold text-slate-900 mt-0.5">₹{newPrice?.toLocaleString()}</p>
                        )}
                      </div>

                      {!editingPrice && (
                        <button
                          onClick={() => setEditingPrice(true)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Edit Price
                        </button>
                      )}
                    </div>

                    {/* Visibility Toggle */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Visibility</p>
                        <p className={`text-xs font-bold ${visibilityPublic ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {visibilityPublic ? 'Public' : 'Draft / Private'}
                        </p>
                      </div>

                      <button
                        onClick={handleToggleVisibility}
                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                          visibilityPublic ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                            visibilityPublic ? 'right-0.5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 2: MY COURSES (Image 3)
           ========================================================================= */}
        {activeNav === 'courses' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">My Courses</h2>
                <p className="text-xs text-slate-500 font-medium">Manage, edit and track the performance of your courses.</p>
              </div>

              <button
                onClick={() => {
                  setActiveNav('create-course');
                  setCreateStep(1);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Course</span>
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-1">
                {['ALL', 'PUBLISHED', 'DRAFT', 'UNDER_REVIEW', 'ARCHIVED'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setCourseStatusTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      courseStatusTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'ALL'
                      ? 'All Courses'
                      : tab === 'UNDER_REVIEW'
                      ? 'Under Review'
                      : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Development">Development</option>
                  <option value="Cloud Computing">Cloud Computing</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Design">Design</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by course title..."
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Publishing Fee</th>
                    <th className="py-3 px-4 text-right">Workflow & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coursesList.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        {c.thumbnail ? (
                          <img src={c.thumbnail} alt={c.title} className="w-14 h-9 rounded-lg object-cover" />
                        ) : (
                          <div className="w-14 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{c.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1 font-medium">{c.shortDescription}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{c.category}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">₹{c.coursePrice?.toLocaleString()}</td>
                      
                      {/* Approval Status Badge */}
                      <td className="py-3.5 px-4">
                        {c.approvalStatus === 'APPROVED' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Approved</span>
                          </span>
                        ) : c.approvalStatus === 'PENDING_APPROVAL' || c.status === 'PENDING_APPROVAL' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Pending Review</span>
                          </span>
                        ) : c.approvalStatus === 'REJECTED' ? (
                          <button
                            onClick={() => {
                              setRejectionModalCourse(c);
                              setShowRejectionModal(true);
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 hover:bg-rose-100 cursor-pointer"
                          >
                            <AlertTriangle className="w-3 h-3" />
                            <span>Rejected (View Reason)</span>
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Publishing Fee Status */}
                      <td className="py-3.5 px-4">
                        {c.publishingFeePaid ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            ₹499 Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                            Unpaid
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {/* Workflow Step 1: For Draft Courses - Require Cashfree Fee before Review Submission */}
                          {(!c.approvalStatus || c.approvalStatus === 'DRAFT') && (
                            <>
                              {!c.publishingFeePaid ? (
                                <button
                                  onClick={() => handleOpenFeeModal(c)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[11px] cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                                  title="Pay Cashfree Publishing Fee (₹499) to Unlock Review Submission"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>Pay Fee (₹499)</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSubmitExistingForReview(c._id)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[11px] cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                                  title="Submit to Super Admin for Approval"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Submit Review</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Workflow Step 2: For Approved Courses - Publish Live */}
                          {c.approvalStatus === 'APPROVED' && c.status !== 'PUBLISHED' && (
                            <button
                              onClick={() => handlePublishLive(c._id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1"
                              title="Make Course Live on Public Catalog"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Publish Live</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleEditCourse(c._id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg cursor-pointer transition-colors"
                            title="Edit Course & Curriculum"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => navigate(`/course/${c.slug || c._id}`)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(c._id, c.title)}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: CREATE / EDIT COURSE (9-STEP PROGRESSIVE WIZARD MATCHING IMAGE 1)
           ========================================================================= */}
        {activeNav === 'create-course' && (
          <div className="space-y-6 font-sans">
            {/* Top Bar Header with Title, Subtitle, and Action Buttons (Image 1) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3">
                {createStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCreateStep(createStep - 1)}
                    className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0"
                    title="Previous Step"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {editingCourseId ? `Edit Course: ${courseFormData.title || 'Untitled'}` : 'Create New Course'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                    Add all the details about your course. Complete each section to publish.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSubmitCourseForReview(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Save as Draft</span>
                </button>

                {createStep < 9 ? (
                  <button
                    type="button"
                    onClick={() => setCreateStep(createStep + 1)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : !wizardPublishingFeePaid ? (
                  <button
                    type="button"
                    onClick={handleWizardPayFee}
                    disabled={processingFee}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-60"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Fee (₹{(courseFormData.coursePrice > 0 ? Number((courseFormData.coursePrice * 0.10).toFixed(2)) : 0).toLocaleString('en-IN')}) to Unlock</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmittingCourse}
                    onClick={() => handleSubmitCourseForReview(false)}
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-70"
                  >
                    {isSubmittingCourse ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Course...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Submit for Super Admin Review</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stepper Progress Badges (9 Progressive Steps Matching Image 1) */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="flex items-center gap-2 min-w-max p-1 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                {[
                  { step: 1, label: 'Basic Information' },
                  { step: 2, label: 'Course Description' },
                  { step: 3, label: "What You'll Learn" },
                  { step: 4, label: 'Curriculum' },
                  { step: 5, label: 'Course Foundations' },
                  { step: 6, label: 'Requirements' },
                  { step: 7, label: 'This Course Includes' },
                  { step: 8, label: 'Media & Pricing' },
                  { step: 9, label: 'Review & Submit' },
                ].map((s) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCreateStep(s.step)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                      createStep === s.step
                        ? 'bg-blue-50 border border-blue-200 text-blue-700 shadow-2xs'
                        : createStep > s.step
                        ? 'bg-emerald-50/60 border border-emerald-100 text-emerald-800'
                        : 'bg-transparent border border-transparent text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                        createStep === s.step
                          ? 'bg-blue-600 text-white'
                          : createStep > s.step
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {createStep > s.step ? '✓' : s.step}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Step Container Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">

              {/* =========================================================================
                  STEP 1: BASIC INFORMATION (Image 1 Layout)
                 ========================================================================= */}
              {createStep === 1 && (
                <div className="space-y-6 text-xs">
                  {/* Step 1 Header Badge */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Basic Information</h3>
                      <p className="text-slate-500 font-medium text-xs">Add the main details of your course.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Title, Short Description, Full Description */}
                    <div className="lg:col-span-6 space-y-5">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5">Course Title *</label>
                        <input
                          type="text"
                          placeholder="e.g. Complete Web Development Bootcamp"
                          value={courseFormData.title}
                          onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-slate-800">Short Description *</label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {courseFormData.shortDescription.length}/150
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={150}
                          placeholder="Brief overview of the course (1-2 sentences)..."
                          value={courseFormData.shortDescription}
                          onChange={(e) => setCourseFormData({ ...courseFormData, shortDescription: e.target.value })}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs resize-none"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="font-bold text-slate-800">Full Description *</label>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {courseFormData.description.length}/3000
                          </span>
                        </div>

                        {/* Formatting Toolbar (Image 1) */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                          <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-600">
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                            <span className="w-px h-4 bg-slate-300 mx-1" />
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Bullet List"><List className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
                            <span className="w-px h-4 bg-slate-300 mx-1" />
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Insert Link"><Link2 className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Insert Video"><Video className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Code"><Code className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Quote"><Quote className="w-3.5 h-3.5" /></button>
                            <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold" title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></button>
                          </div>
                          <textarea
                            rows={6}
                            maxLength={3000}
                            placeholder="Provide a detailed description about your course, target audience, topics covered, and why students should take this course..."
                            value={courseFormData.description}
                            onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                            className="w-full p-3.5 bg-white font-medium text-slate-900 focus:outline-none leading-relaxed resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Thumbnail, Category, Level, Skills */}
                    <div className="lg:col-span-6 space-y-5">
                      {/* Thumbnail Box */}
                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5">Course Thumbnail Image *</label>

                        {courseFormData.thumbnail ? (
                          <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-100 border border-slate-200 group">
                            <img src={courseFormData.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setCourseFormData({ ...courseFormData, thumbnail: '' })}
                              className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-red-600/90 text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-2xl border-2 border-dashed border-blue-200/80 p-6 text-center bg-blue-50/20 flex flex-col items-center justify-center space-y-2">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">Drag & drop an image here</p>
                              <p className="text-[11px] text-slate-500 font-medium">or click to upload</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold">Recommended: 1280 × 720 (Max 5MB)</p>
                          </div>
                        )}

                        <div className="mt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setThumbUploadTab('device')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                thumbUploadTab === 'device'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <HardDrive className="w-3.5 h-3.5" />
                              <span>Upload from Device</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setThumbUploadTab('url')}
                              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                                thumbUploadTab === 'url'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              <Globe className="w-3.5 h-3.5" />
                              <span>From Web URL</span>
                            </button>
                          </div>

                          {thumbUploadTab === 'device' ? (
                            <label className="block w-full py-2 px-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl text-center text-xs font-bold text-slate-700 hover:text-blue-600 cursor-pointer transition-colors shadow-2xs">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleDeviceFileUpload}
                                className="hidden"
                              />
                              <span>Browse File from Device...</span>
                            </label>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="https://example.com/thumbnail.jpg"
                                value={thumbUrlInput}
                                onChange={(e) => setThumbUrlInput(e.target.value)}
                                className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={handleApplyWebUrl}
                                className="px-3.5 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                              >
                                Apply
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category & Subcategory */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1.5">Category *</label>
                          <select
                            value={courseFormData.category}
                            onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                          >
                            <option value="Development">Development</option>
                            <option value="Cloud Computing">Cloud Computing</option>
                            <option value="IT & Software">IT & Software</option>
                            <option value="Data Science">Data Science</option>
                            <option value="Design">Design</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 block mb-1.5">Subcategory *</label>
                          <input
                            type="text"
                            placeholder="e.g. Web Architecture, DevOps"
                            value={courseFormData.subcategory}
                            onChange={(e) => setCourseFormData({ ...courseFormData, subcategory: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* Level & Language */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1.5">Course Level *</label>
                          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {['Beginner', 'Intermediate', 'Advanced'].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, level: lvl })}
                                className={`py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  courseFormData.level === lvl
                                    ? 'bg-white text-blue-600 border border-blue-200 shadow-2xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 block mb-1.5">Language *</label>
                          <select
                            value={courseFormData.language}
                            onChange={(e) => setCourseFormData({ ...courseFormData, language: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                          >
                            <option value="English">English</option>
                            <option value="Hindi">Hindi</option>
                            <option value="Spanish">Spanish</option>
                            <option value="German">German</option>
                            <option value="French">French</option>
                          </select>
                        </div>
                      </div>

                      {/* Key Skills Taught */}
                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5">Key Skills Taught</label>
                        {courseFormData.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2 min-h-[38px] items-center">
                            {courseFormData.skills.map((s, idx) => (
                              <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center gap-1.5 border border-blue-100">
                                {s}
                                <button
                                  type="button"
                                  onClick={() => setCourseFormData({ ...courseFormData, skills: courseFormData.skills.filter((_, i) => i !== idx) })}
                                  className="text-blue-400 hover:text-red-500 font-bold cursor-pointer"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. React, Node.js, UI/UX, Data Analysis"
                            value={newSkillTagInput}
                            onChange={(e) => setNewSkillTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSkillTagInput.trim()) {
                                  setCourseFormData({ ...courseFormData, skills: [...courseFormData.skills, newSkillTagInput.trim()] });
                                  setNewSkillTagInput('');
                                }
                              }
                            }}
                            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newSkillTagInput.trim()) {
                                setCourseFormData({ ...courseFormData, skills: [...courseFormData.skills, newSkillTagInput.trim()] });
                                setNewSkillTagInput('');
                              }
                            }}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                          >
                            + Add
                          </button>
                        </div>
                      </div>

                      {/* Schedule & Deadline + Mentor Status Badge */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <div>
                          <label className="font-bold text-slate-800 block mb-1.5">
                            Schedule & Deadline <span className="text-slate-400 font-normal lowercase">(optional)</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Thursday, 5th September | 7:30PM"
                            value={courseFormData.schedule || ''}
                            onChange={(e) => setCourseFormData({ ...courseFormData, schedule: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Live batch cohort date or weekly schedule. Displays prominently on the course card.</p>
                        </div>

                        <div>
                          <label className="font-bold text-slate-800 block mb-1.5">Mentor Highlight Badge</label>
                          <select
                            value={courseFormData.mentorStatus || 'Pro Mentor'}
                            onChange={(e) => setCourseFormData({ ...courseFormData, mentorStatus: e.target.value })}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                          >
                            <option value="Pro Mentor">⭐ Pro Mentor</option>
                            <option value="Top 1% Mentor">🏆 Top 1% Mentor</option>
                            <option value="Master Instructor">🎓 Master Instructor</option>
                            <option value="Staff Specialist">💼 Staff Specialist</option>
                            <option value="Verified Creator">🛡️ Verified Creator</option>
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">Specialized badge displayed next to instructor name on the course card.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 2: COURSE DESCRIPTION
                 ========================================================================= */}
              {createStep === 2 && (
                <div className="space-y-6 text-xs max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Course Description & Strategy</h3>
                      <p className="text-slate-500 font-medium text-xs">Define detailed overview, target audience, course goals, and teaching methodology.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Detailed Course Overview *</label>
                      <textarea
                        rows={4}
                        placeholder="Provide an in-depth breakdown of the syllabus, real-world case studies, and engineering practices taught..."
                        value={courseFormData.detailedOverview || courseFormData.description}
                        onChange={(e) => setCourseFormData({ ...courseFormData, detailedOverview: e.target.value })}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs leading-relaxed"
                      />
                    </div>

                    {/* Target Audience List */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Target Audience</label>
                      {(courseFormData.targetAudience || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(courseFormData.targetAudience || []).map((aud, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 font-bold text-xs flex items-center gap-2 border border-indigo-100">
                              <span>• {aud}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, targetAudience: (courseFormData.targetAudience || []).filter((_, i) => i !== idx) })}
                                className="text-indigo-400 hover:text-red-500 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Aspiring Full-Stack Engineers, DevOps Beginners..."
                          value={newAudienceInput}
                          onChange={(e) => setNewAudienceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newAudienceInput.trim()) {
                                setCourseFormData({ ...courseFormData, targetAudience: [...(courseFormData.targetAudience || []), newAudienceInput.trim()] });
                                setNewAudienceInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newAudienceInput.trim()) {
                              setCourseFormData({ ...courseFormData, targetAudience: [...(courseFormData.targetAudience || []), newAudienceInput.trim()] });
                              setNewAudienceInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Audience
                        </button>
                      </div>
                    </div>

                    {/* Course Goals */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Course Goals & Milestones</label>
                      {(courseFormData.courseGoals || []).length > 0 && (
                        <div className="space-y-1.5 mb-2">
                          {(courseFormData.courseGoals || []).map((goal, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold text-slate-800">
                              <span>✓ {goal}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, courseGoals: (courseFormData.courseGoals || []).filter((_, i) => i !== idx) })}
                                className="text-slate-400 hover:text-red-500 font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Deploy 3 scalable applications to AWS cloud infrastructure..."
                          value={newGoalInput}
                          onChange={(e) => setNewGoalInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newGoalInput.trim()) {
                                setCourseFormData({ ...courseFormData, courseGoals: [...(courseFormData.courseGoals || []), newGoalInput.trim()] });
                                setNewGoalInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newGoalInput.trim()) {
                              setCourseFormData({ ...courseFormData, courseGoals: [...(courseFormData.courseGoals || []), newGoalInput.trim()] });
                              setNewGoalInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Goal
                        </button>
                      </div>
                    </div>

                    {/* Teaching Methodology */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Teaching Methodology</label>
                      <input
                        type="text"
                        placeholder="e.g. Hands-on coding exercises, production walkthroughs, architectural diagrams"
                        value={courseFormData.teachingMethodology || ''}
                        onChange={(e) => setCourseFormData({ ...courseFormData, teachingMethodology: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    {/* Professional Summary Tags (Corporate Experience Badges) */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Professional Summary Tags (Corporate Experience)
                      </label>
                      <p className="text-slate-400 text-[10px] mb-1.5">
                        High-trust corporate proof points shown on the course card (e.g., Ex-Apple, Full Stack Engineer, Senior Manager).
                      </p>
                      {courseFormData.professionalTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2 min-h-[38px] items-center">
                          {courseFormData.professionalTags.map((tag, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center gap-1.5 border border-indigo-100">
                              🏢 {tag}
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, professionalTags: courseFormData.professionalTags.filter((_, i) => i !== idx) })}
                                className="text-indigo-400 hover:text-red-500 font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Ex-Apple, MERN Developer, Senior Architect"
                          value={newProfessionalTagInput}
                          onChange={(e) => setNewProfessionalTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newProfessionalTagInput.trim()) {
                                setCourseFormData({ ...courseFormData, professionalTags: [...courseFormData.professionalTags, newProfessionalTagInput.trim()] });
                                setNewProfessionalTagInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newProfessionalTagInput.trim()) {
                              setCourseFormData({ ...courseFormData, professionalTags: [...courseFormData.professionalTags, newProfessionalTagInput.trim()] });
                              setNewProfessionalTagInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Tag
                        </button>
                      </div>
                    </div>

                    {/* Education & Qualifications Badges (Optional) */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1">
                        Education & Qualifications <span className="text-slate-400 font-normal lowercase">(optional - leave blank if not applicable)</span>
                      </label>
                      <p className="text-slate-400 text-[10px] mb-1.5">
                        Academic degrees or professional certifications (e.g., PG Diploma, Art & Design). Omitted from card if left empty.
                      </p>
                      {courseFormData.qualifications.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-2 min-h-[38px] items-center">
                          {courseFormData.qualifications.map((q, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 font-bold text-[11px] flex items-center gap-1.5 border border-purple-100">
                              🎓 {q}
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, qualifications: courseFormData.qualifications.filter((_, i) => i !== idx) })}
                                className="text-purple-400 hover:text-red-500 font-bold cursor-pointer"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. PG Diploma, Art & Design"
                          value={newQualificationInput}
                          onChange={(e) => setNewQualificationInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newQualificationInput.trim()) {
                                setCourseFormData({ ...courseFormData, qualifications: [...courseFormData.qualifications, newQualificationInput.trim()] });
                                setNewQualificationInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newQualificationInput.trim()) {
                              setCourseFormData({ ...courseFormData, qualifications: [...courseFormData.qualifications, newQualificationInput.trim()] });
                              setNewQualificationInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Credential
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 3: WHAT YOU'LL LEARN (Dynamic Learning Outcomes)
                 ========================================================================= */}
              {createStep === 3 && (
                <div className="space-y-6 text-xs max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">What You'll Learn (Learning Outcomes)</h3>
                      <p className="text-slate-500 font-medium text-xs">Add key concrete skills and competencies students will acquire upon completing this course.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {courseFormData.learningObjectives.length === 0 ? (
                      <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-2">
                        <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="font-bold text-slate-700">No Learning Outcomes Added Yet</p>
                        <p className="text-[11px] text-slate-400 font-medium">Add at least 3-4 bullet points to highlight the course value to students.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {courseFormData.learningObjectives.map((obj, idx) => (
                          <div key={idx} className="p-3.5 bg-white rounded-2xl border border-slate-200 flex items-start justify-between gap-3 shadow-2xs">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-semibold text-slate-800 text-xs leading-relaxed break-words">{obj}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCourseFormData({ ...courseFormData, learningObjectives: courseFormData.learningObjectives.filter((_, i) => i !== idx) })}
                              className="text-slate-400 hover:text-red-500 font-bold p-1 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="font-bold text-slate-800 block">Add Dynamic Learning Outcome</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Master React 19 Server Components and full-stack hydration strategies..."
                          value={newLearningObjectiveInput}
                          onChange={(e) => setNewLearningObjectiveInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newLearningObjectiveInput.trim()) {
                                setCourseFormData({ ...courseFormData, learningObjectives: [...courseFormData.learningObjectives, newLearningObjectiveInput.trim()] });
                                setNewLearningObjectiveInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newLearningObjectiveInput.trim()) {
                              setCourseFormData({ ...courseFormData, learningObjectives: [...courseFormData.learningObjectives, newLearningObjectiveInput.trim()] });
                              setNewLearningObjectiveInput('');
                            }
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Outcome
                        </button>
                      </div>
                    </div>

                    {/* Experience & Achievement Metrics (e.g. 18y Exp | Top 1% Mentor | 10x Engineer) */}
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="font-extrabold text-slate-900 block text-xs">
                            Experience & Achievement Metrics (Image 1 Feature)
                          </label>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Add key highlights displayed on course cards (e.g., 18y Exp, Top 1% Mentor, Technology Leader, 10x Engineer).
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {courseFormData.experienceMetrics.length} Highlights Added
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {courseFormData.experienceMetrics.map((metric, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs shadow-2xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{metric}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setCourseFormData({
                                  ...courseFormData,
                                  experienceMetrics: courseFormData.experienceMetrics.filter((_, i) => i !== idx),
                                });
                              }}
                              className="text-emerald-500 hover:text-emerald-800 cursor-pointer ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 18y Exp, Top 1% Mentor, 10x Engineer, Senior Architect..."
                          value={newExperienceMetricInput}
                          onChange={(e) => setNewExperienceMetricInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newExperienceMetricInput.trim()) {
                                setCourseFormData({
                                  ...courseFormData,
                                  experienceMetrics: [...courseFormData.experienceMetrics, newExperienceMetricInput.trim()],
                                });
                                setNewExperienceMetricInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newExperienceMetricInput.trim()) {
                              setCourseFormData({
                                ...courseFormData,
                                experienceMetrics: [...courseFormData.experienceMetrics, newExperienceMetricInput.trim()],
                              });
                              setNewExperienceMetricInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Metric
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 4: CURRICULUM (Modules, Topics, Lessons, Free Preview)
                 ========================================================================= */}
              {createStep === 4 && (
                <div className="space-y-6 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">Curriculum & Syllabus Structure</h3>
                        <p className="text-slate-500 font-medium text-xs">Add structured modules, atomic topics, durations, free preview toggles, and video lessons.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWizardModuleModal(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span> Add Module</span>
                    </button>
                  </div>

                  {courseFormData.modules.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                      <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                      <p className="font-black text-slate-700 text-sm">No curriculum modules added yet</p>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        Click "+ Add Module" above to start structuring your course into sequential learning modules.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {courseFormData.modules.map((mod, mIdx) => (
                        <div key={mIdx} className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-[11px] rounded-lg">
                                Module {mIdx + 1}
                              </span>
                              <h4 className="font-black text-slate-900 text-sm">
                                {mod.title.replace(/^Module\s*\d+\s*:\s*/i, '')}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModuleIndex(mIdx);
                                  setEditingTopicIndex(null);
                                  setWizardTopicForm({
                                    title: '',
                                    description: '',
                                    price: 0,
                                    isFree: false,
                                    duration: 30,
                                    videoUrl: '',
                                    videoSourceTab: 'url',
                                  });
                                  setWizardTopicModal(true);
                                }}
                                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                              >
                                + Add Topic / Lesson
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCourseFormData((prev) => ({
                                    ...prev,
                                    modules: prev.modules.filter((_, i) => i !== mIdx),
                                  }));
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 rounded-xl cursor-pointer hover:bg-red-50 transition-colors"
                                title="Delete Module"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {mod.topics.length === 0 ? (
                            <p className="text-slate-400 text-xs italic py-2 pl-2 border-l-2 border-slate-200">
                              No topics added to this module yet. Click "+ Add Topic / Lesson" to add content.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {mod.topics.map((top, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="p-3.5 bg-white rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-2xs"
                                >
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                      <span className="font-bold text-slate-900 text-xs">{tIdx + 1}. {top.title}</span>
                                      {top.videoUrl && (
                                        <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold inline-flex items-center gap-1">
                                          <Video className="w-3 h-3" /> Video Attached ({top.duration}m)
                                        </span>
                                      )}
                                    </div>
                                    {top.description && (
                                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed mt-1 break-words">
                                        {top.description}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                    <span
                                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        top.isFree
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-blue-50 text-blue-700'
                                      }`}
                                    >
                                      {top.isFree ? 'Free Preview' : `₹${top.price}`}
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedModuleIndex(mIdx);
                                        setEditingTopicIndex(tIdx);
                                        setWizardTopicForm({
                                          title: top.title || '',
                                          description: top.description || '',
                                          price: top.price ?? 0,
                                          isFree: !!top.isFree,
                                          duration: top.duration || 30,
                                          videoUrl: top.videoUrl || (top.lessons?.[0]?.videoUrl ?? ''),
                                          videoSourceTab: 'url',
                                        });
                                        setWizardTopicModal(true);
                                      }}
                                      className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 font-bold text-xs cursor-pointer transition-colors"
                                      title="Edit Topic"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCourseFormData((prev) => ({
                                          ...prev,
                                          modules: prev.modules.map((m, i) =>
                                            i === mIdx
                                              ? { ...m, topics: m.topics.filter((_, ti) => ti !== tIdx) }
                                              : m
                                          ),
                                        }));
                                      }}
                                      className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 font-bold text-xs cursor-pointer transition-colors"
                                      title="Remove Topic"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Live Syllabus Preview Summary */}
                  {courseFormData.modules.length > 0 && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-blue-900">
                          Automated Live Syllabus: {courseFormData.modules.length} Modules • {courseFormData.modules.reduce((acc, m) => acc + m.topics.length, 0)} Topics Configured
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-700">✓ Ready for pop-up syllabus preview</span>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  STEP 5: COURSE FOUNDATIONS
                 ========================================================================= */}
              {createStep === 5 && (
                <div className="space-y-6 text-xs max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Course Foundations</h3>
                      <p className="text-slate-500 font-medium text-xs">Outline foundational concepts covered, recommended prior knowledge, and core tools used.</p>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {/* Foundational Concepts */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Foundational Concepts Covered</label>
                      {(courseFormData.foundationalConcepts || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(courseFormData.foundationalConcepts || []).map((fc, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 font-bold text-xs flex items-center gap-2 border border-amber-200">
                              <span>• {fc}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, foundationalConcepts: (courseFormData.foundationalConcepts || []).filter((_, i) => i !== idx) })}
                                className="text-amber-500 hover:text-red-500 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. REST API Architecture, Relational Databases, Asynchronous JS..."
                          value={newFoundationalConceptInput}
                          onChange={(e) => setNewFoundationalConceptInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newFoundationalConceptInput.trim()) {
                                setCourseFormData({ ...courseFormData, foundationalConcepts: [...(courseFormData.foundationalConcepts || []), newFoundationalConceptInput.trim()] });
                                setNewFoundationalConceptInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-amber-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newFoundationalConceptInput.trim()) {
                              setCourseFormData({ ...courseFormData, foundationalConcepts: [...(courseFormData.foundationalConcepts || []), newFoundationalConceptInput.trim()] });
                              setNewFoundationalConceptInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Concept
                        </button>
                      </div>
                    </div>

                    {/* Recommended Prior Knowledge */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Recommended Prior Knowledge</label>
                      {(courseFormData.recommendedPriorKnowledge || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(courseFormData.recommendedPriorKnowledge || []).map((pk, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 border border-slate-200">
                              <span>• {pk}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, recommendedPriorKnowledge: (courseFormData.recommendedPriorKnowledge || []).filter((_, i) => i !== idx) })}
                                className="text-slate-400 hover:text-red-500 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Basic command line usage, HTML & CSS fundamentals..."
                          value={newPriorKnowledgeInput}
                          onChange={(e) => setNewPriorKnowledgeInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newPriorKnowledgeInput.trim()) {
                                setCourseFormData({ ...courseFormData, recommendedPriorKnowledge: [...(courseFormData.recommendedPriorKnowledge || []), newPriorKnowledgeInput.trim()] });
                                setNewPriorKnowledgeInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-slate-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newPriorKnowledgeInput.trim()) {
                              setCourseFormData({ ...courseFormData, recommendedPriorKnowledge: [...(courseFormData.recommendedPriorKnowledge || []), newPriorKnowledgeInput.trim()] });
                              setNewPriorKnowledgeInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Knowledge
                        </button>
                      </div>
                    </div>

                    {/* Core Tools / Technologies */}
                    <div>
                      <label className="font-bold text-slate-800 block mb-1.5">Core Tools & Technologies Used</label>
                      {(courseFormData.coreTools || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(courseFormData.coreTools || []).map((ct, idx) => (
                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 font-bold text-xs flex items-center gap-2 border border-blue-200">
                              <span>• {ct}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, coreTools: (courseFormData.coreTools || []).filter((_, i) => i !== idx) })}
                                className="text-blue-400 hover:text-red-500 font-bold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Visual Studio Code, Docker Desktop, Git, Postman..."
                          value={newCoreToolInput}
                          onChange={(e) => setNewCoreToolInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newCoreToolInput.trim()) {
                                setCourseFormData({ ...courseFormData, coreTools: [...(courseFormData.coreTools || []), newCoreToolInput.trim()] });
                                setNewCoreToolInput('');
                              }
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCoreToolInput.trim()) {
                              setCourseFormData({ ...courseFormData, coreTools: [...(courseFormData.coreTools || []), newCoreToolInput.trim()] });
                              setNewCoreToolInput('');
                            }
                          }}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Tool
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 6: REQUIREMENTS
                 ========================================================================= */}
              {createStep === 6 && (
                <div className="space-y-6 text-xs max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Requirements & Prerequisites</h3>
                      <p className="text-slate-500 font-medium text-xs">Specify hardware, software, and account prerequisites for enrolled students.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* General Prerequisites */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 block">General Prerequisites</label>
                        <span className="text-[10px] text-purple-600 font-semibold">Multiple items & Enter supported</span>
                      </div>
                      {(courseFormData.requirements || []).length > 0 && (
                        <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto">
                          {(courseFormData.requirements || []).map((req, idx) => (
                            <div key={idx} className="p-2.5 bg-purple-50/50 rounded-xl border border-purple-100 flex items-center justify-between text-xs font-semibold">
                              <span className="text-purple-950 leading-relaxed">• {req}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, requirements: (courseFormData.requirements || []).filter((_, i) => i !== idx) })}
                                className="text-purple-400 hover:text-red-500 font-bold p-1 cursor-pointer shrink-0"
                                title="Remove prerequisite"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Basic Python, Git basics (or paste comma/multiline list)..."
                          value={newPrerequisiteInput}
                          onChange={(e) => setNewPrerequisiteInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddPrerequisites();
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddPrerequisites}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Hardware Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 block">Hardware Requirements</label>
                        <span className="text-[10px] text-slate-400 font-semibold">Enter or comma-separated</span>
                      </div>
                      {(courseFormData.hardwareRequirements || []).length > 0 && (
                        <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto">
                          {(courseFormData.hardwareRequirements || []).map((hr, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-800 leading-relaxed">• {hr}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, hardwareRequirements: (courseFormData.hardwareRequirements || []).filter((_, i) => i !== idx) })}
                                className="text-slate-400 hover:text-red-500 font-bold p-1 cursor-pointer shrink-0"
                                title="Remove requirement"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 8GB RAM, 64-bit OS, 20GB Free Disk..."
                          value={newHardwareReqInput}
                          onChange={(e) => setNewHardwareReqInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddHardwareReqs();
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddHardwareReqs}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Software Requirements */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 block">Software Requirements</label>
                        <span className="text-[10px] text-slate-400 font-semibold">Enter or comma-separated</span>
                      </div>
                      {(courseFormData.softwareRequirements || []).length > 0 && (
                        <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto">
                          {(courseFormData.softwareRequirements || []).map((sr, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-800 leading-relaxed">• {sr}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, softwareRequirements: (courseFormData.softwareRequirements || []).filter((_, i) => i !== idx) })}
                                className="text-slate-400 hover:text-red-500 font-bold p-1 cursor-pointer shrink-0"
                                title="Remove requirement"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Node.js 20+, VS Code, Chrome browser..."
                          value={newSoftwareReqInput}
                          onChange={(e) => setNewSoftwareReqInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSoftwareReqs();
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddSoftwareReqs}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Required Accounts */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="font-bold text-slate-800 block">Required Accounts</label>
                        <span className="text-[10px] text-slate-400 font-semibold">Enter or comma-separated</span>
                      </div>
                      {(courseFormData.requiredAccounts || []).length > 0 && (
                        <div className="space-y-1.5 mb-2 max-h-48 overflow-y-auto">
                          {(courseFormData.requiredAccounts || []).map((ra, idx) => (
                            <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-semibold">
                              <span className="text-slate-800 leading-relaxed">• {ra}</span>
                              <button
                                type="button"
                                onClick={() => setCourseFormData({ ...courseFormData, requiredAccounts: (courseFormData.requiredAccounts || []).filter((_, i) => i !== idx) })}
                                className="text-slate-400 hover:text-red-500 font-bold p-1 cursor-pointer shrink-0"
                                title="Remove account"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Free GitHub account, AWS Free Tier..."
                          value={newRequiredAccountInput}
                          onChange={(e) => setNewRequiredAccountInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddRequiredAccounts();
                            }
                          }}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none shadow-2xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddRequiredAccounts}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 7: THIS COURSE INCLUDES
                 ========================================================================= */}
              {createStep === 7 && (
                <div className="space-y-6 text-xs max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 border border-cyan-100">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">This Course Includes</h3>
                      <p className="text-slate-500 font-medium text-xs">Configure the package value props, downloadable materials, projects, and certifications included in tuition.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="font-bold text-slate-800 block">Video Content</label>
                      <input
                        type="text"
                        placeholder="e.g. 24.5 Hours On-Demand HD Video"
                        value={courseFormData.courseIncludes.videoHours || ''}
                        onChange={(e) => setCourseFormData({ ...courseFormData, courseIncludes: { ...courseFormData.courseIncludes, videoHours: e.target.value } })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-cyan-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="font-bold text-slate-800 block">Downloadable Resources</label>
                      <input
                        type="text"
                        placeholder="e.g. 18 Source Code Repos & Cheatsheets"
                        value={courseFormData.courseIncludes.resourcesCount || ''}
                        onChange={(e) => setCourseFormData({ ...courseFormData, courseIncludes: { ...courseFormData.courseIncludes, resourcesCount: e.target.value } })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-cyan-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="font-bold text-slate-800 block">Hands-on Projects</label>
                      <input
                        type="text"
                        placeholder="e.g. 3 Production Capstone Projects"
                        value={courseFormData.courseIncludes.projectsCount || ''}
                        onChange={(e) => setCourseFormData({ ...courseFormData, courseIncludes: { ...courseFormData.courseIncludes, projectsCount: e.target.value } })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-cyan-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <label className="font-bold text-slate-800 block">Total Sessions (Optional)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 24 Sessions"
                        value={courseFormData.totalSessions || ''}
                        onChange={(e) => setCourseFormData({ ...courseFormData, totalSessions: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-cyan-500 focus:outline-none shadow-2xs"
                      />
                      <p className="text-[10px] text-slate-400">Total sessions badge shown on course cards (or calculated from curriculum).</p>
                    </div>
                  </div>

                  {/* Feature Toggles */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-cyan-400 shadow-2xs transition-colors">
                      <div>
                        <p className="font-bold text-slate-900">Certificate of Completion</p>
                        <p className="text-[10px] text-slate-400 font-medium">Verify completion on LinkedIn</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={courseFormData.courseIncludes.certificate}
                        onChange={(e) => setCourseFormData({ ...courseFormData, courseIncludes: { ...courseFormData.courseIncludes, certificate: e.target.checked } })}
                        className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                      />
                    </label>

                    <label className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-cyan-400 shadow-2xs transition-colors">
                      <div>
                        <p className="font-bold text-slate-900">Direct Q&A Support</p>
                        <p className="text-[10px] text-slate-400 font-medium">Instructor forum assistance</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={courseFormData.courseIncludes.qaSupport}
                        onChange={(e) => setCourseFormData({ ...courseFormData, courseIncludes: { ...courseFormData.courseIncludes, qaSupport: e.target.checked } })}
                        className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                      />
                    </label>

                    <label className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between cursor-pointer hover:border-cyan-400 shadow-2xs transition-colors">
                      <div>
                        <p className="font-bold text-slate-900">Full Lifetime Access</p>
                        <p className="text-[10px] text-slate-400 font-medium">No expiry on materials</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={courseFormData.courseIncludes.lifetimeAccess}
                        onChange={(e) => setCourseFormData({ ...courseFormData, courseIncludes: { ...courseFormData.courseIncludes, lifetimeAccess: e.target.checked } })}
                        className="w-4 h-4 text-cyan-600 rounded cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 8: MEDIA & PRICING
                 ========================================================================= */}
              {createStep === 8 && (
                <div className="space-y-6 text-xs max-w-4xl mx-auto">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Media, Pricing & Platform Share</h3>
                      <p className="text-slate-500 font-medium text-xs">Set promotional preview video, course pricing, and review the automatic 10% platform share.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Media & Promotional Video */}
                    <div className="space-y-4">
                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5">Promotional Preview Video URL</label>
                        <input
                          type="url"
                          placeholder="https://youtube.com/watch?v=... or Vimeo link"
                          value={courseFormData.promotionalVideo || ''}
                          onChange={(e) => setCourseFormData({ ...courseFormData, promotionalVideo: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">This teaser video will appear as the lead preview on the course catalog.</p>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5">Access Duration</label>
                        <select
                          value={courseFormData.accessDuration || 'Lifetime Access'}
                          onChange={(e) => setCourseFormData({ ...courseFormData, accessDuration: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
                        >
                          <option value="Lifetime Access">Full Lifetime Access</option>
                          <option value="1 Year Access">1 Year Access</option>
                          <option value="6 Months Access">6 Months Access</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-800 block mb-1.5">Attached Syllabus Document (Optional)</label>
                        <input
                          type="url"
                          placeholder="https://.../syllabus.pdf"
                          value={courseFormData.syllabusUrl || ''}
                          onChange={(e) => setCourseFormData({ ...courseFormData, syllabusUrl: e.target.value, syllabusFileName: 'Course_Syllabus.pdf' })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-blue-500 focus:outline-none shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Pricing Input & Dynamic Commission Breakdown */}
                    <div className="space-y-4">
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800">Course Price (INR ₹) *</label>
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-black text-[11px]">
                            {courseFormData.coursePrice === 0 ? 'FREE ACCESS' : `₹${courseFormData.coursePrice.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                        <input
                          type="text"
                          placeholder="0"
                          value={courseFormData.coursePrice === 0 ? '' : courseFormData.coursePrice}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                            setCourseFormData((prev) => ({
                              ...prev,
                              coursePrice: clean === '' ? 0 : Number(clean),
                            }));
                          }}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-black text-slate-900 text-xl focus:border-blue-500 focus:outline-none shadow-2xs"
                        />

                        {/* Commission Breakdown Card */}
                        {(() => {
                          const fee = courseFormData.coursePrice > 0 ? Number((courseFormData.coursePrice * 0.10).toFixed(2)) : 0;
                          const net = courseFormData.coursePrice > 0 ? Number((courseFormData.coursePrice * 0.90).toFixed(2)) : 0;
                          return (
                            <div className="pt-2 border-t border-slate-200 space-y-1.5 text-[11px]">
                              <div className="flex justify-between font-semibold text-slate-600">
                                <span>Platform Fee (10% Share):</span>
                                <span className="font-bold text-blue-600">₹{fee.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                              </div>
                              <div className="flex justify-between font-semibold text-slate-600">
                                <span>Your Net Payout (90% Share):</span>
                                <span className="font-bold text-emerald-600">₹{net.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Maximum Enrollment Limit (Optional Seat Cap) */}
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800">
                            Maximum Enrollment Limit (Optional)
                          </label>
                          {courseFormData.maxEnrollmentLimit ? (
                            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                              Capped at {courseFormData.maxEnrollmentLimit} Students
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                              Unlimited Seats
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g., 50 (Leave blank for unlimited access)"
                          value={courseFormData.maxEnrollmentLimit || ''}
                          onChange={(e) => {
                            const val = e.target.value.trim();
                            setCourseFormData((prev) => ({
                              ...prev,
                              maxEnrollmentLimit: val === '' ? '' : Math.max(1, parseInt(val, 10)),
                            }));
                          }}
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-base focus:border-indigo-500 focus:outline-none shadow-2xs"
                        />
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                          Restrict maximum student signups. Once active enrollments hit this limit, the course automatically locks with a <strong>"Sold Out / Course Full"</strong> badge.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================================
                  STEP 9: REVIEW & SUBMIT (Complete Course Review, Student Preview, Fee & Submit)
                 ========================================================================= */}
              {createStep === 9 && (
                <div className="space-y-6 text-xs pt-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">Step 9: Complete Course Review & Super Admin Submission</h3>
                      <p className="text-slate-500 font-medium">Verify all course parameters, inspect student view preview, settle 10% platform fee, and submit for review.</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      Step 9 of 9
                    </span>
                  </div>

                  {/* Summary Metric Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-slate-900">{courseFormData.modules.length}</p>
                      <p className="text-[11px] font-semibold text-slate-500">Modules Configured</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-blue-600">
                        {courseFormData.modules.reduce((acc, m) => acc + m.topics.length, 0)}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">Atomic Topics</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-purple-600">
                        {courseFormData.modules.reduce(
                          (acc, m) => acc + m.topics.reduce((tAcc, t) => tAcc + (t.duration || 30), 0),
                          0
                        )}m
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">Total Duration</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-emerald-600">
                        {courseFormData.coursePrice === 0 ? 'FREE' : `₹${courseFormData.coursePrice.toLocaleString('en-IN')}`}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">Tuition Price</p>
                    </div>
                  </div>

                  {/* Student View Live Interactive Card (Matching Image 1 Rich Card Spec) */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <h4 className="font-extrabold text-slate-900 text-sm">Student View Catalog Preview (Image 1 Layout)</h4>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400">Live Simulation</span>
                    </div>

                    <div className="max-w-md mx-auto sm:max-w-none bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        {/* Top Bar: Schedule & Deadline + Actionable Icons */}
                        <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 truncate">
                            <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="truncate">{courseFormData.schedule || 'Flexible Self-Paced Schedule'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-colors cursor-pointer"
                              title="Add to Wishlist"
                            >
                              <Heart className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
                              title="Bookmark"
                            >
                              <Bookmark className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail with Mentor Status & Category Badges */}
                        <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-900">
                          {courseFormData.thumbnail ? (
                            <img src={courseFormData.thumbnail} alt={courseFormData.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                              <ImageIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs font-bold">Course Thumbnail</span>
                            </div>
                          )}

                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                              {courseFormData.category}
                            </span>
                            {courseFormData.mentorStatus && (
                              <span className="px-2.5 py-0.5 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 shadow-xs">
                                <Sparkles className="w-3 h-3 fill-current" />
                                {courseFormData.mentorStatus}
                              </span>
                            )}
                          </div>

                          {courseFormData.maxEnrollmentLimit && (
                            <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-indigo-900/90 backdrop-blur-md text-white text-[10px] font-extrabold rounded-lg border border-indigo-500/30">
                              Seat Limit: {courseFormData.maxEnrollmentLimit}
                            </span>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4.5 space-y-3">
                          <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug">
                            {courseFormData.title || 'Untitled Course'}
                          </h3>

                          {/* Professional Summary Tags */}
                          {courseFormData.professionalTags && courseFormData.professionalTags.length > 0 && (
                            <div className="text-[11px] font-semibold text-slate-600 flex flex-wrap items-center gap-1">
                              {courseFormData.professionalTags.map((tag, idx) => (
                                <span key={idx} className="inline-flex items-center">
                                  <span>{tag}</span>
                                  {idx < courseFormData.professionalTags.length - 1 && (
                                    <span className="mx-1 text-slate-300 font-normal">|</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Experience & Achievement Metrics */}
                          {courseFormData.experienceMetrics && courseFormData.experienceMetrics.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {courseFormData.experienceMetrics.map((met, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-200/60 flex items-center gap-1"
                                >
                                  <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                  {met}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Education & Qualifications (Optional - Omitted if empty) */}
                          {courseFormData.qualifications && courseFormData.qualifications.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              {courseFormData.qualifications.map((q, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200/60"
                                >
                                  {q}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Structural Content Badges Row */}
                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sessions</p>
                                <p className="text-[11px] font-extrabold text-slate-800 truncate">
                                  {courseFormData.totalSessions || courseFormData.modules.reduce((a, m) => a + m.topics.length, 0) || 12}
                                </p>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                                <p className="text-[11px] font-extrabold text-slate-800 truncate">
                                  {courseFormData.courseIncludes.videoHours || '20+ Hrs'}
                                </p>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                              <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <div className="truncate">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Enrolled</p>
                                <p className="text-[11px] font-extrabold text-slate-800 truncate">
                                  {courseFormData.maxEnrollmentLimit ? `Max ${courseFormData.maxEnrollmentLimit}` : 'Active'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Formatted Rating Summary */}
                          <div className="flex items-center justify-between pt-1 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-extrabold text-slate-900">4.8</span>
                              <span className="text-[11px] text-slate-400 font-medium">(10.5k)</span>
                            </div>
                            <span className="text-slate-500 font-semibold text-[11px]">By {instructorName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Price & Sold Out / CTA State */}
                      <div className="px-4.5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tuition</p>
                          <p className="text-base font-black text-slate-900">
                            {courseFormData.coursePrice === 0 ? 'FREE' : `₹${courseFormData.coursePrice.toLocaleString('en-IN')}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                        >
                          Enroll Now
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Syllabus Preview Hierarchy */}
                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Course Curriculum (Syllabus Preview)</h4>

                      {courseFormData.modules.length === 0 ? (
                        <p className="text-slate-400 italic text-xs py-2">No modules added yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {courseFormData.modules.map((mod, mIdx) => (
                            <div key={mIdx} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-slate-900 text-xs">
                                  Module {mIdx + 1}: {mod.title.replace(/^Module\s*\d+\s*:\s*/i, '')}
                                </h5>
                                <span className="text-[11px] font-semibold text-slate-500">{mod.topics.length} Topics</span>
                              </div>
                              <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                                {mod.topics.map((t, tIdx) => (
                                  <div key={tIdx} className="flex items-center justify-between text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                                    <span>• {t.title}</span>
                                    <span className="font-semibold text-slate-500">{t.isFree ? 'Free Preview' : `₹${t.price}`}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Platform Publishing Fee Gatekeeper Card (10% Platform Fee - Genuine Cashfree Integration) */}
                    {(() => {
                      const dynamicFee = courseFormData.coursePrice > 0
                        ? Number((courseFormData.coursePrice * 0.10).toFixed(2))
                        : 0;
                      const instructorNet = courseFormData.coursePrice > 0
                        ? Number((courseFormData.coursePrice * 0.90).toFixed(2))
                        : 0;

                      return (
                        <div className="space-y-4">
                          {/* 1. STATE: SUCCESS / PAID */}
                          {(cashfreePaymentState === 'SUCCESS' || wizardPublishingFeePaid) && (
                            <div className="p-6 rounded-2xl border bg-emerald-50/90 border-emerald-300 text-emerald-950 space-y-4 shadow-sm animate-in fade-in">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                                    <CheckCircle2 className="w-6 h-6" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-base text-emerald-950">
                                        ✓ Payment Successful
                                      </h4>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-400">
                                        Cashfree Verified • PAID
                                      </span>
                                    </div>
                                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                                      Course is verified and ready for submission. Your 10% platform publishing fee has been confirmed by Cashfree PG.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 rounded-xl bg-white/90 border border-emerald-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Platform Fee Paid</span>
                                  <p className="font-black text-emerald-700 text-base">
                                    ₹{(verifiedPaymentData?.amount ?? dynamicFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Order ID</span>
                                  <p className="font-mono font-bold text-slate-800 text-xs truncate">
                                    {verifiedPaymentData?.orderId || feeOrderData?.orderId || 'PUBFEE_VERIFIED'}
                                  </p>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Payment ID</span>
                                  <p className="font-mono font-bold text-slate-800 text-xs truncate">
                                    {verifiedPaymentData?.paymentId || 'CF_PAID_CONFIRMED'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. STATE: PROCESSING PAYMENT */}
                          {cashfreePaymentState === 'PROCESSING' && !wizardPublishingFeePaid && (
                            <div className="p-6 rounded-2xl border bg-blue-50 border-blue-300 text-blue-950 space-y-4 shadow-sm animate-in fade-in">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse shadow-md shadow-blue-600/20">
                                  <RefreshCw className="w-6 h-6 animate-spin" />
                                </div>
                                <div>
                                  <h4 className="font-black text-base text-blue-950">Processing Payment</h4>
                                  <p className="text-xs text-blue-700 font-medium">
                                    Waiting for payment confirmation from Cashfree Payment Gateway... Do not close this window.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. STATE: PENDING VERIFICATION */}
                          {cashfreePaymentState === 'PENDING' && !wizardPublishingFeePaid && (
                            <div className="p-6 rounded-2xl border bg-amber-50 border-amber-300 text-amber-950 space-y-4 shadow-sm animate-in fade-in">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                                    <Clock className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-base text-amber-950">Payment Verification Pending</h4>
                                    <p className="text-xs text-amber-800 font-medium">
                                      Cashfree is still processing the payment. Please wait or check status.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => verifyBackendPaymentStatus(editingCourseId || '', feeOrderData?.orderId)}
                                  disabled={processingFee}
                                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
                                >
                                  <RefreshCw className={`w-3.5 h-3.5 ${processingFee ? 'animate-spin' : ''}`} />
                                  <span>Check Payment Status</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 4. STATE: FAILED */}
                          {cashfreePaymentState === 'FAILED' && !wizardPublishingFeePaid && (
                            <div className="p-6 rounded-2xl border bg-rose-50 border-rose-300 text-rose-950 space-y-4 shadow-sm animate-in fade-in">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                                    <X className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-base text-rose-950">✕ Payment Failed</h4>
                                    <p className="text-xs text-rose-700 font-medium">
                                      Payment failed. No platform fee was charged successfully. Please try again.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleWizardPayFee}
                                  disabled={processingFee}
                                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Try Again</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 5. STATE: USER DROPPED */}
                          {cashfreePaymentState === 'USER_DROPPED' && !wizardPublishingFeePaid && (
                            <div className="p-6 rounded-2xl border bg-slate-100 border-slate-300 text-slate-900 space-y-4 shadow-sm animate-in fade-in">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-slate-700 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <AlertTriangle className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-base text-slate-900">Payment Not Completed</h4>
                                    <p className="text-xs text-slate-600 font-medium">
                                      You exited the payment process. No successful payment was recorded.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleWizardPayFee}
                                  disabled={processingFee}
                                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                  <span>Try Again</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 6. STATE: EXPIRED */}
                          {cashfreePaymentState === 'EXPIRED' && !wizardPublishingFeePaid && (
                            <div className="p-6 rounded-2xl border bg-amber-50 border-amber-300 text-amber-950 space-y-4 shadow-sm animate-in fade-in">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                                    <Clock className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-base text-amber-950">Payment Session Expired</h4>
                                    <p className="text-xs text-amber-700 font-medium">
                                      The Cashfree checkout session expired. A fresh payment session will be created.
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleWizardPayFee}
                                  disabled={processingFee}
                                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Try Again</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 7. STATE: IDLE (BEFORE PAYMENT) */}
                          {cashfreePaymentState === 'IDLE' && !wizardPublishingFeePaid && (
                            <div className="p-6 rounded-2xl border bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border-blue-200 text-slate-800 space-y-4">
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5">
                                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20">
                                    <CreditCard className="w-6 h-6" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-black text-base text-slate-900">
                                        Platform Publishing Fee
                                      </h4>
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                                        10% Share • Cashfree PG
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                                      {courseFormData.coursePrice === 0
                                        ? 'This is a free course (₹0), so the platform fee is waived (₹0).'
                                        : `Instructors pay a 10% platform fee of ₹${dynamicFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })} via Cashfree gateway before submitting the course for Super Admin review.`}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleWizardPayFee}
                                  disabled={processingFee}
                                  className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
                                >
                                  {processingFee ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CreditCard className="w-4 h-4" />
                                  )}
                                  <span>
                                    {checkoutButtonStep === 'CREATING'
                                      ? 'Creating Payment...'
                                      : checkoutButtonStep === 'OPENING'
                                      ? 'Opening Secure Checkout...'
                                      : `Pay Platform Fee ₹${dynamicFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                                  </span>
                                </button>
                              </div>

                              {/* Fee Calculation Breakdown Card */}
                              <div className="p-4 bg-white/90 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div className="space-y-0.5">
                                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Course Price</span>
                                  <p className="font-black text-slate-900 text-sm">
                                    {courseFormData.coursePrice > 0 ? `₹${courseFormData.coursePrice.toLocaleString('en-IN')}` : 'FREE (₹0)'}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider">Platform Fee (10%)</span>
                                  <p className="font-black text-blue-700 text-sm">
                                    ₹{dynamicFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Total Payable</span>
                                  <p className="font-black text-emerald-700 text-base">
                                    ₹{dynamicFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Final Actions in Step 9 */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setCreateStep(4)}
                        className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        ← Edit Curriculum
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmitCourseForReview(true)}
                        className="w-full sm:w-auto px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                      >
                        Save as Draft
                      </button>

                      {!wizardPublishingFeePaid ? (
                        <button
                          type="button"
                          onClick={handleWizardPayFee}
                          disabled={processingFee}
                          className="w-full sm:w-auto px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 border border-slate-300"
                          title="Pay 10% platform fee via Cashfree above to unlock submission"
                        >
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span>Submit for Review (Pay Fee to Unlock)</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmittingCourse}
                          onClick={() => handleSubmitCourseForReview(false)}
                          className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                          {isSubmittingCourse ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Submitting Course to Super Admin...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Submit for Super Admin Review</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3.5: QUIZZES & QUESTION BANK STUDIO
           ========================================================================= */}
        {activeNav === 'quizzes' && (
          <InstructorQuizStudio courses={dashboardData?.myCourses || []} />
        )}

        {/* =========================================================================
            VIEW 4: WEBINARS (Image 2)
           ========================================================================= */}
        {activeNav === 'webinars' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">My Webinars</h2>
                <p className="text-xs text-slate-500 font-medium">Create, manage and host live workshops and sessions.</p>
              </div>
              <button
                onClick={() => setShowCreateWebinarModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Webinar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-700">
                <p className="text-2xl font-black">{webinarCounts.all ?? 0}</p>
                <p className="font-semibold text-slate-600">Total Webinars</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700">
                <p className="text-2xl font-black">{webinarCounts.upcoming ?? 0}</p>
                <p className="font-semibold text-slate-600">Upcoming</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-700">
                <p className="text-2xl font-black">
                  {webinarCounts.totalRegistrations ??
                    webinarsList.reduce((acc, w) => acc + (w.registrations?.length || 0), 0)}
                </p>
                <p className="font-semibold text-slate-600">Total Registrations</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-700">
                <p className="text-2xl font-black">{webinarCounts.averageRating ?? '0.0'}</p>
                <p className="font-semibold text-slate-600">Average Rating</p>
              </div>
            </div>

            {/* Status Filter Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-1">
                {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setWebinarsTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      webinarsTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Webinars' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search webinars..."
                  value={webinarSearch}
                  onChange={(e) => setWebinarSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-3 px-4">Webinar Title</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Registrations</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Meeting Link</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {webinarsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No webinars found. Click "+ Create Webinar" to schedule a session.
                      </td>
                    </tr>
                  ) : (
                    webinarsList.map((w) => {
                      const nowMs = Date.now();
                      const startMs = new Date(w.startTime).getTime();
                      const endMs = new Date(w.endTime || startMs + 7200000).getTime();
                      const isExpired = nowMs > endMs;
                      const isStarted =
                        !isExpired &&
                        (w.isLive ||
                        w.status === 'LIVE' ||
                        w.status === 'Started' ||
                        (startMs <= nowMs && endMs >= nowMs));

                      return (
                        <tr key={w._id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{w.title}</div>
                            <span className="text-[10px] text-slate-400 font-semibold">{w.category}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            <div className="font-bold text-slate-800">
                              Start: {new Date(w.startTime).toLocaleDateString()} {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                              Expiry: {new Date(endMs).toLocaleDateString()} {new Date(endMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-600">
                            {Math.max(w.registrationsCount ?? 0, w.registrations?.length ?? 0, w.attendanceCount ?? 0, w.attendance?.length ?? 0)}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{w.capacity || 100}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isExpired
                                  ? 'bg-slate-100 text-slate-600'
                                  : isStarted
                                  ? 'bg-emerald-100 text-emerald-800 animate-pulse flex items-center gap-1 w-fit'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isExpired ? (
                                'COMPLETED'
                              ) : isStarted ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                  <span>Started</span>
                                </>
                              ) : (
                                w.status || 'SCHEDULED'
                              )}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {w.meetingUrl ? (
                              w.meetingUrl.startsWith('/webinars/live/') || w.meetingUrl.startsWith('/webinar/live/') ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(w.meetingUrl)}
                                  className="text-indigo-600 hover:text-indigo-800 underline font-bold max-w-[140px] truncate block text-left cursor-pointer text-xs"
                                >
                                  In-Platform Room ↗
                                </button>
                              ) : (
                                <a
                                  href={w.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-indigo-600 hover:text-indigo-800 underline font-semibold max-w-[140px] truncate block text-xs"
                                >
                                  External Link ↗
                                </a>
                              )
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Not configured</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {w.meetingUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (w.meetingUrl.startsWith('/webinars/live/') || w.meetingUrl.startsWith('/webinar/live/')) {
                                      navigate(w.meetingUrl);
                                    } else {
                                      window.open(w.meetingUrl, '_blank');
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 text-white font-extrabold rounded-lg hover:bg-indigo-700 transition cursor-pointer text-[11px] flex items-center gap-1 shadow-xs"
                                >
                                  <Video className="w-3 h-3" />
                                  <span>Host Room</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const localIso = w.startTime
                                    ? new Date(new Date(w.startTime).getTime() - new Date().getTimezoneOffset() * 60000)
                                        .toISOString()
                                        .slice(0, 16)
                                    : '';
                                  const localEndIso = w.endTime
                                    ? new Date(new Date(w.endTime).getTime() - new Date().getTimezoneOffset() * 60000)
                                        .toISOString()
                                        .slice(0, 16)
                                    : (w.startTime ? new Date(new Date(w.startTime).getTime() + 7200000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
                                  setEditingWebinar({
                                    ...w,
                                    startTime: localIso,
                                    endTime: localEndIso,
                                  });
                                  setShowEditWebinarModal(true);
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition cursor-pointer text-[11px] inline-flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWebinar(w._id, w.title)}
                                className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                                title="Delete webinar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 5: STUDENTS ROSTER (Image 2)
           ========================================================================= */}
        {activeNav === 'students' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">My Students</h2>
              <p className="text-xs text-slate-500 font-medium">View and manage students enrolled in your courses.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-blue-50 text-blue-700">
                <p className="text-2xl font-black">{studentCounts.all ?? 0}</p>
                <p className="font-semibold text-slate-600">Total Students</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700">
                <p className="text-2xl font-black">{studentCounts.active ?? 0}</p>
                <p className="font-semibold text-slate-600">Active Students</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-700">
                <p className="text-2xl font-black">{studentCounts.completed ?? 0}</p>
                <p className="font-semibold text-slate-600">Completed</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-700">
                <p className="text-2xl font-black">{studentCounts.averageEngagement ?? '0.0'}</p>
                <p className="font-semibold text-slate-600">Average Engagement</p>
              </div>
            </div>

            {/* Status Filter Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-1">
                {['ALL', 'ACTIVE', 'COMPLETED'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStudentsTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      studentsTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'ALL' ? 'All Students' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Enrolled Course</th>
                    <th className="py-3 px-4">Progress</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsList.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-[10px] text-slate-400">{s.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{s.enrolledCourse}</td>
                      <td className="py-3.5 px-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div style={{ width: `${s.progress}%` }} className="h-full bg-indigo-600 rounded-full" />
                          </div>
                          <span className="font-bold text-slate-700 text-[11px]">{s.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6: STUDENT QUESTIONS (Q&A - Image 2)
           ========================================================================= */}
        {activeNav === 'qa' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Student Questions (Q&A)</h2>
                <p className="text-xs text-slate-500 font-medium">Answer questions asked by students across your courses.</p>
              </div>
            </div>

            {/* Status Filter Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-1">
                {['ALL', 'UNANSWERED', 'ANSWERED'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setQaTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      qaTab === tab
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {tab === 'ALL'
                      ? `All (${qaCounts.all ?? questionsList.length})`
                      : tab === 'UNANSWERED'
                      ? `Unanswered (${qaCounts.unanswered ?? 0})`
                      : `Answered (${qaCounts.answered ?? 0})`}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={qaSearch}
                  onChange={(e) => setQaSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
            </div>
            <div className="space-y-4">
              {questionsList.map((q) => (
                <div key={q._id} className="p-5 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-600">{q.courseTitle}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      q.status === 'Answered' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {q.status}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900">{q.question}</p>

                  {q.answers && q.answers.length > 0 && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-slate-700">
                      <p className="font-bold text-emerald-800">Your Answer:</p>
                      <p>{q.answers[0].answer}</p>
                    </div>
                  )}

                  {answeringQuestionId === q._id ? (
                    <div className="space-y-2 pt-2">
                      <textarea
                        rows={3}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your explanation and response..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAnsweringQuestionId(null)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleAnswerSubmit(q._id)}
                          className="px-4 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          Submit Answer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setAnsweringQuestionId(q._id);
                          setAnswerText('');
                        }}
                        className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-lg cursor-pointer"
                      >
                        {q.status === 'Answered' ? 'Edit Answer' : 'Answer Question'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6B: REVIEWS & RATINGS (Image 3)
           ========================================================================= */}
        {activeNav === 'reviews' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Reviews & Ratings</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Track student feedback, course ratings, and reviews in real time.
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-700">
                <div className="flex items-center gap-1.5 mb-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-2xl font-black">
                    {Number(reviewsMetrics.averageRating || 0).toFixed(1)}
                  </span>
                </div>
                <p className="font-semibold text-slate-600">Average Rating</p>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-700">
                <p className="text-2xl font-black">{reviewsMetrics.totalReviews ?? 0}</p>
                <p className="font-semibold text-slate-600">Total Reviews</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700">
                <p className="text-2xl font-black">{reviewsMetrics.verifiedPurchases ?? 0}</p>
                <p className="font-semibold text-slate-600">Verified Enrollees</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-700 flex flex-col justify-center gap-1">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviewsMetrics.distribution?.[stars] || 0;
                  const pct =
                    reviewsMetrics.totalReviews > 0
                      ? Math.round((count / reviewsMetrics.totalReviews) * 100)
                      : 0;
                  return (
                    <div key={stars} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                      <span className="w-4">{stars}★</span>
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div style={{ width: `${pct}%` }} className="h-full bg-amber-400 rounded-full" />
                      </div>
                      <span className="w-6 text-right text-slate-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Filter Tabs & Search */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setReviewRatingFilter(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    reviewRatingFilter === null
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  All ({reviewsMetrics.totalReviews ?? 0})
                </button>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setReviewRatingFilter(rating)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      reviewRatingFilter === rating
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <span>{rating}★</span>
                    <span>({reviewsMetrics.distribution?.[rating] || 0})</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={reviewSearch}
                  onChange={(e) => setReviewSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium"
                />
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <Star className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                  <p className="font-bold text-slate-600">No reviews found</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Student reviews on your published courses will appear here in real time.
                  </p>
                </div>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev._id} className="p-4 rounded-2xl border border-slate-100 hover:border-slate-200 transition bg-slate-50/50 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                          {rev.user?.name?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{rev.user?.name || 'Student'}</p>
                          <p className="text-[10px] text-indigo-600 font-semibold">{rev.course?.title || 'Enrolled Course'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 6C: ANALYTICS TAB
           ========================================================================= */}
        {activeNav === 'analytics' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-900">Performance Analytics</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Detailed telemetry, revenue, and enrollment metrics for your courses and webinars.
                </p>
              </div>

              {/* Timeframe Selector */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                {['7d', '30d', '90d', '1y'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setAnalyticsTimeframe(tf)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      analyticsTimeframe === tf
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tf.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-700">
                <p className="text-2xl font-black">
                  ₹{(
                    (analyticsData?.courses || analyticsData?.coursePerformance)?.length > 0
                      ? (analyticsData?.courses || analyticsData?.coursePerformance).reduce(
                          (sum: number, c: any) => sum + (c.revenue || 0),
                          0
                        )
                      : ((analyticsData?.metrics?.totalRevenue ?? analyticsData?.totalRevenue) || 0)
                  ).toLocaleString('en-IN')}
                </p>
                <p className="font-semibold text-slate-600">Total Revenue</p>
              </div>
              <div className="p-4 rounded-2xl bg-teal-50 text-teal-700">
                <p className="text-2xl font-black">
                  ₹{(
                    analyticsData?.metrics?.netEarnings ??
                    analyticsData?.netEarnings ??
                    Math.round(
                      ((analyticsData?.courses || analyticsData?.coursePerformance)?.length > 0
                        ? (analyticsData?.courses || analyticsData?.coursePerformance).reduce(
                            (sum: number, c: any) => sum + (c.revenue || 0),
                            0
                          )
                        : ((analyticsData?.metrics?.totalRevenue ?? analyticsData?.totalRevenue) || 0)) * 0.8
                    )
                  ).toLocaleString('en-IN')}
                </p>
                <p className="font-semibold text-slate-600">Net Earnings</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700">
                <p className="text-2xl font-black">
                  {analyticsData?.metrics?.activeStudents ?? analyticsData?.metrics?.totalStudents ?? analyticsData?.activeStudents ?? analyticsData?.totalStudents ?? 0}
                </p>
                <p className="font-semibold text-slate-600">Active Students</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-700">
                <p className="text-2xl font-black">
                  {analyticsData?.metrics?.activeCourses ?? analyticsData?.metrics?.totalCourses ?? analyticsData?.activeCourses ?? analyticsData?.totalCourses ?? 0}
                </p>
                <p className="font-semibold text-slate-600">Active Courses</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-700">
                <p className="text-2xl font-black">
                  {analyticsData?.metrics?.totalWebinars ?? analyticsData?.totalWebinars ?? analyticsData?.webinarsHosted ?? 0}
                </p>
                <p className="font-semibold text-slate-600">Webinars Hosted</p>
              </div>
            </div>

            {/* Course Performance Breakdown Table */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">Course Performance Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100">
                      <th className="py-3 px-4">Course Title</th>
                      <th className="py-3 px-4">Enrolled Students</th>
                      <th className="py-3 px-4">Revenue Generated</th>
                      <th className="py-3 px-4">Average Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!analyticsData?.courses && !analyticsData?.coursePerformance) ||
                    ((analyticsData?.courses || analyticsData?.coursePerformance || []).length === 0) ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                          No course analytics available yet.
                        </td>
                      </tr>
                    ) : (
                      (analyticsData?.courses || analyticsData?.coursePerformance || []).map((c: any) => (
                        <tr key={c.id || c._id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {c.studentsCount ?? c.enrolledStudents ?? 0}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            ₹{(c.revenue || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              ★ {Number(c.rating ?? c.averageRating ?? 5.0).toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 7: PROFILE & 4-TIER VERIFICATION (Image 2 Redesigned)
           ========================================================================= */}
        {activeNav === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Profile & Verification</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Manage your public instructor profile, professional bio, photo, and 4-tier platform verification status.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 self-start sm:self-auto"
              >
                {isSavingProfile ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
              {/* Left Column: Personal Information & Profile Photo */}
              <div className="lg:col-span-4 space-y-5 bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Personal Information</span>
                </h3>

                {/* Profile Photo Display with Direct Upload / URL Trigger */}
                <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  {profileData.profilePhoto ? (
                    <img
                      src={profileData.profilePhoto}
                      alt={profileData.fullName || instructorName}
                      className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-200 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 text-white font-black text-3xl flex items-center justify-center shadow-md shadow-indigo-600/20">
                      {(profileData.fullName || instructorName)[0] || 'I'}
                    </div>
                  )}

                  <div className="w-full space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-slate-600 block text-center">
                      Profile Photo URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://.../photo.jpg"
                      value={profileData.profilePhoto || ''}
                      onChange={(e) => setProfileData({ ...profileData, profilePhoto: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={profileData.fullName || instructorName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Professional Headline / Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Technology Lead & Cloud Architect"
                      value={profileData.headline || ''}
                      onChange={(e) => setProfileData({ ...profileData, headline: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Email Address (Primary)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || profileData.email || ''}
                      className="w-full p-2.5 bg-slate-100/80 border border-slate-200 rounded-xl text-slate-500 font-semibold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+91 98765 43210"
                      value={profileData.phone || ''}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Middle Column: Professional Bio, Experience & Expertise */}
              <div className="lg:col-span-5 space-y-5 bg-slate-50/70 p-6 rounded-3xl border border-slate-200/80">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  <span>Professional Details</span>
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700">Instructor Bio *</label>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {(profileData.bio || '').length} characters
                      </span>
                    </div>
                    <textarea
                      rows={5}
                      placeholder="Write a compelling bio highlighting your engineering career, teaching philosophy, and specializations..."
                      value={profileData.bio || ''}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="w-full p-3 bg-white border border-slate-200 rounded-2xl font-medium text-slate-800 focus:border-indigo-500 focus:outline-none shadow-2xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Areas of Expertise & Skills</label>
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-white border border-slate-200 rounded-2xl mb-2 shadow-2xs min-h-[42px] items-center">
                      {(profileData.expertise || []).map((exp: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100 flex items-center gap-1.5"
                        >
                          <span>{exp}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = (profileData.expertise || []).filter((_: any, i: number) => i !== idx);
                              setProfileData({ ...profileData, expertise: filtered });
                            }}
                            className="text-indigo-400 hover:text-indigo-800 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add skill (e.g. Kubernetes, React)..."
                        value={newExpertiseInput}
                        onChange={(e) => setNewExpertiseInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newExpertiseInput.trim()) {
                              const current = Array.isArray(profileData.expertise) ? profileData.expertise : [];
                              if (!current.includes(newExpertiseInput.trim())) {
                                setProfileData({ ...profileData, expertise: [...current, newExpertiseInput.trim()] });
                              }
                              setNewExpertiseInput('');
                            }
                          }
                        }}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newExpertiseInput.trim()) {
                            const current = Array.isArray(profileData.expertise) ? profileData.expertise : [];
                            if (!current.includes(newExpertiseInput.trim())) {
                              setProfileData({ ...profileData, expertise: [...current, newExpertiseInput.trim()] });
                            }
                            setNewExpertiseInput('');
                          }
                        }}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Current Organization</label>
                      <input
                        type="text"
                        placeholder="e.g. Tech Solutions Pvt Ltd"
                        value={profileData.currentOrganization || ''}
                        onChange={(e) => setProfileData({ ...profileData, currentOrganization: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Total Experience</label>
                      <input
                        type="text"
                        placeholder="e.g. 8+ Years"
                        value={profileData.experience || ''}
                        onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic 4-Tier Verification Status */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verification Status</span>
                </h3>

                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-900">Identity Verification</p>
                    <p className="text-[11px] text-slate-500 font-medium">Verify your official government ID</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-900">Instructor Verification</p>
                    <p className="text-[11px] text-slate-500 font-medium">Platform review of your credentials</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-200 text-amber-800 border border-amber-300">
                    {profileData.verificationStatus === 'VERIFIED' ? 'Verified' : 'Under Review'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-900">KYC Verification</p>
                    <p className="text-[11px] text-slate-500 font-medium">Compliance verification for payouts</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {profileData.kycStatus === 'VERIFIED' ? 'Verified' : 'Not Started'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between shadow-2xs">
                  <div>
                    <p className="font-bold text-slate-900">Payout Setup</p>
                    <p className="text-[11px] text-slate-500 font-medium">Bank account for direct earnings</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-200 text-rose-800">
                    {profileData.payoutStatus === 'CONNECTED' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* In-UI Modal: Add Module to Dashboard Active Course */}
        {showAddModuleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Add New Curriculum Module</h3>
                <button onClick={() => setShowAddModuleModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                  ✕
                </button>
              </div>
              <form onSubmit={handleAddModuleToActiveCourse} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Module Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Module 3: Docker & Containers"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModuleModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    Add Module
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-UI Modal: Add Module in Wizard (Automated Module Numbering) */}
        {wizardModuleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">
                  Add Module {courseFormData.modules.length + 1}
                </h3>
                <button onClick={() => setWizardModuleModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                  ✕
                </button>
              </div>
              <form onSubmit={handleWizardAddModule} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Module Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Introduction to JavaScript (Numbering added automatically)"
                    value={wizardModuleTitle}
                    onChange={(e) => setWizardModuleTitle(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  The system will automatically assign and format this as "Module {courseFormData.modules.length + 1}: [Your Title]".
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardModuleModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    Add Module
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-UI Modal: Add / Edit Topic in Wizard (with Strict Validations & Mandatory Description) */}
        {wizardTopicModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingTopicIndex !== null ? 'Edit Standalone Topic & Video' : 'Add Standalone Topic & Video'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {editingTopicIndex !== null
                      ? 'Update topic details, description, and lesson content'
                      : `Topic for Module ${(selectedModuleIndex ?? 0) + 1}`}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setWizardTopicModal(false);
                    setEditingTopicIndex(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleWizardSaveTopic} className="space-y-4 text-xs">
                {/* 1. Topic Title (Mandatory) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Topic Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asynchronous JS & Promises"
                    value={wizardTopicForm.title}
                    onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* 2. Topic Description (Mandatory for new and edited topics) */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Topic Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Comprehensive description of concepts, skills, and outcomes covered in this topic... (Mandatory)"
                    value={wizardTopicForm.description}
                    onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, description: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* 3. Video / Lesson Upload & Embed (Mandatory) */}
                <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Topic Video / Lesson Content *</span>
                    </span>
                    <div className="flex rounded-lg bg-white p-0.5 border border-purple-200 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setWizardTopicForm({ ...wizardTopicForm, videoSourceTab: 'url' })}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          wizardTopicForm.videoSourceTab === 'url' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Video URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setWizardTopicForm({ ...wizardTopicForm, videoSourceTab: 'device' })}
                        className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                          wizardTopicForm.videoSourceTab === 'device' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        Upload Video
                      </button>
                    </div>
                  </div>

                  {wizardTopicForm.videoSourceTab === 'url' ? (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Embed Video / Stream Link *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                        value={wizardTopicForm.videoUrl}
                        onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, videoUrl: e.target.value })}
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Video File (.mp4, .webm) *</label>
                      <label className="flex items-center justify-center gap-2 p-3 bg-white border border-dashed border-purple-300 rounded-xl font-bold text-xs text-purple-700 hover:bg-purple-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>{wizardTopicForm.videoUrl ? 'Video File Selected ✓' : 'Choose Video from Device...'}</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              setWizardTopicForm({ ...wizardTopicForm, videoUrl: url });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* 4. Standalone Price & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      Standalone Price (₹) {wizardTopicForm.isFree ? '(Locked)' : '*'}
                    </label>
                    <input
                      type="text"
                      disabled={wizardTopicForm.isFree}
                      placeholder={wizardTopicForm.isFree ? '0 (Free Access)' : 'e.g. 499'}
                      value={wizardTopicForm.isFree ? '0' : (wizardTopicForm.price === 0 ? '' : wizardTopicForm.price)}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                        setWizardTopicForm({ ...wizardTopicForm, price: clean === '' ? 0 : Number(clean) });
                      }}
                      className={`w-full p-2.5 rounded-xl font-bold focus:outline-none transition-all ${
                        wizardTopicForm.isFree
                          ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Duration (minutes) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={wizardTopicForm.duration || ''}
                      onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, duration: Math.max(1, Number(e.target.value)) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 5. Free Topic Checkbox Toggle */}
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={wizardTopicForm.isFree}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setWizardTopicForm({
                        ...wizardTopicForm,
                        isFree: isChecked,
                        price: isChecked ? 0 : (wizardTopicForm.price || 99),
                      });
                    }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <span>Mark as Free Preview Topic (Resets price to ₹0 and locks price field)</span>
                </label>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setWizardTopicModal(false);
                      setEditingTopicIndex(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-indigo-600/20 transition-all"
                  >
                    {editingTopicIndex !== null ? 'Update Topic & Video' : 'Add Topic & Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* In-UI Modal: Create Webinar */}
        {showCreateWebinarModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Create Live Webinar</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Schedule a new live interactive session</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateWebinarModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWebinar} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Webinar Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Masterclass on Kubernetes Architecture"
                      value={newWebinar.title}
                      onChange={(e) => setNewWebinar({ ...newWebinar, title: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Category</label>
                      <select
                        value={newWebinar.category}
                        onChange={(e) => setNewWebinar({ ...newWebinar, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="DevOps / Cloud">DevOps / Cloud</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Data Science">Data Science</option>
                        <option value="AI & ML">AI & ML</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Max Capacity</label>
                      <input
                        type="number"
                        value={newWebinar.capacity}
                        onChange={(e) => setNewWebinar({ ...newWebinar, capacity: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Scheduled Start Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={newWebinar.startTime}
                        onChange={(e) => {
                          const startVal = e.target.value;
                          let autoEnd = newWebinar.endTime;
                          if (startVal && !newWebinar.endTime) {
                            const dt = new Date(startVal);
                            dt.setHours(dt.getHours() + 2);
                            autoEnd = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
                          }
                          setNewWebinar({ ...newWebinar, startTime: startVal, endTime: autoEnd });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-700 block">Expiry / End Time *</label>
                        <span className="text-[10px] text-indigo-600 font-semibold">Auto 2h default</span>
                      </div>
                      <input
                        type="datetime-local"
                        required
                        value={newWebinar.endTime}
                        onChange={(e) => setNewWebinar({ ...newWebinar, endTime: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Ticket Price (₹, 0 for Free)</label>
                    <input
                      type="number"
                      min={0}
                      value={newWebinar.price}
                      onChange={(e) => setNewWebinar({ ...newWebinar, price: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />

                    {/* Automatic Platform Fee & Instructor Share Calculation */}
                    <div className="mt-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Platform Share (10% Fee):</span>
                        <span className="font-bold text-slate-700">
                          {newWebinar.price > 0 ? `₹${Math.round(newWebinar.price * 0.10).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-indigo-100 font-bold">
                        <span className="text-indigo-900">Your Net Payout:</span>
                        <span className="text-indigo-900 font-black">
                          {newWebinar.price > 0
                            ? `₹${(newWebinar.price - Math.round(newWebinar.price * 0.10)).toLocaleString('en-IN')}`
                            : '₹0 (Free Webinar)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Meeting Room Mode Selector */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      Live Room Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewWebinar({ ...newWebinar, meetingType: 'IN_PLATFORM' })}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          newWebinar.meetingType === 'IN_PLATFORM'
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          In-Platform Live Room
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium leading-tight">
                          Built-in video, screen share, chat & Q&A. Auto-generated room URL!
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewWebinar({ ...newWebinar, meetingType: 'EXTERNAL' })}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          newWebinar.meetingType === 'EXTERNAL'
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5 text-xs">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                          External Link
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium leading-tight">
                          Google Meet, Zoom or custom third-party meeting URL.
                        </span>
                      </button>
                    </div>
                  </div>

                  {newWebinar.meetingType === 'IN_PLATFORM' ? (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Zero Setup Required</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        A unique live room link <code className="bg-indigo-100/70 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-800">/webinars/live/wb-...</code> will be generated automatically upon creation with built-in paywalls and host streaming controls.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">
                        Live Meeting Link (Google Meet / Zoom) *
                      </label>
                      <input
                        type="url"
                        required={newWebinar.meetingType === 'EXTERNAL'}
                        placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                        value={newWebinar.meetingUrl}
                        onChange={(e) => setNewWebinar({ ...newWebinar, meetingUrl: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        This link becomes live for registered attendees when the scheduled time arrives.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 p-4 sm:px-6 bg-slate-50/80 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCreateWebinarModal(false)}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition text-xs"
                  >
                    Schedule Webinar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* In-UI Modal: Edit Webinar with 2-Hour Strict Cutoff */}
        {showEditWebinarModal && editingWebinar && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100 shrink-0 bg-white">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Edit Webinar</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Update webinar schedule or meeting link</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditWebinarModal(false);
                    setEditingWebinar(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateWebinar} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
                  {/* 2-Hour Cutoff Logic Indicator */}
                  {(editingWebinar.isTimingLocked ||
                    (editingWebinar.startTime &&
                      new Date(editingWebinar.startTime).getTime() - Date.now() <= 2 * 60 * 60 * 1000)) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold">Timing Locked (2-Hour Window)</strong>
                        <span>
                          Webinar date & time cannot be rescheduled within 2 hours of the event start time. Other details can still be updated.
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Webinar Title *</label>
                    <input
                      type="text"
                      required
                      value={editingWebinar.title || ''}
                      onChange={(e) => setEditingWebinar({ ...editingWebinar, title: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Category</label>
                      <select
                        value={editingWebinar.category || 'DevOps / Cloud'}
                        onChange={(e) => setEditingWebinar({ ...editingWebinar, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="DevOps / Cloud">DevOps / Cloud</option>
                        <option value="Web Development">Web Development</option>
                        <option value="Data Science">Data Science</option>
                        <option value="AI & ML">AI & ML</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Max Capacity</label>
                      <input
                        type="number"
                        value={editingWebinar.capacity || 100}
                        onChange={(e) => setEditingWebinar({ ...editingWebinar, capacity: Number(e.target.value) })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                      />
                    </div>
                  </div>

                  {/* Date & Time Fields with strict 2-hour locking */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-700 block">Start Date & Time</label>
                        {(editingWebinar.isTimingLocked ||
                          (editingWebinar.startTime &&
                            new Date(editingWebinar.startTime).getTime() - Date.now() <= 2 * 60 * 60 * 1000)) && (
                          <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <input
                        type="datetime-local"
                        disabled={
                          editingWebinar.isTimingLocked ||
                          (editingWebinar.startTime &&
                            new Date(editingWebinar.startTime).getTime() - Date.now() <= 2 * 60 * 60 * 1000)
                        }
                        value={editingWebinar.startTime || ''}
                        onChange={(e) => setEditingWebinar({ ...editingWebinar, startTime: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="font-bold text-slate-700 block">Expiry / End Time</label>
                        {(editingWebinar.isTimingLocked ||
                          (editingWebinar.startTime &&
                            new Date(editingWebinar.startTime).getTime() - Date.now() <= 2 * 60 * 60 * 1000)) && (
                          <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <input
                        type="datetime-local"
                        disabled={
                          editingWebinar.isTimingLocked ||
                          (editingWebinar.startTime &&
                            new Date(editingWebinar.startTime).getTime() - Date.now() <= 2 * 60 * 60 * 1000)
                        }
                        value={editingWebinar.endTime || ''}
                        onChange={(e) => setEditingWebinar({ ...editingWebinar, endTime: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium disabled:opacity-60 disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Ticket Price (₹, 0 for Free)</label>
                    <input
                      type="number"
                      min={0}
                      value={editingWebinar.price ?? 0}
                      onChange={(e) => setEditingWebinar({ ...editingWebinar, price: Math.max(0, Number(e.target.value)) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />

                    {/* Automatic Platform Fee & Instructor Share Calculation */}
                    <div className="mt-2 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Platform Share (10% Fee):</span>
                        <span className="font-bold text-slate-700">
                          {(editingWebinar.price ?? 0) > 0 ? `₹${Math.round((editingWebinar.price ?? 0) * 0.10).toLocaleString('en-IN')}` : '₹0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-indigo-100 font-bold">
                        <span className="text-indigo-900">Your Net Payout:</span>
                        <span className="text-indigo-900 font-black">
                          {(editingWebinar.price ?? 0) > 0
                            ? `₹${((editingWebinar.price ?? 0) - Math.round((editingWebinar.price ?? 0) * 0.10)).toLocaleString('en-IN')}`
                            : '₹0 (Free Webinar)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Room Mode */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      Live Room Mode
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingWebinar({ ...editingWebinar, meetingType: 'IN_PLATFORM' })}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          (editingWebinar.meetingType || 'IN_PLATFORM') === 'IN_PLATFORM'
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5 text-xs">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          In-Platform Live Room
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium leading-tight">
                          Built-in video room hosted directly on platform.
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingWebinar({ ...editingWebinar, meetingType: 'EXTERNAL' })}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                          editingWebinar.meetingType === 'EXTERNAL'
                            ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="font-bold flex items-center gap-1.5 text-xs">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                          External Link
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium leading-tight">
                          Custom Zoom or Google Meet URL.
                        </span>
                      </button>
                    </div>
                  </div>

                  {(editingWebinar.meetingType || 'IN_PLATFORM') === 'IN_PLATFORM' ? (
                    <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>In-Platform Live Room Active</span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium break-all">
                        Live Room Link: <code className="bg-indigo-100/70 px-1 py-0.5 rounded font-mono text-[10px] text-indigo-800">{editingWebinar.meetingUrl || (editingWebinar.roomCode ? `/webinars/live/${editingWebinar.roomCode}` : 'Auto-generated upon save')}</code>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">
                        Live Meeting Link (Zoom / Meet / LiveKit)
                      </label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                        value={editingWebinar.meetingUrl || ''}
                        onChange={(e) => setEditingWebinar({ ...editingWebinar, meetingUrl: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 p-4 sm:px-6 bg-slate-50/80 border-t border-slate-100 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditWebinarModal(false);
                      setEditingWebinar(null);
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl cursor-pointer transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-sm transition text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}



        {/* =========================================================================
            MODAL: COURSE REJECTION FEEDBACK
           ========================================================================= */}
        {showRejectionModal && rejectionModalCourse && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Course Rejection Details</h3>
                  <p className="text-xs text-slate-500 font-medium">{rejectionModalCourse.title}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-1.5">
                <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                  Super Admin Feedback
                </span>
                <p className="text-xs text-rose-900 font-medium leading-relaxed">
                  {rejectionModalCourse.rejectionReason || 'Course does not meet platform quality guidelines. Please review curriculum content and re-submit.'}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionModalCourse(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idToEdit = rejectionModalCourse._id;
                    setShowRejectionModal(false);
                    setRejectionModalCourse(null);
                    handleEditCourse(idToEdit);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Edit Course & Curriculum
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

