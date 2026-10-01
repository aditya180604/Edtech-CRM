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
  QrCode,
  Landmark,
  Smartphone,
  Wallet,
  Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { instructorApi, type InstructorDashboardData } from '../../api/instructor';
import { useToast } from '../../context/ToastContext';

export const InstructorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success, error: toastError, info } = useToast();

  // Navigation Sub-tab state
  const [activeNav, setActiveNav] = useState<
    'dashboard' | 'courses' | 'create-course' | 'webinars' | 'students' | 'reviews' | 'qa' | 'analytics' | 'profile'
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
  const [rejectionModalCourse, setRejectionModalCourse] = useState<any | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [wizardPublishingFeePaid, setWizardPublishingFeePaid] = useState<boolean>(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState<boolean>(false);

  // Cashfree Interactive PG UI States
  const [pgMethod, setPgMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallet'>('upi');
  const [pgUpiMode, setPgUpiMode] = useState<'qr' | 'vpa'>('qr');
  const [pgVpaInput, setPgVpaInput] = useState('instructor@okhdfcbank');
  const [pgCardNumber, setPgCardNumber] = useState('4012 0000 0000 0000');
  const [pgCardName, setPgCardName] = useState('David Miller');
  const [pgCardExpiry, setPgCardExpiry] = useState('12/28');
  const [pgCardCvv, setPgCardCvv] = useState('888');
  const [pgSelectedBank, setPgSelectedBank] = useState('HDFC');
  const [pgSelectedWallet, setPgSelectedWallet] = useState('paytm');
  const [pgOtpStep, setPgOtpStep] = useState(false);
  const [pgOtpValue, setPgOtpValue] = useState('123456');
  const [pgPaymentSuccess, setPgPaymentSuccess] = useState(false);

  // Webinars Tab State
  const [webinarsTab, setWebinarsTab] = useState('ALL');
  const [webinarSearch, setWebinarSearch] = useState('');
  const [webinarsList, setWebinarsList] = useState<any[]>([]);
  const [webinarCounts, setWebinarCounts] = useState<any>({});
  const [showCreateWebinarModal, setShowCreateWebinarModal] = useState(false);
  const [newWebinar, setNewWebinar] = useState({
    title: '',
    category: 'DevOps / Cloud',
    startTime: '',
    capacity: 100,
    price: 0,
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
    expertise: ['DevOps', 'Cloud Computing', 'Web Development'],
    skills: ['React', 'Node.js', 'Docker', 'AWS'],
    experience: '5+ Years',
    qualifications: ['Bachelor of Technology (CSE)'],
    currentOrganization: '',
    identityStatus: 'VERIFIED',
    verificationStatus: 'UNDER_REVIEW',
    kycStatus: 'NOT_STARTED',
    payoutStatus: 'NOT_CONNECTED',
  });

  // 4-Step Create/Edit Course Wizard State
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
    requirements: [] as string[],
    learningObjectives: [] as string[],
    coursePrice: 0,
    currency: 'INR',
    syllabusUrl: '',
    syllabusFileName: '',
    modules: [] as Array<{
      title: string;
      topics: Array<{
        title: string;
        price: number;
        isFree: boolean;
        duration: number;
        videoUrl?: string;
        lessons?: Array<any>;
      }>;
    }>,
  });

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
  const [wizardTopicForm, setWizardTopicForm] = useState({
    title: '',
    price: 0,
    isFree: false,
    duration: 30,
    videoUrl: '',
    videoSourceTab: 'url' as 'device' | 'url',
  });

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

  // Mandatory Onboarding Guard (Workflow 1)
  useEffect(() => {
    if (user && user.role === 'INSTRUCTOR' && user.isProfileCompleted === false) {
      navigate('/instructor/onboarding');
    }
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

  // In-UI Add Topic in Wizard (Fixed Duplicate Topic Bug & Video Attachment)
  const handleWizardAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedModuleIndex === null || !wizardTopicForm.title.trim()) return;

    const newTopic = {
      title: wizardTopicForm.title.trim(),
      price: Number(wizardTopicForm.price) || 0,
      isFree: wizardTopicForm.isFree,
      duration: Number(wizardTopicForm.duration) || 30,
      videoUrl: wizardTopicForm.videoUrl || '',
      lessons: wizardTopicForm.videoUrl
        ? [
            {
              title: wizardTopicForm.title.trim(),
              duration: Number(wizardTopicForm.duration) || 30,
              videoUrl: wizardTopicForm.videoUrl,
            },
          ]
        : [],
    };

    setCourseFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((m, idx) =>
        idx === selectedModuleIndex
          ? {
              ...m,
              topics: [...m.topics, newTopic],
            }
          : m
      ),
    }));

    setWizardTopicForm({
      title: '',
      price: 0,
      isFree: false,
      duration: 30,
      videoUrl: '',
      videoSourceTab: 'url',
    });
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
          requirements: course.requirements || [],
          learningObjectives: course.learningObjectives || [],
          coursePrice: course.coursePrice ?? 1999,
          currency: course.currency || 'INR',
          syllabusUrl: course.syllabusUrl || '',
          syllabusFileName: course.syllabusFileName || '',
          modules: (modules || []).map((m: any) => ({
            title: (m.title || '').replace(/^Module\s*\d+\s*:\s*/i, ''),
            topics: (m.topics || []).map((t: any) => ({
              title: t.title,
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
      await instructorApi.createWebinar({
        title: newWebinar.title.trim(),
        category: newWebinar.category,
        startTime: scheduledDate.toISOString(),
        endTime: new Date(scheduledDate.getTime() + 7200000).toISOString(),
        capacity: Number(newWebinar.capacity) || 100,
        price: Number(newWebinar.price) || 0,
        meetingUrl: newWebinar.meetingUrl.trim(),
        status: 'SCHEDULED',
      });
      setShowCreateWebinarModal(false);
      setNewWebinar({ title: '', category: 'DevOps / Cloud', startTime: '', capacity: 100, price: 0, meetingUrl: '' });
      success('Webinar Scheduled', 'Your live webinar was successfully created and scheduled!');
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
        meetingUrl: (editingWebinar.meetingUrl || '').trim(),
      };

      // Strict 2-Hour Cutoff: Only update startTime if not locked
      if (!editingWebinar.isTimingLocked && editingWebinar.startTime) {
        payload.startTime = new Date(editingWebinar.startTime).toISOString();
        payload.endTime = new Date(new Date(editingWebinar.startTime).getTime() + 7200000).toISOString();
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

  const handleWizardPayFee = async () => {
    if (!courseFormData.title.trim()) {
      toastError('Course Title Required', 'Please enter a course title in Step 1 before proceeding to payment.');
      setCreateStep(1);
      return;
    }
    try {
      setProcessingFee(true);
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
        return;
      }

      // Open Cashfree fee payment modal
      setFeeModalCourse({ _id: targetCourseId, title: courseFormData.title });
      setShowFeeModal(true);
      const feeRes = await instructorApi.createPublishingFeeOrder(targetCourseId);
      if (feeRes.success && feeRes.data) {
        setFeeOrderData(feeRes.data);
      }
    } catch (err: any) {
      console.error('Error in handleWizardPayFee:', err);
      toastError('Payment Initialization Failed', err.response?.data?.message || err.message || 'Could not initiate payment.');
      setShowFeeModal(false);
    } finally {
      setProcessingFee(false);
    }
  };

  const handleSubmitCourseForReview = async (saveAsDraftOnly = false) => {
    if (!courseFormData.title.trim()) {
      toastError('Title Required', 'Please provide a course title in Step 1 before submitting.');
      setCreateStep(1);
      return;
    }
    if (!saveAsDraftOnly && !wizardPublishingFeePaid) {
      toastError('Publishing Fee Required', 'Please pay the platform publishing fee (₹499) via Cashfree before submitting for Super Admin review.');
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
        success('Course Submitted for Review!', 'Your course is now pending Super Admin review. You will be notified once approved.');
      } else {
        success('Course Draft Saved', 'Your course structure and curriculum have been saved as draft.');
      }

      setEditingCourseId(null);
      setWizardPublishingFeePaid(false);
      setActiveNav('courses');
      setCreateStep(1);
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
        requirements: [],
        learningObjectives: [],
        coursePrice: 0,
        currency: 'INR',
        syllabusUrl: '',
        syllabusFileName: '',
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
    try {
      setProcessingFee(true);
      setFeeModalCourse(course);
      setShowFeeModal(true);
      setPgMethod('upi');
      setPgUpiMode('qr');
      setPgOtpStep(false);
      setPgPaymentSuccess(false);
      const res = await instructorApi.createPublishingFeeOrder(course._id || course.id);
      if (res.success && res.data) {
        setFeeOrderData(res.data);
      }
    } catch (err: any) {
      toastError('Payment Initialization Failed', err.response?.data?.message || err.message);
      setShowFeeModal(false);
    } finally {
      setProcessingFee(false);
    }
  };

  const handleVerifyFeePayment = async () => {
    if (!feeModalCourse || !feeOrderData) return;
    try {
      setProcessingFee(true);
      const res = await instructorApi.verifyPublishingFee(feeModalCourse._id || feeModalCourse.id, {
        cashfreeOrderId: feeOrderData.orderId,
      });
      if (res.success) {
        setPgPaymentSuccess(true);
        success('Publishing Fee Paid Successfully!', 'Your course is now verified and ready for Super Admin review.');
        setTimeout(async () => {
          setShowFeeModal(false);
          setFeeModalCourse(null);
          setFeeOrderData(null);
          setWizardPublishingFeePaid(true);
          setPgPaymentSuccess(false);
          setPgOtpStep(false);
          await loadSubViewData();
          fetchDashboard(true);
        }, 1200);
      }
    } catch (err: any) {
      toastError('Verification Failed', err.response?.data?.message || err.message);
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
            <button className="relative p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
            </button>

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
            VIEW 3: CREATE / EDIT COURSE (4-STEP STREAMLINED WIZARD)
           ========================================================================= */}
        {activeNav === 'create-course' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header with Back, Draft & Next / Publish Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                {createStep > 1 && (
                  <button
                    onClick={() => setCreateStep(createStep - 1)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {editingCourseId ? `Edit Course: ${courseFormData.title || 'Untitled'}` : 'Create New Course'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {editingCourseId
                      ? 'Update course details, syllabus document, curriculum hierarchy, and pricing.'
                      : 'Follow the 4 streamlined steps to design, structure, and publish your course.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {createStep > 1 && (
                  <button
                    onClick={() => setCreateStep(createStep - 1)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  onClick={() => handleSubmitCourseForReview(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Save as Draft
                </button>

                {createStep < 4 ? (
                  <button
                    onClick={() => setCreateStep(createStep + 1)}
                    className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-all"
                  >
                    <span>Next Step</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : !wizardPublishingFeePaid ? (
                  <button
                    type="button"
                    onClick={handleWizardPayFee}
                    disabled={processingFee}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Fee (₹499) to Unlock</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSubmittingCourse}
                    onClick={() => handleSubmitCourseForReview(false)}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-70"
                  >
                    {isSubmittingCourse ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
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

            {/* Stepper Progress Badges (4 Clean Steps) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 py-2 border-b border-slate-50">
              {[
                { step: 1, label: '1. Basic Information' },
                { step: 2, label: '2. Syllabus & Documents' },
                { step: 3, label: '3. Curriculum Structure' },
                { step: 4, label: '4. Pricing & Preview' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setCreateStep(s.step)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-xs font-semibold cursor-pointer select-none transition-all ${
                    createStep === s.step
                      ? 'bg-indigo-50/80 border border-indigo-200 text-indigo-700 shadow-2xs'
                      : createStep > s.step
                      ? 'bg-emerald-50/60 border border-emerald-100 text-emerald-800'
                      : 'bg-slate-50 border border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      createStep === s.step
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : createStep > s.step
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {createStep > s.step ? '✓' : s.step}
                  </span>
                  <span className="truncate font-bold text-[12px]">{s.label}</span>
                </button>
              ))}
            </div>

            {/* =========================================================================
                STEP 1: BASIC INFORMATION
               ========================================================================= */}
            {createStep === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Left Column: Title & Descriptions (6 Cols) */}
                <div className="lg:col-span-6 space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Course Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Master React & Node.js Architecture"
                      value={courseFormData.title}
                      onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Short Description *</label>
                    <textarea
                      rows={2}
                      placeholder="Brief overview of the course (1-2 sentences)..."
                      value={courseFormData.shortDescription}
                      onChange={(e) => setCourseFormData({ ...courseFormData, shortDescription: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Full Description</label>
                    <textarea
                      rows={5}
                      placeholder="Detailed course description, prerequisites, and learning outcomes..."
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Right Column: Thumbnail & Classification (6 Cols) */}
                <div className="lg:col-span-6 space-y-4 text-xs">
                  {/* Thumbnail Upload with Dual Device/URL Options */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Course Thumbnail Image</label>

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
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center bg-slate-50/50 flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No Image Uploaded</p>
                        <p className="text-[10px] text-slate-400 font-medium">Recommended: 1280 × 720 (Max 5MB)</p>
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      <div className="flex rounded-xl bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setThumbUploadTab('device')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            thumbUploadTab === 'device' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          <HardDrive className="w-3.5 h-3.5" />
                          <span>Upload from Device</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbUploadTab('url')}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            thumbUploadTab === 'url' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>From Web URL</span>
                        </button>
                      </div>

                      {thumbUploadTab === 'device' ? (
                        <label className="block w-full py-2.5 px-3 bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-center text-xs font-bold text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors shadow-2xs">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDeviceFileUpload}
                            className="hidden"
                          />
                          <span>Choose Image File from Device...</span>
                        </label>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/course-thumbnail.jpg"
                            value={thumbUrlInput}
                            onChange={(e) => setThumbUrlInput(e.target.value)}
                            className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleApplyWebUrl}
                            className="px-3.5 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                          >
                            Apply
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Category, Level, Language */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Category *</label>
                      <select
                        value={courseFormData.category}
                        onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
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
                      <label className="font-bold text-slate-700 block mb-1.5">Level *</label>
                      <select
                        value={courseFormData.level}
                        onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1.5">Language</label>
                      <select
                        value={courseFormData.language}
                        onChange={(e) => setCourseFormData({ ...courseFormData, language: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills Taught */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Key Skills Taught</label>
                    {courseFormData.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                        {courseFormData.skills.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] flex items-center gap-1.5">
                            {s}
                            <button
                              type="button"
                              onClick={() => setCourseFormData({ ...courseFormData, skills: courseFormData.skills.filter((_, i) => i !== idx) })}
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
                        placeholder="e.g. React, Docker, Kubernetes..."
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
                        className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSkillTagInput.trim()) {
                            setCourseFormData({ ...courseFormData, skills: [...courseFormData.skills, newSkillTagInput.trim()] });
                            setNewSkillTagInput('');
                          }
                        }}
                        className="px-4 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =========================================================================
                STEP 2: SYLLABUS UPLOAD & COURSE DOCUMENTS (Dedicated Step)
               ========================================================================= */}
            {createStep === 2 && (
              <div className="max-w-2xl mx-auto space-y-6 text-xs py-2">
                <div className="text-center space-y-1 pb-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs mb-2">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="font-black text-slate-900 text-base">Course Syllabus & Curriculum Document</h3>
                  <p className="text-slate-500 font-medium max-w-md mx-auto">
                    Upload or link your official course syllabus (PDF or DOCX). Students will be able to review and download this document from your course card and catalog page.
                  </p>
                </div>

                {/* Upload Status Card if document is attached */}
                {courseFormData.syllabusFileName || courseFormData.syllabusUrl ? (
                  <div className="p-5 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 text-xs sm:text-sm truncate">
                          {courseFormData.syllabusFileName || 'Course_Syllabus.pdf'}
                        </h4>
                        <p className="text-[11px] text-indigo-700 font-semibold truncate">
                          Syllabus Document Active & Attached ✓
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCourseFormData({ ...courseFormData, syllabusUrl: '', syllabusFileName: '' })}
                      className="px-3.5 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs shrink-0"
                    >
                      Remove Document
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Dual Mode Switcher */}
                    <div className="flex rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setSyllabusUploadTab('device')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          syllabusUploadTab === 'device' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <HardDrive className="w-4 h-4" />
                        <span>Upload File from Device</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSyllabusUploadTab('url')}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                          syllabusUploadTab === 'url' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        <span>External Document Link (URL)</span>
                      </button>
                    </div>

                    {syllabusUploadTab === 'device' ? (
                      <label className="block w-full p-8 bg-slate-50 hover:bg-indigo-50/40 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl text-center cursor-pointer transition-all">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleSyllabusFileUpload}
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="font-black text-slate-800 text-sm">Choose Syllabus File from Device</p>
                          <p className="text-slate-400 text-[11px] font-medium">Supports PDF, DOC, DOCX up to 25MB</p>
                        </div>
                      </label>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                        <label className="font-bold text-slate-700 block">Enter Syllabus Web URL</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://example.com/syllabus.pdf or Google Drive link"
                            value={syllabusUrlInput}
                            onChange={(e) => setSyllabusUrlInput(e.target.value)}
                            className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleApplySyllabusUrl}
                            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                          >
                            Attach Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                STEP 3: CURRICULUM STRUCTURE (Automated Module Numbering & Topics)
               ========================================================================= */}
            {createStep === 3 && (
              <div className="space-y-5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Course Curriculum Hierarchy</h3>
                    <p className="text-slate-500 font-medium">
                      Add modules with automatic numbering, standalone atomic topics, pricing, and video lessons.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardModuleModal(true)}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Module</span>
                  </button>
                </div>

                {courseFormData.modules.length === 0 ? (
                  <div className="p-12 text-center rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-3">
                    <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-black text-slate-700 text-sm">No curriculum modules added yet</p>
                    <p className="text-slate-500 text-xs max-w-sm mx-auto">
                      Click the "+ Add Module" button above to start structuring your course into sequential learning modules.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseFormData.modules.map((mod, mIdx) => (
                      <div key={mIdx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-indigo-600 text-white font-black text-[11px] rounded-lg">
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
                                setWizardTopicModal(true);
                              }}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 font-bold rounded-xl text-xs cursor-pointer shadow-2xs transition-colors"
                            >
                              + Add Topic
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
                            No topics added to this module yet. Click "+ Add Topic" to add lessons.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {mod.topics.map((top, tIdx) => (
                              <div
                                key={tIdx}
                                className="p-3.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between gap-3 shadow-2xs"
                              >
                                <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                                  <span className="font-bold text-slate-800 text-xs truncate">{top.title}</span>
                                  {top.videoUrl && (
                                    <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-bold inline-flex items-center gap-1">
                                      <Video className="w-3 h-3" /> Video Attached ({top.duration}m)
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      top.isFree
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-indigo-50 text-indigo-700'
                                    }`}
                                  >
                                    {top.isFree ? 'Free Preview' : `₹${top.price}`}
                                  </span>

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
                                    className="text-slate-400 hover:text-red-500 p-1 font-bold text-sm cursor-pointer"
                                    title="Remove Topic"
                                  >
                                    ×
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
              </div>
            )}

            {/* =========================================================================
                STEP 4: PRICING & COMPREHENSIVE STRUCTURAL PREVIEW / PUBLISH
               ========================================================================= */}
            {createStep === 4 && (
              <div className="space-y-6 text-xs pt-1">
                {/* Pricing Input Section (Clean Default 0 & Intuitive Typing) */}
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 max-w-xl mx-auto space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm sm:text-base">Full Course Pricing</h3>
                      <p className="text-slate-500 font-medium text-[11px]">Set ₹0 for a completely free course</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs">
                      {courseFormData.coursePrice === 0 ? 'FREE ACCESS' : `₹${courseFormData.coursePrice.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Course Price (INR ₹) *</label>
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
                      className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl font-black text-slate-900 text-xl focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>

                {/* Comprehensive Structural Course Preview (Requirement 3 Redesign) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-black text-slate-900 text-base">Course Structural Preview</h3>
                      <p className="text-slate-500 font-medium">Verify how your course hierarchy and details will appear</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                      Ready to Publish
                    </span>
                  </div>

                  {/* Summary Metric Stats Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-slate-900">{courseFormData.modules.length}</p>
                      <p className="text-[11px] font-semibold text-slate-500">Modules</p>
                    </div>
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-lg font-black text-indigo-600">
                        {courseFormData.modules.reduce((acc, m) => acc + m.topics.length, 0)}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">Topics</p>
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
                      <p className="text-[11px] font-semibold text-slate-500">Course Access</p>
                    </div>
                  </div>

                  {/* Structured Preview Card */}
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-xs">
                    {/* Course Header Preview */}
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      <div className="w-full sm:w-44 h-28 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                        {courseFormData.thumbnail ? (
                          <img src={courseFormData.thumbnail} alt={courseFormData.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold">No Image</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
                            {courseFormData.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {courseFormData.level}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {courseFormData.language}
                          </span>
                        </div>

                        <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                          {courseFormData.title || 'Untitled Course'}
                        </h2>

                        <p className="text-xs text-slate-600 font-medium">
                          Instructor: <strong className="text-slate-800">{instructorName}</strong>
                        </p>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {courseFormData.shortDescription || 'No short description provided.'}
                        </p>
                      </div>
                    </div>

                    {/* Syllabus Document Attachment Preview */}
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800 text-xs">
                          {courseFormData.syllabusFileName
                            ? `Syllabus Attached: ${courseFormData.syllabusFileName}`
                            : courseFormData.syllabusUrl
                            ? 'Syllabus Attached via Link'
                            : 'No dedicated syllabus document attached'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">Step 2 Document</span>
                    </div>

                    {/* Skills Badges */}
                    {courseFormData.skills.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Skills Included</p>
                        <div className="flex flex-wrap gap-1.5">
                          {courseFormData.skills.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modules & Topics Tree Hierarchy */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="font-black text-slate-900 text-xs sm:text-sm">Curriculum Breakdown</h4>

                      {courseFormData.modules.length === 0 ? (
                        <p className="text-slate-400 italic text-xs py-3">No modules have been added yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {courseFormData.modules.map((mod, mIdx) => (
                            <div key={mIdx} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                  Module {mIdx + 1}: {mod.title.replace(/^Module\s*\d+\s*:\s*/i, '')}
                                </h5>
                                <span className="text-[11px] font-semibold text-slate-500">
                                  {mod.topics.length} Topics
                                </span>
                              </div>

                              {mod.topics.length > 0 && (
                                <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                                  {mod.topics.map((top, tIdx) => (
                                    <div
                                      key={tIdx}
                                      className="p-2.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800">{top.title}</span>
                                        {top.videoUrl && (
                                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold inline-flex items-center gap-1">
                                            <Video className="w-3 h-3" /> Video Attached
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400 font-medium">{top.duration || 30}m</span>
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            top.isFree ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-50 text-indigo-700'
                                          }`}
                                        >
                                          {top.isFree ? 'Free Preview' : `₹${top.price}`}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Cashfree Publishing Fee Gatekeeper Card (Workflow 3 Strict Gate) */}
                    <div
                      className={`p-5 rounded-2xl border transition-all ${
                        wizardPublishingFeePaid
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                          : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200 text-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                              wizardPublishingFeePaid
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-indigo-600 text-white shadow-indigo-600/20'
                            }`}
                          >
                            {wizardPublishingFeePaid ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900">
                                Platform Publishing & Verification Fee (₹499)
                              </h4>
                              {wizardPublishingFeePaid ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Fee Paid & Verified
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                                  <Lock className="w-3 h-3" /> Payment Required to Unlock Submission
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                              {wizardPublishingFeePaid
                                ? 'Your publishing fee has been verified via Cashfree. You can now submit this course to the Super Admin approval queue.'
                                : 'Instructors must pay a platform verification fee of ₹499 via Cashfree sandbox before submitting the course for Super Admin review.'}
                            </p>
                          </div>
                        </div>

                        {!wizardPublishingFeePaid && (
                          <button
                            type="button"
                            onClick={handleWizardPayFee}
                            disabled={processingFee}
                            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>Pay ₹499 via Cashfree</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Final Action Buttons in Preview */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setCreateStep(3)}
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
                          title="Click Pay ₹499 via Cashfree above to unlock submission"
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
              </div>
            )}
          </div>
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
                      const isLive = w.isLive || w.status === 'LIVE';
                      return (
                        <tr key={w._id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div>{w.title}</div>
                            <span className="text-[10px] text-slate-400 font-semibold">{w.category}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            <div>{new Date(w.startTime).toLocaleDateString()}</div>
                            <div className="text-[11px] text-slate-400 font-semibold">
                              {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-indigo-600">
                            {w.registrations?.length || 0}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{w.capacity || 100}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                isLive
                                  ? 'bg-red-100 text-red-700 animate-pulse font-black'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {isLive ? '🔴 LIVE NOW' : w.status || 'SCHEDULED'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {w.meetingUrl ? (
                              <a
                                href={w.meetingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 underline font-semibold max-w-[140px] truncate block"
                              >
                                Open Meeting ↗
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">Not configured</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isLive && w.meetingUrl && (
                                <button
                                  type="button"
                                  onClick={() => window.open(w.meetingUrl, '_blank')}
                                  className="px-2.5 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition cursor-pointer text-[11px]"
                                >
                                  Host Live
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
                                  setEditingWebinar({
                                    ...w,
                                    startTime: localIso,
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
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-700">
                <p className="text-2xl font-black">
                  ₹{(analyticsData?.totalRevenue || 0).toLocaleString('en-IN')}
                </p>
                <p className="font-semibold text-slate-600">Total Revenue</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700">
                <p className="text-2xl font-black">{analyticsData?.activeStudents ?? 0}</p>
                <p className="font-semibold text-slate-600">Active Students</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50 text-purple-700">
                <p className="text-2xl font-black">{analyticsData?.totalCourses ?? 0}</p>
                <p className="font-semibold text-slate-600">Active Courses</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 text-amber-700">
                <p className="text-2xl font-black">{analyticsData?.totalWebinars ?? 0}</p>
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
                    {!analyticsData?.courses || analyticsData.courses.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                          No course analytics available yet.
                        </td>
                      </tr>
                    ) : (
                      analyticsData.courses.map((c: any) => (
                        <tr key={c.id || c._id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{c.title}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {c.enrolledStudents || 0}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-700">
                            ₹{(c.revenue || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              ★ {Number(c.averageRating || 0).toFixed(1)}
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
            VIEW 7: PROFILE & 4-TIER VERIFICATION (Image 2)
           ========================================================================= */}
        {activeNav === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900">Profile & Verification</h2>
              <p className="text-xs text-slate-500 font-medium">Manage your personal information, professional details and verification status.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
              <div className="lg:col-span-3 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Personal Information</h3>
                <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-2xl flex items-center justify-center">
                    {instructorName[0] || 'I'}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input type="text" defaultValue={instructorName} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email</label>
                  <input type="email" disabled defaultValue={user?.email} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold" />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm">Professional Information</h3>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bio *</label>
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expertise</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-1.5">
                    {profileData.expertise.map((exp: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Organization</label>
                  <input
                    type="text"
                    value={profileData.currentOrganization}
                    onChange={(e) => setProfileData({ ...profileData, currentOrganization: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Verification Status</h3>
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Identity Verification</p>
                    <p className="text-[11px] text-slate-500 font-medium">Verify your identity document</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                    Verified
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Instructor Verification</p>
                    <p className="text-[11px] text-slate-500 font-medium">Review of your instructor profile</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-800">
                    Under Review
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">KYC Verification</p>
                    <p className="text-[11px] text-slate-500 font-medium">Complete KYC for payouts</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    Not Started
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">Payout Setup</p>
                    <p className="text-[11px] text-slate-500 font-medium">Connect your payment account</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-800">
                    Not Connected
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

        {/* In-UI Modal: Add Topic in Wizard (with Video Upload / Embed - Requirement 4) */}
        {wizardTopicModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Standalone Topic & Video</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Topic for Module {(selectedModuleIndex ?? 0) + 1}</p>
                </div>
                <button onClick={() => setWizardTopicModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                  ✕
                </button>
              </div>
              <form onSubmit={handleWizardAddTopic} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Topic Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asynchronous JS & Promises"
                    value={wizardTopicForm.title}
                    onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Video / Lesson Upload & Embed Feature (Requirement 4) */}
                <div className="p-3.5 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Topic Video / Lesson Content</span>
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
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Embed Video / Stream Link</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... or https://.../video.mp4"
                        value={wizardTopicForm.videoUrl}
                        onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, videoUrl: e.target.value })}
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">Select Video File (.mp4, .webm)</label>
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Standalone Price (₹)</label>
                    <input
                      type="text"
                      placeholder="e.g. 499"
                      value={wizardTopicForm.price === 0 ? '' : wizardTopicForm.price}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
                        setWizardTopicForm({ ...wizardTopicForm, price: clean === '' ? 0 : Number(clean) });
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">Duration (minutes)</label>
                    <input
                      type="number"
                      value={wizardTopicForm.duration}
                      onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, duration: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={wizardTopicForm.isFree}
                    onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, isFree: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Mark as Free Preview Topic</span>
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardTopicModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    Add Topic & Video
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* In-UI Modal: Create Webinar */}
        {showCreateWebinarModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Create Live Webinar</h3>
                <button onClick={() => setShowCreateWebinarModal(false)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateWebinar} className="space-y-3.5 text-xs">
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

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={newWebinar.startTime}
                    onChange={(e) => setNewWebinar({ ...newWebinar, startTime: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Ticket Price (₹, 0 for Free)</label>
                  <input
                    type="number"
                    value={newWebinar.price}
                    onChange={(e) => setNewWebinar({ ...newWebinar, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Live Meeting Link (Zoom / Google Meet / LiveKit)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                    value={newWebinar.meetingUrl}
                    onChange={(e) => setNewWebinar({ ...newWebinar, meetingUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This link becomes live for registered attendees when the scheduled time arrives.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateWebinarModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm"
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
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
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
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

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

              <form onSubmit={handleUpdateWebinar} className="space-y-3.5 text-xs">
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

                {/* Date & Time Field with strict 2-hour locking */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 block">Date & Time</label>
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
                  <label className="font-bold text-slate-700 block mb-1.5">Ticket Price (₹, 0 for Free)</label>
                  <input
                    type="number"
                    value={editingWebinar.price ?? 0}
                    onChange={(e) => setEditingWebinar({ ...editingWebinar, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    Live Meeting Link (Zoom / Meet / LiveKit)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xyz or https://zoom.us/j/..."
                    value={editingWebinar.meetingUrl || ''}
                    onChange={(e) => setEditingWebinar({ ...editingWebinar, meetingUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditWebinarModal(false);
                      setEditingWebinar(null);
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm hover:bg-indigo-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL: CASHFREE PUBLISHING FEE PAYMENT (Workflow 3)
           ========================================================================= */}
        {showFeeModal && feeModalCourse && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-slate-100 shadow-2xl space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Cashfree Payment Gateway</h3>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Sandbox Mode • Verified PG
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowFeeModal(false);
                    setFeeModalCourse(null);
                    setFeeOrderData(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Order Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Course:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{feeModalCourse.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Fee Purpose:</span>
                  <span className="font-bold text-slate-900">Platform Publishing Fee</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-bold">Total Payable:</span>
                  <span className="font-black text-slate-900 text-base">₹499.00</span>
                </div>
              </div>

              {/* Cashfree Session Details */}
              {feeOrderData && (
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Order ID:</span>
                    <span className="font-mono font-bold text-indigo-700">{feeOrderData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Gateway Status:</span>
                    <span className="font-bold text-emerald-600">Active Sandbox Session</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  disabled={processingFee}
                  onClick={handleVerifyFeePayment}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {processingFee ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Payment Verification...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Cashfree Payment (₹499)</span>
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowFeeModal(false);
                    setFeeModalCourse(null);
                    setFeeOrderData(null);
                  }}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Cancel Payment
                </button>
              </div>
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

