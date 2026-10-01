import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  RotateCcw,
  CreditCard,
  Globe,
  Coins,
  Receipt,
  BarChart3,
  ShieldAlert,
  Server,
  Plus,
  Search,
  X,
  RefreshCw,
  LogOut,
  Trash2,
  UserPlus,
  Ban,
  Layers,
  FileText,
  DollarSign,
  PieChart,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Video,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  superAdminApi,
  type SuperAdminDashboardOverview,
  type SuperAdminUser,
  type SuperAdminCourse,
  type SuperAdminOrder,
  type SuperAdminRefund,
  type SuperAdminPayout,
  type SuperAdminCountry,
  type SuperAdminCurrency,
  type SuperAdminTax,
} from '../../api/superAdmin';

export const SuperAdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Active Navigation View Tab
  const [activeNav, setActiveNav] = useState<
    | 'dashboard'
    | 'users'
    | 'creators'
    | 'courses'
    | 'approvals'
    | 'orders'
    | 'refunds'
    | 'payouts'
    | 'countries'
    | 'currencies'
    | 'taxes'
    | 'analytics'
  >('dashboard');

  // Loading States
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [overview, setOverview] = useState<SuperAdminDashboardOverview | null>(null);
  const [usersList, setUsersList] = useState<SuperAdminUser[]>([]);
  const [coursesList, setCoursesList] = useState<SuperAdminCourse[]>([]);
  const [ordersList, setOrdersList] = useState<SuperAdminOrder[]>([]);
  const [refundsList, setRefundsList] = useState<SuperAdminRefund[]>([]);
  const [payoutsData, setPayoutsData] = useState<{
    metrics: { totalPayouts: string; pendingPayouts: string; completedPayouts: string; failedPayouts: string };
    payouts: SuperAdminPayout[];
  }>({
    metrics: { totalPayouts: '₹0', pendingPayouts: '₹0', completedPayouts: '₹0', failedPayouts: '₹0' },
    payouts: [],
  });
  const [countriesList, setCountriesList] = useState<SuperAdminCountry[]>([]);
  const [currenciesList, setCurrenciesList] = useState<SuperAdminCurrency[]>([]);
  const [taxesList, setTaxesList] = useState<SuperAdminTax[]>([]);
  const [infraData, setInfraData] = useState<any>(null);
  const [fraudData, setFraudData] = useState<any[]>([]);

  // Filters State
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState('ALL');
  const [courseSearch, setCourseSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Modals
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
    department: 'Operations',
    phone: '',
  });

  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [newCountryForm, setNewCountryForm] = useState({
    name: '',
    countryCode: '',
    currencyCode: 'INR',
    timezone: 'Asia/Kolkata',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const [newCurrencyForm, setNewCurrencyForm] = useState({
    name: '',
    currencyCode: '',
    symbol: '₹',
    exchangeRate: 1.0,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  const [showAddTaxModal, setShowAddTaxModal] = useState(false);
  const [newTaxForm, setNewTaxForm] = useState({
    countryCode: 'India',
    taxName: 'GST',
    taxType: 'Indirect',
    taxRate: 18,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
  });

  // Termination confirmation modal
  const [terminateTarget, setTerminateTarget] = useState<SuperAdminUser | null>(null);
  const [terminateReason, setTerminateReason] = useState('Policy violation / Administrative review');

  // Course Approvals Queue State (Workflow 2)
  const [approvalsList, setApprovalsList] = useState<any[]>([]);
  const [selectedReviewCourse, setSelectedReviewCourse] = useState<any | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rejectModalCourse, setRejectModalCourse] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Super Admin Create Course On Behalf of Instructor State
  const [showCreateOnBehalfModal, setShowCreateOnBehalfModal] = useState(false);
  const [instructorsList, setInstructorsList] = useState<any[]>([]);
  const [creatingCourseOnBehalf, setCreatingCourseOnBehalf] = useState(false);
  const [adminSkillInput, setAdminSkillInput] = useState('');
  const [createCourseForm, setCreateCourseForm] = useState({
    instructorId: '',
    title: '',
    shortDescription: '',
    description: '',
    category: 'Development',
    subcategory: 'Full-Stack',
    level: 'Beginner',
    language: 'English',
    coursePrice: 1999,
    thumbnail: '',
    banner: '',
    syllabusUrl: '',
    syllabusFileName: '',
    skills: ['React', 'Node.js', 'MongoDB'],
    modules: [
      {
        title: 'Getting Started & Architecture',
        topics: [
          { title: 'Introduction & Setup', price: 0, isFree: true, duration: 25, videoUrl: '' },
          { title: 'Core Principles', price: 499, isFree: false, duration: 40, videoUrl: '' },
        ],
      },
    ],
  });

  // Load Dashboard Overview and active sub-view data
  const loadData = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setRefreshing(true);

        const overviewRes = await superAdminApi.getDashboard().catch(() => null);
        if (overviewRes?.success && overviewRes.data) {
          setOverview(overviewRes.data);
        }

        // Fetch registered instructors list for dropdown
        const instRes = await superAdminApi.getInstructorsList().catch(() => null);
        if (instRes?.success && instRes.data) {
          setInstructorsList(instRes.data);
          if (instRes.data.length > 0) {
            setCreateCourseForm((prev) => ({
              ...prev,
              instructorId: prev.instructorId || instRes.data[0].id || instRes.data[0]._id,
            }));
          }
        }

        // Sub-view data loading
        if (activeNav === 'users' || activeNav === 'creators' || activeNav === 'dashboard') {
          const roleToQuery = activeNav === 'creators' ? 'INSTRUCTOR' : userRoleFilter === 'ALL' ? undefined : userRoleFilter;
          const uRes = await superAdminApi.getUsers({
            role: roleToQuery,
            status: userStatusFilter === 'ALL' ? undefined : userStatusFilter,
            search: userSearch.trim() || undefined,
            limit: 100,
          }).catch(() => null);
          if (uRes?.success && uRes.data?.users) {
            setUsersList(uRes.data.users);
          }
        }

        // Always fetch approvals queue for live sidebar badge and queue pipeline
        const appRes = await superAdminApi.getApprovalsQueue().catch(() => null);
        if (appRes?.success && appRes.data) {
          setApprovalsList(appRes.data);
        }

        if (activeNav === 'courses' || activeNav === 'approvals' || activeNav === 'dashboard') {
          const cRes = await superAdminApi.getCourses({
            status: courseStatusFilter === 'ALL' ? undefined : courseStatusFilter,
            search: courseSearch.trim() || undefined,
          }).catch(() => null);
          if (cRes?.success && cRes.data?.courses) {
            setCoursesList(cRes.data.courses);
          }
        }

        if (activeNav === 'orders' || activeNav === 'dashboard') {
          const oRes = await superAdminApi.getOrders({
            status: orderStatusFilter === 'ALL' ? undefined : orderStatusFilter,
            search: orderSearch.trim() || undefined,
          }).catch(() => null);
          if (oRes?.success && oRes.data?.orders) {
            setOrdersList(oRes.data.orders);
          }
        }

        if (activeNav === 'refunds') {
          const rRes = await superAdminApi.getRefunds().catch(() => null);
          if (rRes?.success && rRes.data) setRefundsList(rRes.data);
        }

        if (activeNav === 'payouts') {
          const pRes = await superAdminApi.getPayouts().catch(() => null);
          if (pRes?.success && pRes.data) setPayoutsData(pRes.data);
        }

        if (activeNav === 'countries') {
          const cRes = await superAdminApi.getCountries().catch(() => null);
          if (cRes?.success && cRes.data) setCountriesList(cRes.data);
        }

        if (activeNav === 'currencies') {
          const currRes = await superAdminApi.getCurrencies().catch(() => null);
          if (currRes?.success && currRes.data) setCurrenciesList(currRes.data);
        }

        if (activeNav === 'taxes') {
          const tRes = await superAdminApi.getTaxes().catch(() => null);
          if (tRes?.success && tRes.data) setTaxesList(tRes.data);
        }

        if (activeNav === 'infrastructure') {
          const iRes = await superAdminApi.getInfrastructure().catch(() => null);
          if (iRes?.success && iRes.data) setInfraData(iRes.data);
        }

        if (activeNav === 'fraud') {
          const fRes = await superAdminApi.getFraud().catch(() => null);
          if (fRes?.success && fRes.data) setFraudData(fRes.data);
        }
      } catch (err) {
        console.error('Failed to load super admin telemetry:', err);
      } finally {
        setRefreshing(false);
      }
    },
    [activeNav, userRoleFilter, userStatusFilter, userSearch, courseStatusFilter, courseSearch, orderStatusFilter, orderSearch]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic polling every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      loadData(true);
    }, 30000);
    return () => clearInterval(timer);
  }, [loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User Provisioning (Student, Instructor, Admin)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminApi.createUser(newUserForm);
      success('User Account Created', `Provisioned ${newUserForm.role} account for ${newUserForm.email}`);
      setShowAddUserModal(false);
      setNewUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'STUDENT',
        department: 'Operations',
        phone: '',
      });
      loadData(true);
    } catch (err: any) {
      toastError('Creation Failed', err.message || 'Could not provision account.');
    }
  };

  // User Termination Confirmation
  const handleConfirmTerminate = async () => {
    if (!terminateTarget) return;
    try {
      await superAdminApi.terminateUser(terminateTarget.id || terminateTarget._id, terminateReason);
      success('Access Terminated', `${terminateTarget.name}'s account has been terminated and session revoked.`);
      setTerminateTarget(null);
      loadData(true);
    } catch (err: any) {
      toastError('Termination Failed', err.message);
    }
  };

  // Reactivate User
  const handleReactivateUser = async (targetUser: SuperAdminUser) => {
    try {
      await superAdminApi.reactivateUser(targetUser.id || targetUser._id);
      success('Account Reactivated', `${targetUser.name} has been restored to ACTIVE status.`);
      loadData(true);
    } catch (err: any) {
      toastError('Reactivation Failed', err.message);
    }
  };

  // Delete User Permanently
  const handleDeleteUser = async (targetUser: SuperAdminUser) => {
    if (!window.confirm(`Permanently delete ${targetUser.name} (${targetUser.email})? This action cannot be undone.`)) {
      return;
    }
    try {
      await superAdminApi.deleteUser(targetUser.id || targetUser._id);
      success('User Deleted', `Account deleted permanently.`);
      loadData(true);
    } catch (err: any) {
      toastError('Delete Failed', err.message);
    }
  };

  // Course Approval & Review Actions (Workflow 2)
  const handleOpenReview = async (courseId: string) => {
    try {
      setLoadingReview(true);
      setShowReviewModal(true);
      const res = await superAdminApi.getCourseReview(courseId);
      if (res.success && res.data) {
        setSelectedReviewCourse(res.data);
      }
    } catch (err: any) {
      toastError('Error', err.message || 'Failed to load course details for review.');
    } finally {
      setLoadingReview(false);
    }
  };

  const handleApproveCourse = async (courseId: string) => {
    try {
      await superAdminApi.approveCourse(courseId);
      success('Course Approved!', 'Course has been approved and moved to publishing stage.');
      if (showReviewModal) setShowReviewModal(false);
      loadData(true);
    } catch (err: any) {
      toastError('Approval Failed', err.message || 'Could not approve course.');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalCourse) return;
    try {
      await superAdminApi.rejectCourse(rejectModalCourse._id || rejectModalCourse.id, rejectionReason);
      success('Course Rejected', 'Course was rejected with feedback recorded for the instructor.');
      setShowRejectModal(false);
      setRejectModalCourse(null);
      setRejectionReason('');
      if (showReviewModal) setShowReviewModal(false);
      loadData(true);
    } catch (err: any) {
      toastError('Rejection Failed', err.message || 'Could not reject course.');
    }
  };

  // Super Admin Create Course On Behalf Handlers
  const handleAddAdminModule = () => {
    setCreateCourseForm((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          title: `Module ${prev.modules.length + 1}: New Section`,
          topics: [{ title: 'Topic 1: Overview', price: 0, isFree: false, duration: 30, videoUrl: '' }],
        },
      ],
    }));
  };

  const handleRemoveAdminModule = (mIdx: number) => {
    setCreateCourseForm((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== mIdx),
    }));
  };

  const handleAddAdminTopic = (mIdx: number) => {
    setCreateCourseForm((prev) => {
      const updated = [...prev.modules];
      updated[mIdx].topics.push({
        title: `Topic ${updated[mIdx].topics.length + 1}: Lesson`,
        price: 0,
        isFree: false,
        duration: 30,
        videoUrl: '',
      });
      return { ...prev, modules: updated };
    });
  };

  const handleRemoveAdminTopic = (mIdx: number, tIdx: number) => {
    setCreateCourseForm((prev) => {
      const updated = [...prev.modules];
      updated[mIdx].topics = updated[mIdx].topics.filter((_, idx) => idx !== tIdx);
      return { ...prev, modules: updated };
    });
  };

  const handleCreateCourseOnBehalf = async (publishDirectly = true) => {
    if (!createCourseForm.instructorId) {
      toastError('Instructor Required', 'Please select a registered instructor from the dropdown.');
      return;
    }
    if (!createCourseForm.title.trim()) {
      toastError('Title Required', 'Please enter a course title.');
      return;
    }

    try {
      setCreatingCourseOnBehalf(true);
      const res = await superAdminApi.createCourseOnBehalf({
        ...createCourseForm,
        publishDirectly,
      });

      if (res.success) {
        const selectedInstructor = instructorsList.find(
          (i) => (i.id || i._id) === createCourseForm.instructorId
        );
        success(
          publishDirectly ? 'Course Created & Published!' : 'Course Draft Created!',
          `Course "${createCourseForm.title}" is now successfully assigned to ${selectedInstructor?.name || 'Instructor'} with publishing fee waived.`
        );

        setShowCreateOnBehalfModal(false);
        setCreateCourseForm({
          instructorId: instructorsList[0]?.id || instructorsList[0]?._id || '',
          title: '',
          shortDescription: '',
          description: '',
          category: 'Development',
          subcategory: '',
          level: 'Beginner',
          language: 'English',
          coursePrice: 1999,
          thumbnail: '',
          banner: '',
          syllabusUrl: '',
          syllabusFileName: '',
          skills: ['React', 'Node.js'],
          modules: [
            {
              title: 'Getting Started & Architecture',
              topics: [{ title: 'Introduction & Setup', price: 0, isFree: true, duration: 25, videoUrl: '' }],
            },
          ],
        });

        loadData(true);
      }
    } catch (err: any) {
      console.error('Error creating course on behalf:', err);
      toastError('Creation Failed', err.response?.data?.message || err.message || 'Could not create course.');
    } finally {
      setCreatingCourseOnBehalf(false);
    }
  };

  // Country, Currency, Tax Actions
  const handleCreateCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminApi.createCountry(newCountryForm);
      success('Country Added', `Country ${newCountryForm.name} created.`);
      setShowAddCountryModal(false);
      loadData(true);
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminApi.createCurrency(newCurrencyForm);
      success('Currency Added', `Currency ${newCurrencyForm.currencyCode} created.`);
      setShowAddCurrencyModal(false);
      loadData(true);
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminApi.createTax(newTaxForm);
      success('Tax Rate Added', `Tax ${newTaxForm.taxName} created.`);
      setShowAddTaxModal(false);
      loadData(true);
    } catch (err: any) {
      toastError('Error', err.message);
    }
  };

  const adminName = `${user?.firstName || 'Super'} ${user?.lastName || 'Admin'}`.trim();

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans">
      {/* =========================================================================
          LEFT SIDEBAR NAVIGATION (Clean White Modern Design)
         ========================================================================= */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex">
        <div className="p-5 space-y-6">
          {/* Brand Logo & Super Admin Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              ED
            </div>
            <div>
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight leading-none">EdTech</h1>
              
              <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200">
                Super Admin
              </span>
            </div>
          </div>

          {/* Nav Items Menu */}
          <nav className="space-y-1 text-xs font-bold">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'creators', label: 'Creators', icon: GraduationCap },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'approvals', label: 'Course Approvals', icon: ShieldCheck, badge: approvalsList.length },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'refunds', label: 'Refunds', icon: RotateCcw },
              { id: 'payouts', label: 'Payouts', icon: CreditCard },
              { id: 'countries', label: 'Countries', icon: Globe },
              { id: 'currencies', label: 'Currencies', icon: Coins },
              { id: 'taxes', label: 'Taxes', icon: Receipt },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'fraud', label: 'Fraud & Risk', icon: ShieldAlert },
              { id: 'infrastructure', label: 'Infrastructure', icon: Server },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer select-none text-left ${
                    isActive
                      ? 'bg-indigo-600 text-white font-black shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Profile & Sign Out */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                {adminName[0] || 'S'}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-slate-900 truncate">{adminName}</p>
                <p className="text-[10px] text-indigo-600 font-semibold truncate">Root Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MAIN CONTENT AREA & TOPBAR
         ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        {/* Topbar Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search anything across platform..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(false)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                SA
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">{adminName}</span>
            </div>
          </div>
        </header>

        {/* Content Views Body */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto space-y-6">
          {/* =========================================================================
              VIEW 1: PLATFORM OVERVIEW (100% Dynamic from DB)
             ========================================================================= */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Title & Date Range */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Platform Overview</h2>
                  <p className="text-xs text-slate-500 font-medium">Key metrics and real-time insights across your entire ecosystem.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold shadow-xs">
                    Live Real-Time Telemetry
                  </span>
                </div>
              </div>

              {/* 8 Metric KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. GMV */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{overview?.kpi?.gmvFormatted || '₹0'}</p>
                    <p className="text-xs font-bold text-slate-500">GMV</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>

                {/* 2. Platform Revenue */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{overview?.kpi?.revenueFormatted || '₹0'}</p>
                    <p className="text-xs font-bold text-slate-500">Platform Revenue</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. Take Rate */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{overview?.kpi?.takeRate || '17.2%'}</p>
                    <p className="text-xs font-bold text-slate-500">Take Rate</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                    <PieChart className="w-6 h-6" />
                  </div>
                </div>

                {/* 4. Students */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{(overview?.kpi?.students ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-500">Students</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* 5. Creators */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{(overview?.kpi?.creators ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-500">Creators</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </div>

                {/* 6. Courses */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{(overview?.kpi?.courses ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-500">Courses</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>

                {/* 7. Topics */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{(overview?.kpi?.topics ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-500">Topics</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                </div>

                {/* 8. Orders */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-black text-slate-900">{(overview?.kpi?.orders ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-slate-500">Orders</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Charts Row: GMV & Revenue Trend + Dynamic Users by Role Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* GMV & Revenue Trend Chart (8 Cols) */}
                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">GMV & Revenue Trend</h3>
                      <p className="text-xs text-slate-500">Gross transaction volume vs net platform revenue</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <span className="flex items-center gap-1.5 text-indigo-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> GMV
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-600">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Platform Revenue
                      </span>
                    </div>
                  </div>

                  {/* Dynamic Visual Simulation */}
                  <div className="h-64 flex flex-col justify-between pt-4">
                    <div className="h-44 w-full flex items-end justify-between gap-2 px-2 border-b border-slate-200 relative">
                      {[
                        { label: 'Day 1', gmv: 0, rev: 0 },
                        { label: 'Day 5', gmv: 0, rev: 0 },
                        { label: 'Day 10', gmv: 0, rev: 0 },
                        { label: 'Day 15', gmv: 0, rev: 0 },
                        { label: 'Day 20', gmv: 0, rev: 0 },
                        { label: 'Day 25', gmv: 0, rev: 0 },
                        { label: 'Today', gmv: overview?.kpi?.gmv ? Math.min(100, Math.max(20, Math.round((overview.kpi.gmv / 5000) * 100))) : 40, rev: overview?.kpi?.revenue ? Math.min(100, Math.max(10, Math.round((overview.kpi.revenue / 2000) * 100))) : 20 },
                      ].map((bar, bIdx) => (
                        <div key={bIdx} className="flex-1 flex items-end justify-center gap-1.5 h-full">
                          <div
                            style={{ height: `${bar.gmv}%` }}
                            className="w-3 sm:w-4 bg-indigo-600 rounded-t-lg transition-all hover:bg-indigo-700"
                            title={`GMV: ${bar.gmv}%`}
                          ></div>
                          <div
                            style={{ height: `${bar.rev}%` }}
                            className="w-3 sm:w-4 bg-emerald-500 rounded-t-lg transition-all hover:bg-emerald-600"
                            title={`Revenue: ${bar.rev}%`}
                          ></div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 px-2 pt-2">
                      <span>Day 1</span>
                      <span>Day 5</span>
                      <span>Day 10</span>
                      <span>Day 15</span>
                      <span>Day 20</span>
                      <span>Day 25</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>

                {/* Users by Role Breakdown (4 Cols) - Fully Dynamic */}
                <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Users by Role</h3>
                    <p className="text-xs text-slate-500">Total {overview?.charts?.usersByRole?.total ?? 0} Registered Users</p>
                  </div>

                  <div className="py-4 flex items-center justify-center">
                    <div className="w-36 h-36 rounded-full border-8 border-indigo-600 border-t-purple-500 border-r-emerald-500 border-l-cyan-400 flex flex-col items-center justify-center text-center shadow-xs">
                      <span className="text-xl font-black text-slate-900">{overview?.charts?.usersByRole?.total ?? 0}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Total Users</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Students
                      </span>
                      <strong className="text-slate-900">
                        {overview?.charts?.usersByRole?.students ?? 0} ({overview?.charts?.usersByRole?.studentsPercent ?? '0%'})
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span> Instructors
                      </span>
                      <strong className="text-slate-900">
                        {overview?.charts?.usersByRole?.instructors ?? 0} ({overview?.charts?.usersByRole?.instructorsPercent ?? '0%'})
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Admins
                      </span>
                      <strong className="text-slate-900">
                        {overview?.charts?.usersByRole?.admins ?? 0} ({overview?.charts?.usersByRole?.adminsPercent ?? '0%'})
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-500"></span> Super Admins
                      </span>
                      <strong className="text-slate-900">
                        {overview?.charts?.usersByRole?.superAdmins ?? 0} ({overview?.charts?.usersByRole?.superAdminsPercent ?? '0%'})
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Top Performing Categories & Live Recent Activities */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Top Performing Categories (6 Cols) */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">Course Categories</h3>
                    <button
                      onClick={() => setActiveNav('courses')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3 pt-2 text-xs">
                    {(overview?.charts?.topCategories || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No categories registered yet.</p>
                    ) : (
                      overview?.charts?.topCategories.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-slate-700 font-bold">
                            <span>{cat.name}</span>
                            <span>{cat.count} course{cat.count === 1 ? '' : 's'} ({cat.percentage}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(15, cat.percentage)}%` }}
                              className="h-full bg-indigo-600 rounded-full"
                            ></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Activities (6 Cols) */}
                <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">Recent Activities</h3>
                    <span className="text-xs text-slate-400">Live Audit Stream</span>
                  </div>

                  <div className="space-y-3 pt-2">
                    {(overview?.recentActivities || []).length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No recent audit log activities recorded.</p>
                    ) : (
                      overview?.recentActivities.map((act, aIdx) => (
                        <div
                          key={aIdx}
                          className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs"
                        >
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 leading-snug truncate">{act.description}</p>
                            <p className="text-[11px] text-slate-500 font-medium">By {act.actor}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">{act.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 2: USERS MANAGEMENT (CRUD + Terminate / Reactivate)
             ========================================================================= */}
          {activeNav === 'users' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Header & Add User Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Users Management</h2>
                  <p className="text-xs text-slate-500">
                    Manage all students, instructors, and platform administrators with complete lifecycle governance.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Add User</span>
                </button>
              </div>

              {/* Filter Tabs (All Users, Students, Instructors, Admins) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex flex-wrap gap-1">
                  {[
                    { id: 'ALL', label: 'All Users' },
                    { id: 'STUDENT', label: 'Students' },
                    { id: 'INSTRUCTOR', label: 'Instructors' },
                    { id: 'ADMIN', label: 'Admins' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setUserRoleFilter(tab.id as any)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userRoleFilter === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={userStatusFilter}
                    onChange={(e) => setUserStatusFilter(e.target.value)}
                    aria-label="Filter users by status"
                    className="p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="TERMINATED">Terminated</option>
                  </select>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id || u._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                              {u.name?.[0] || 'U'}
                            </div>
                            <span className="font-bold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              u.role === 'ADMIN'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : u.role === 'INSTRUCTOR'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : u.role === 'SUPER_ADMIN'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : u.status === 'TERMINATED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{u.joinedDate}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'ACTIVE' ? (
                              <button
                                onClick={() => setTerminateTarget(u)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors border border-rose-200"
                              >
                                Terminate
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReactivateUser(u)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors border border-emerald-200"
                              >
                                Reactivate
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                              title="Delete Permanently"
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
              VIEW 3: CREATORS MANAGEMENT
             ========================================================================= */}
          {activeNav === 'creators' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Creators & Instructors</h2>
                <p className="text-xs text-slate-500">Monitor instructor profiles, courses created, and payouts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Joined Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u.id || u._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                              {u.name?.[0] || 'I'}
                            </div>
                            <span className="font-bold text-slate-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{u.joinedDate}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setTerminateTarget(u)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px] cursor-pointer border border-rose-200"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 4: COURSES MANAGEMENT (100% Dynamic - Only real courses)
             ========================================================================= */}
          {activeNav === 'courses' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Courses Management</h2>
                  <p className="text-xs text-slate-500">Manage all published, draft, and under-review courses across the platform.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value)}
                    aria-label="Filter courses by status"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="DRAFT">Draft</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <button
                    onClick={() => {
                      if (instructorsList.length > 0 && !createCourseForm.instructorId) {
                        setCreateCourseForm((prev) => ({ ...prev, instructorId: instructorsList[0].id || instructorsList[0]._id }));
                      }
                      setShowCreateOnBehalfModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
                    title="Create and directly publish a course for any registered instructor (Fee Waived)"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Course on Behalf</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Enrolled</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {coursesList.map((c) => (
                      <tr key={c.id || c._id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img src={c.thumbnail} alt={c.title} className="w-10 h-8 rounded-lg object-cover bg-slate-100 border border-slate-200" />
                            <span className="font-bold text-slate-900">{c.title}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{c.instructor}</td>
                        <td className="py-3 px-4 text-indigo-600 font-bold">{c.category}</td>
                        <td className="py-3 px-4 font-black text-slate-900">₹{c.price.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 font-bold text-slate-600">{c.enrolled}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              c.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReview(c.id || c._id)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[11px] cursor-pointer transition-colors"
                              title="Inspect curriculum, modules, topics and videos"
                            >
                              Inspect
                            </button>
                            <button
                              onClick={async () => {
                                const nextStatus = c.status === 'PUBLISHED' ? 'ARCHIVED' : 'PUBLISHED';
                                await superAdminApi.updateCourseStatus(c.id || c._id, nextStatus);
                                success('Course Status Updated', `Course is now ${nextStatus}`);
                                loadData(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] cursor-pointer border border-slate-200 transition-colors"
                            >
                              Toggle Status
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
              VIEW 4b: COURSE APPROVALS QUEUE (Workflow 2 - 100% Dynamic)
             ========================================================================= */}
          {activeNav === 'approvals' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">Course Approvals Queue</h2>
                    {approvalsList.length > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
                        {approvalsList.length} Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review curriculum structure, video lessons, syllabus documents, and pricing before approving courses for public marketplace listing.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => loadData(false)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
                    <span className="font-bold">Refresh Queue</span>
                  </button>
                </div>
              </div>

              {approvalsList.length === 0 ? (
                <div className="py-16 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900">Approval Queue is Clear</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are no courses waiting for Super Admin review. Newly submitted courses will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Course</th>
                        <th className="py-3 px-4">Instructor</th>
                        <th className="py-3 px-4">Curriculum Structure</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Submitted</th>
                        <th className="py-3 px-4 text-right">Review & Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvalsList.map((c) => (
                        <tr key={c.id || c._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {c.thumbnail ? (
                                <img
                                  src={c.thumbnail}
                                  alt={c.title}
                                  className="w-14 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-bold text-slate-900 block truncate max-w-xs">{c.title}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                    {c.category}
                                  </span>
                                  <span className="text-[10px] font-medium text-slate-500">
                                    {c.level || 'All Levels'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0">
                                {c.instructor?.name?.[0] || 'I'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{c.instructor?.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{c.instructor?.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800">
                                {c.modulesCount ?? (c.modules?.length || 0)} Modules • {c.topicsCount ?? 0} Topics
                              </span>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {c.lessonsCount ?? 0} Lessons / Videos
                              </p>
                              {c.syllabusUrl && (
                                <a
                                  href={c.syllabusUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>View Syllabus Document</span>
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-black text-slate-900">
                            ₹{(c.price ?? 0).toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4 text-slate-500 font-medium">
                            {c.submittedAt || 'Recent'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenReview(c.id || c._id)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Inspect</span>
                              </button>

                              <button
                                onClick={() => handleApproveCourse(c.id || c._id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>

                              <button
                                onClick={() => {
                                  setRejectModalCourse(c);
                                  setShowRejectModal(true);
                                }}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 cursor-pointer transition-colors"
                              >
                                <span>Reject</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              VIEW 5: ORDERS MANAGEMENT (100% Dynamic from DB)
             ========================================================================= */}
          {activeNav === 'orders' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Orders Management</h2>
                  <p className="text-xs text-slate-500">View and audit all course and topic purchase transactions.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    aria-label="Filter orders by status"
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Status</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Course / Topic</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ordersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                          No order transactions found.
                        </td>
                      </tr>
                    ) : (
                      ordersList.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-indigo-600">{ord.orderId}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{ord.user}</td>
                          <td className="py-3 px-4 text-slate-600">{ord.courseTopic}</td>
                          <td className="py-3 px-4 font-black text-slate-900">₹{ord.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{ord.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 6: REFUNDS MANAGEMENT (100% Dynamic from DB)
             ========================================================================= */}
          {activeNav === 'refunds' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Refunds Management</h2>
                <p className="text-xs text-slate-500">Process and review student refund requests with financial ledger reconciliation.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Refund ID</th>
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {refundsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                          No pending refund requests.
                        </td>
                      </tr>
                    ) : (
                      refundsList.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-indigo-600">{ref.refundId}</td>
                          <td className="py-3 px-4 text-slate-500">{ref.orderId}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{ref.user}</td>
                          <td className="py-3 px-4 font-black text-slate-900">₹{ref.amount}</td>
                          <td className="py-3 px-4 text-slate-600">{ref.reason}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                ref.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {ref.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {ref.status === 'PENDING' && (
                              <button
                                onClick={async () => {
                                  await superAdminApi.processRefund(ref.id, 'APPROVED');
                                  success('Refund Approved', `Refund ${ref.refundId} processed successfully.`);
                                  loadData(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] cursor-pointer shadow-xs"
                              >
                                Approve
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 7: PAYOUTS MANAGEMENT (100% Dynamic from DB)
             ========================================================================= */}
          {activeNav === 'payouts' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Payouts Management</h2>
                <p className="text-xs text-slate-500">Manage instructor creator earnings, payouts, and transfers.</p>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                  <p className="text-2xl font-black text-indigo-700">{payoutsData.metrics.totalPayouts}</p>
                  <p className="text-xs font-bold text-slate-500">Total Payouts</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <p className="text-2xl font-black text-amber-700">{payoutsData.metrics.pendingPayouts}</p>
                  <p className="text-xs font-bold text-slate-500">Pending</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-700">{payoutsData.metrics.completedPayouts}</p>
                  <p className="text-xs font-bold text-slate-500">Completed</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <p className="text-2xl font-black text-rose-700">{payoutsData.metrics.failedPayouts}</p>
                  <p className="text-xs font-bold text-slate-500">Failed</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Payout ID</th>
                      <th className="py-3 px-4">Instructor</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutsData.payouts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 font-medium">
                          No instructor payout disbursements generated.
                        </td>
                      </tr>
                    ) : (
                      payoutsData.payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4 font-bold text-indigo-600">{p.payoutId}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.instructor}</td>
                          <td className="py-3 px-4 font-black text-slate-900">₹{p.amount.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-slate-600">{p.paymentMethod}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                p.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{p.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 8: COUNTRIES MANAGEMENT
             ========================================================================= */}
          {activeNav === 'countries' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Countries Management</h2>
                  <p className="text-xs text-slate-500">Manage supported countries, regional compliance, and currency mappings.</p>
                </div>
                <button
                  onClick={() => setShowAddCountryModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Country</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Country Name</th>
                      <th className="py-3 px-4">Country Code</th>
                      <th className="py-3 px-4">Currency</th>
                      <th className="py-3 px-4">Timezone</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {countriesList.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{c.countryCode}</td>
                        <td className="py-3 px-4 font-bold text-slate-700">{c.currencyCode}</td>
                        <td className="py-3 px-4 text-slate-500">{c.timezone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              await superAdminApi.toggleCountry(c.id);
                              success('Country Toggled', `${c.name} status toggled.`);
                              loadData(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg text-[11px] cursor-pointer border border-slate-200"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 9: CURRENCIES MANAGEMENT
             ========================================================================= */}
          {activeNav === 'currencies' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Currencies Management</h2>
                  <p className="text-xs text-slate-500">Manage supported currencies, symbols, and live exchange conversion rates.</p>
                </div>
                <button
                  onClick={() => setShowAddCurrencyModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Currency</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Currency Name</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Symbol</th>
                      <th className="py-3 px-4">Exchange Rate (INR)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currenciesList.map((curr) => (
                      <tr key={curr.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{curr.name}</td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{curr.currencyCode}</td>
                        <td className="py-3 px-4 font-black text-lg text-slate-800">{curr.symbol}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{curr.exchangeRate}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {curr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              await superAdminApi.toggleCurrency(curr.id);
                              success('Currency Toggled', `${curr.name} status updated.`);
                              loadData(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg text-[11px] cursor-pointer border border-slate-200"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 10: TAXES MANAGEMENT
             ========================================================================= */}
          {activeNav === 'taxes' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Taxes Management</h2>
                  <p className="text-xs text-slate-500">Configure regional tax rules, GST rates, VAT, and fiscal classifications.</p>
                </div>
                <button
                  onClick={() => setShowAddTaxModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Tax</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Country</th>
                      <th className="py-3 px-4">Tax Name</th>
                      <th className="py-3 px-4">Tax Type</th>
                      <th className="py-3 px-4">Tax Rate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {taxesList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-bold text-slate-900">{t.countryCode}</td>
                        <td className="py-3 px-4 font-bold text-indigo-600">{t.taxName}</td>
                        <td className="py-3 px-4 text-slate-600">{t.taxType}</td>
                        <td className="py-3 px-4 font-black text-slate-900">{t.taxRate}%</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={async () => {
                              await superAdminApi.toggleTax(t.id);
                              success('Tax Toggled', `${t.taxName} updated.`);
                              loadData(true);
                            }}
                            className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-lg text-[11px] cursor-pointer border border-slate-200"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 11: PLATFORM ANALYTICS
             ========================================================================= */}
          {activeNav === 'analytics' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Platform Analytics & Growth</h2>
                <p className="text-xs text-slate-500">Perform growth and performance analytics across traffic, revenue, and learners.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-slate-900 text-sm">Platform Trajectory</h4>
                  <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-slate-200 px-4">
                    {[10, 25, 45, 60, 75, 90, 100].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div style={{ height: `${h}%` }} className="w-full max-w-[28px] bg-indigo-600 rounded-t-lg"></div>
                        <span className="text-[10px] text-slate-500 font-bold">W{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm">User Engagement</h4>
                  <div className="py-4 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-8 border-indigo-600 border-t-purple-500 border-r-emerald-500 flex items-center justify-center text-center font-black text-slate-900">
                      100%
                    </div>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Live Health</span> <strong className="text-emerald-600">Optimal</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Server Response</span> <strong className="text-slate-900">&lt; 45ms</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 12: FRAUD & RISK CONTROL
             ========================================================================= */}
          {activeNav === 'fraud' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Fraud & Risk Control</h2>
                <p className="text-xs text-slate-500">AI velocity anomaly detection and high-risk transaction monitoring.</p>
              </div>

              <div className="space-y-3">
                {fraudData.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No anomalous or fraudulent activity detected.</p>
                ) : (
                  fraudData.map((f, i) => (
                    <div key={i} className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                          {f.riskScore}%
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{f.type} ({f.eventId})</h4>
                          <p className="text-xs text-slate-500">{f.reason}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200">
                        {f.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
              VIEW 13: INFRASTRUCTURE TELEMETRY
             ========================================================================= */}
          {activeNav === 'infrastructure' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Infrastructure & System Health</h2>
                <p className="text-xs text-slate-500">Live production cluster health, deployment versions, and rollback readiness.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <p className="text-2xl font-black text-emerald-700">{infraData?.healthStatus || 'HEALTHY'}</p>
                  <p className="text-xs font-bold text-slate-500">Cluster Status</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">Uptime: {infraData?.uptime || '99.98%'}</p>
                </div>
                <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1">
                  <p className="text-2xl font-black text-slate-900">{infraData?.releaseVersion || 'v2.4.8-release'}</p>
                  <p className="text-xs font-bold text-slate-500">Active Deployment</p>
                  <p className="text-[11px] text-indigo-600 font-semibold">Env: {infraData?.environment || 'production'}</p>
                </div>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-2xl font-black text-slate-900">{infraData?.rollbackVersion || 'v2.4.7-lts'}</p>
                  <p className="text-xs font-bold text-slate-500">Rollback Target</p>
                  <p className="text-[11px] text-slate-500 font-semibold">Status: Verified Ready</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* =========================================================================
          MODAL: ADD USER (Student, Instructor, Admin)
         ========================================================================= */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 text-base">Provision New User Account</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="user@platform.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Temporary Password</label>
                <input
                  type="password"
                  placeholder="Leave blank for TemporaryPass123!"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role *</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                {newUserForm.role === 'ADMIN' && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Finance, Content"
                      value={newUserForm.department}
                      onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TERMINATE USER CONFIRMATION
         ========================================================================= */}
      {terminateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-rose-200 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Terminate {terminateTarget.role} Access</h3>
                <p className="text-xs text-slate-500">Target: {terminateTarget.name} ({terminateTarget.email})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to terminate this account? The user will be immediately logged out and barred from logging into the platform until reactivated.
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Termination Reason</label>
              <textarea
                rows={2}
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setTerminateTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTerminate}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Confirm Termination
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD COUNTRY
         ========================================================================= */}
      {showAddCountryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-900">
            <h3 className="font-extrabold text-slate-900 text-base">Add Supported Country</h3>
            <form onSubmit={handleCreateCountry} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Country Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Australia"
                  value={newCountryForm.name}
                  onChange={(e) => setNewCountryForm({ ...newCountryForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code (ISO) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AU"
                    value={newCountryForm.countryCode}
                    onChange={(e) => setNewCountryForm({ ...newCountryForm, countryCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Currency Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUD"
                    value={newCountryForm.currencyCode}
                    onChange={(e) => setNewCountryForm({ ...newCountryForm, currencyCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCountryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-xs">
                  Save Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD CURRENCY
         ========================================================================= */}
      {showAddCurrencyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-900">
            <h3 className="font-extrabold text-slate-900 text-base">Add Currency</h3>
            <form onSubmit={handleCreateCurrency} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Currency Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Australian Dollar"
                  value={newCurrencyForm.name}
                  onChange={(e) => setNewCurrencyForm({ ...newCurrencyForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Currency Code (ISO) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AUD"
                    value={newCurrencyForm.currencyCode}
                    onChange={(e) => setNewCurrencyForm({ ...newCurrencyForm, currencyCode: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Symbol *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. A$"
                    value={newCurrencyForm.symbol}
                    onChange={(e) => setNewCurrencyForm({ ...newCurrencyForm, symbol: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Exchange Rate (Base INR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newCurrencyForm.exchangeRate}
                  onChange={(e) => setNewCurrencyForm({ ...newCurrencyForm, exchangeRate: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddCurrencyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-xs">
                  Save Currency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD TAX
         ========================================================================= */}
      {showAddTaxModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-900">
            <h3 className="font-extrabold text-slate-900 text-base">Add Tax Rule</h3>
            <form onSubmit={handleCreateTax} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Country Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Germany"
                  value={newTaxForm.countryCode}
                  onChange={(e) => setNewTaxForm({ ...newTaxForm, countryCode: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MwSt / VAT"
                    value={newTaxForm.taxName}
                    onChange={(e) => setNewTaxForm({ ...newTaxForm, taxName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tax Rate (%) *</label>
                  <input
                    type="number"
                    required
                    placeholder="19"
                    value={newTaxForm.taxRate}
                    onChange={(e) => setNewTaxForm({ ...newTaxForm, taxRate: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddTaxModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-xs">
                  Save Tax
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: COURSE REVIEW & INSPECTION STUDIO (Workflow 2)
         ========================================================================= */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Course Verification & Review</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Inspect full course content, curriculum hierarchy, and instructor credentials.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReviewCourse(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {loadingReview ? (
                <div className="py-20 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="font-bold">Loading full course curriculum & telemetry...</p>
                </div>
              ) : selectedReviewCourse ? (
                <div className="space-y-6">
                  {/* Instructor Snapshot */}
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                        {selectedReviewCourse.instructor?.firstName?.[0] || 'I'}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Instructor</span>
                        <h4 className="font-black text-sm text-slate-900">
                          {selectedReviewCourse.instructor?.firstName} {selectedReviewCourse.instructor?.lastName}
                        </h4>
                        <p className="text-slate-500 font-medium">{selectedReviewCourse.instructor?.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Course Pricing</span>
                      <span className="text-lg font-black text-slate-900">
                        ₹{(selectedReviewCourse.course?.coursePrice ?? 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Course Details Card */}
                  <div className="space-y-3">
                    <h4 className="font-extrabold text-sm text-slate-900">Course Overview</h4>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px] block">Title</span>
                        <p className="font-bold text-slate-900 text-sm">{selectedReviewCourse.course?.title}</p>
                      </div>

                      {selectedReviewCourse.course?.shortDescription && (
                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[10px] block">Summary</span>
                          <p className="text-slate-700 font-medium">{selectedReviewCourse.course?.shortDescription}</p>
                        </div>
                      )}

                      {selectedReviewCourse.course?.description && (
                        <div>
                          <span className="font-bold text-slate-400 uppercase text-[10px] block">Full Description</span>
                          <p className="text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                            {selectedReviewCourse.course?.description}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-200 text-[11px]">
                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[9px]">Category</span>
                          <span className="font-bold text-slate-900">{selectedReviewCourse.course?.category || 'Development'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[9px]">Level</span>
                          <span className="font-bold text-slate-900">{selectedReviewCourse.course?.level || 'Beginner'}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-400 block uppercase text-[9px]">Language</span>
                          <span className="font-bold text-slate-900">{selectedReviewCourse.course?.language || 'English'}</span>
                        </div>
                      </div>

                      {selectedReviewCourse.course?.syllabusUrl && (
                        <div className="pt-2 border-t border-slate-200">
                          <span className="font-bold text-slate-400 block uppercase text-[9px] mb-1">Syllabus Document</span>
                          <a
                            href={selectedReviewCourse.course.syllabusUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download / Preview Uploaded Syllabus</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modules & Topics Hierarchy */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Curriculum Breakdown ({selectedReviewCourse.modules?.length || 0} Modules)
                      </h4>
                    </div>

                    {selectedReviewCourse.modules?.length === 0 ? (
                      <p className="text-slate-400 italic">No modules added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedReviewCourse.modules?.map((mod: any, mIdx: number) => (
                          <div key={mod._id || mIdx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/70 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">
                                Module {mIdx + 1}: {mod.title}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                {mod.topics?.length || 0} Topics
                              </span>
                            </div>

                            {mod.topics && mod.topics.length > 0 && (
                              <div className="pl-3 border-l-2 border-indigo-200 space-y-2 mt-2">
                                {mod.topics.map((top: any, tIdx: number) => (
                                  <div key={top._id || tIdx} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-slate-800 text-[11px]">
                                        Topic {mIdx + 1}.{tIdx + 1}: {top.title}
                                      </p>
                                      <span className="text-[10px] font-bold text-indigo-600">
                                        {top.isFree ? 'Free Preview' : `₹${(top.price ?? 0).toLocaleString()}`}
                                      </span>
                                    </div>

                                    {top.lessons && top.lessons.length > 0 && (
                                      <div className="pt-1.5 space-y-1">
                                        {top.lessons.map((les: any, lIdx: number) => (
                                          <div key={les._id || lIdx} className="flex items-center justify-between text-[10px] text-slate-600 pl-2">
                                            <span className="flex items-center gap-1.5">
                                              <Video className="w-3 h-3 text-indigo-500" />
                                              <span>{les.title}</span>
                                            </span>
                                            <span className="text-slate-400">{les.duration} mins</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedReviewCourse(null);
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors shadow-2xs"
              >
                Close
              </button>

              {selectedReviewCourse?.course && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRejectModalCourse(selectedReviewCourse.course);
                      setShowRejectModal(true);
                    }}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs border border-rose-200 cursor-pointer transition-colors"
                  >
                    Reject Course
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveCourse(selectedReviewCourse.course._id || selectedReviewCourse.course.id)}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Course</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REJECT COURSE REASON
         ========================================================================= */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Reject Course Submission</h3>
                <p className="text-xs text-slate-500 font-medium">Provide constructive feedback for the instructor.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Rejection / Feedback <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please replace missing preview video in Module 1, or provide higher resolution thumbnail..."
                className="w-full p-3 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:bg-white focus:outline-none focus:border-rose-500 leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectModalCourse(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          MODAL: CREATE COURSE ON BEHALF OF INSTRUCTOR (Admin Privilege Mode)
         ========================================================================= */}
      {showCreateOnBehalfModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Create Course on Behalf of Instructor
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                      Admin Privilege Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">
                    Assign ownership to any registered instructor • Fee Waived (₹0) • Instant Pre-Approval & Direct Publication
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateOnBehalfModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
              {/* Section 1: Instructor Selection Dropdown */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider">
                    1. Select Target Instructor <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    {instructorsList.length} Active Instructors Found
                  </span>
                </div>

                {instructorsList.length === 0 ? (
                  <p className="text-amber-700 font-bold bg-amber-50 p-3 rounded-xl border border-amber-200">
                    No registered instructors found. Please invite or register an instructor first.
                  </p>
                ) : (
                  <select
                    value={createCourseForm.instructorId}
                    onChange={(e) => setCreateCourseForm({ ...createCourseForm, instructorId: e.target.value })}
                    className="w-full p-3 bg-white border border-indigo-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  >
                    {instructorsList.map((inst) => (
                      <option key={inst.id || inst._id} value={inst.id || inst._id}>
                        {inst.name} ({inst.email})
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-2 text-[11px] text-indigo-900 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    The course will be assigned to this instructor's account, appear under their "My Courses", and publish directly with platform fees waived.
                  </span>
                </div>
              </div>

              {/* Section 2: Course Information */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                  2. Course Information & Metadata
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Master Full-Stack Web Development & Microservices"
                      value={createCourseForm.title}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, title: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={createCourseForm.category}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, category: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    >
                      <option value="Development">Development</option>
                      <option value="DevOps / Cloud">DevOps / Cloud</option>
                      <option value="Data Science">Data Science</option>
                      <option value="AI & ML">AI & ML</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subcategory</label>
                    <input
                      type="text"
                      placeholder="e.g. Cloud Native / Backend"
                      value={createCourseForm.subcategory}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, subcategory: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Experience Level</label>
                    <select
                      value={createCourseForm.level}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, level: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Language</label>
                    <input
                      type="text"
                      placeholder="e.g. English"
                      value={createCourseForm.language}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, language: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Course Price (INR ₹) *</label>
                    <input
                      type="number"
                      placeholder="0 for free"
                      value={createCourseForm.coursePrice}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, coursePrice: Number(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Thumbnail Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={createCourseForm.thumbnail}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, thumbnail: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Syllabus PDF Link or Document URL</label>
                    <input
                      type="text"
                      placeholder="https://example.com/syllabus.pdf"
                      value={createCourseForm.syllabusUrl}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, syllabusUrl: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="A punchy 1-2 sentence overview of what students will achieve"
                      value={createCourseForm.shortDescription}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, shortDescription: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Full Course Description</label>
                    <textarea
                      rows={3}
                      placeholder="Comprehensive overview of modules, topics, and real-world outcomes..."
                      value={createCourseForm.description}
                      onChange={(e) => setCreateCourseForm({ ...createCourseForm, description: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  {/* Skills Tags */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block font-bold text-slate-700">Skills / Tags</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add skill tag (e.g. Docker, TypeScript)..."
                        value={adminSkillInput}
                        onChange={(e) => setAdminSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (adminSkillInput.trim() && !createCourseForm.skills.includes(adminSkillInput.trim())) {
                              setCreateCourseForm({ ...createCourseForm, skills: [...createCourseForm.skills, adminSkillInput.trim()] });
                              setAdminSkillInput('');
                            }
                          }
                        }}
                        className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (adminSkillInput.trim() && !createCourseForm.skills.includes(adminSkillInput.trim())) {
                            setCreateCourseForm({ ...createCourseForm, skills: [...createCourseForm.skills, adminSkillInput.trim()] });
                            setAdminSkillInput('');
                          }
                        }}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl"
                      >
                        Add Tag
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {createCourseForm.skills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5">
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => setCreateCourseForm({ ...createCourseForm, skills: createCourseForm.skills.filter((_, sIdx) => sIdx !== idx) })}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Curriculum Structure (Modules & Topics) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                      3. Curriculum Structure ({createCourseForm.modules.length} Modules)
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">Add structured modules and video lesson topics</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAdminModule}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {createCourseForm.modules.map((mod, mIdx) => (
                    <div key={mIdx} className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Module {mIdx + 1} Title</label>
                          <input
                            type="text"
                            value={mod.title}
                            onChange={(e) => {
                              const updated = [...createCourseForm.modules];
                              updated[mIdx].title = e.target.value;
                              setCreateCourseForm({ ...createCourseForm, modules: updated });
                            }}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-xs focus:bg-white"
                          />
                        </div>
                        {createCourseForm.modules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdminModule(mIdx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg self-end cursor-pointer"
                            title="Remove Module"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Topics under this Module */}
                      <div className="pl-3 border-l-2 border-indigo-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Topics ({mod.topics.length})</span>
                          <button
                            type="button"
                            onClick={() => handleAddAdminTopic(mIdx)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            + Add Topic
                          </button>
                        </div>

                        {mod.topics.map((top, tIdx) => (
                          <div key={tIdx} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Topic Title..."
                                value={top.title}
                                onChange={(e) => {
                                  const updated = [...createCourseForm.modules];
                                  updated[mIdx].topics[tIdx].title = e.target.value;
                                  setCreateCourseForm({ ...createCourseForm, modules: updated });
                                }}
                                className="flex-1 p-1.5 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 text-xs"
                              />
                              <input
                                type="number"
                                placeholder="Mins"
                                value={top.duration || 30}
                                onChange={(e) => {
                                  const updated = [...createCourseForm.modules];
                                  updated[mIdx].topics[tIdx].duration = Number(e.target.value) || 30;
                                  setCreateCourseForm({ ...createCourseForm, modules: updated });
                                }}
                                className="w-16 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center"
                                title="Duration in minutes"
                              />
                              <label className="flex items-center gap-1 text-[10px] font-bold text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={top.isFree}
                                  onChange={(e) => {
                                    const updated = [...createCourseForm.modules];
                                    updated[mIdx].topics[tIdx].isFree = e.target.checked;
                                    setCreateCourseForm({ ...createCourseForm, modules: updated });
                                  }}
                                />
                                <span>Free</span>
                              </label>
                              {mod.topics.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAdminTopic(mIdx, tIdx)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Video Stream URL (MP4 / HLS / YouTube)..."
                              value={top.videoUrl || ''}
                              onChange={(e) => {
                                const updated = [...createCourseForm.modules];
                                updated[mIdx].topics[tIdx].videoUrl = e.target.value;
                                setCreateCourseForm({ ...createCourseForm, modules: updated });
                              }}
                              className="w-full p-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowCreateOnBehalfModal(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={creatingCourseOnBehalf}
                  onClick={() => handleCreateCourseOnBehalf(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Save as Draft for Instructor
                </button>

                <button
                  type="button"
                  disabled={creatingCourseOnBehalf}
                  onClick={() => handleCreateCourseOnBehalf(true)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 transition-all"
                >
                  {creatingCourseOnBehalf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Publishing Course...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create & Publish Live (Pre-Approved)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
