import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tag,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  Copy,
  Check,
  Layers,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
  BookOpen,
  User,
} from 'lucide-react';
import {
  couponApi,
  type Coupon,
  type CouponStats,
  type CreateCouponPayload,
  type UpdateCouponPayload,
  type CourseDropdownItem,
} from '../../api/coupons';

const EIGHT_CHAR_REGEX = /^[A-Za-z0-9!@#$%^&*]{8}$/;

export const SuperAdminCouponsTab: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [coursesList, setCoursesList] = useState<CourseDropdownItem[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [discountTypeFilter, setDiscountTypeFilter] = useState('ALL');

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT' | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Form State
  const [formCode, setFormCode] = useState('');
  const [formInstructorId, setFormInstructorId] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [formDiscountValue, setFormDiscountValue] = useState<number | ''>(20);
  const [formMinAmount, setFormMinAmount] = useState<number | ''>(0);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | ''>('');
  const [formUsageLimit, setFormUsageLimit] = useState<number | ''>(100);
  const [formPerUserLimit, setFormPerUserLimit] = useState<number | ''>(1);
  const [formStartDate, setFormStartDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load Courses for dropdown
  const fetchCoursesDropdown = async () => {
    try {
      setCoursesLoading(true);
      const res = await couponApi.getCoursesDropdown();
      if (res.success && res.data) {
        setCoursesList(res.data);
      }
    } catch (err) {
      console.error('Failed to load courses dropdown:', err);
    } finally {
      setCoursesLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesDropdown();
  }, []);

  // Dynamically extract unique tutors from real-time database courses
  const instructorsList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; courseCount: number }>();
    coursesList.forEach((crs) => {
      const inst = crs.instructor;
      if (inst && inst.id) {
        const instId = String(inst.id);
        if (!map.has(instId)) {
          map.set(instId, {
            id: instId,
            name: inst.name || 'Instructor',
            email: inst.email || '',
            courseCount: 1,
          });
        } else {
          map.get(instId)!.courseCount += 1;
        }
      } else {
        const unassignedKey = 'unassigned';
        if (!map.has(unassignedKey)) {
          map.set(unassignedKey, {
            id: unassignedKey,
            name: 'Platform / Unassigned',
            email: 'platform@edutech.com',
            courseCount: 1,
          });
        } else {
          map.get(unassignedKey)!.courseCount += 1;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [coursesList]);

  // Dynamically filter courses for the selected instructor
  const filteredCoursesForInstructor = useMemo(() => {
    if (!formInstructorId) return [];
    if (formInstructorId === 'unassigned') {
      return coursesList.filter((c) => !c.instructor?.id);
    }
    return coursesList.filter((c) => String(c.instructor?.id) === formInstructorId);
  }, [coursesList, formInstructorId]);

  const handleInstructorChange = (newInstId: string) => {
    setFormInstructorId(newInstId);
    const coursesForThisInst = newInstId === 'unassigned'
      ? coursesList.filter((c) => !c.instructor?.id)
      : coursesList.filter((c) => String(c.instructor?.id) === newInstId);

    if (coursesForThisInst.length > 0) {
      setFormCourseId(coursesForThisInst[0]._id);
    } else {
      setFormCourseId('');
    }
  };

  // Load Coupons
  const fetchCoupons = useCallback(
    async (isSilent = false) => {
      try {
        if (!isSilent) setRefreshing(true);
        const res = await couponApi.getCoupons({
          page,
          limit: 10,
          search: searchQuery.trim() || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          discountType: discountTypeFilter === 'ALL' ? undefined : discountTypeFilter,
        });

        if (res.success && res.data) {
          setCoupons(res.data.coupons);
          setStats(res.data.stats);
          setTotalPages(res.data.pagination.pages);
          setTotalCount(res.data.pagination.total);
        }
      } catch (err) {
        console.error('Failed to load coupons:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, searchQuery, statusFilter, discountTypeFilter]
  );

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleOpenCreateModal = () => {
    const now = new Date();
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let defaultInstId = '';
    let defaultCourseId = '';
    if (instructorsList.length > 0) {
      defaultInstId = instructorsList[0].id;
      const initialCourses = defaultInstId === 'unassigned'
        ? coursesList.filter((c) => !c.instructor?.id)
        : coursesList.filter((c) => String(c.instructor?.id) === defaultInstId);
      if (initialCourses.length > 0) {
        defaultCourseId = initialCourses[0]._id;
      }
    } else if (coursesList.length > 0) {
      defaultCourseId = coursesList[0]._id;
    }

    setFormCode('');
    setFormInstructorId(defaultInstId);
    setFormCourseId(defaultCourseId);
    setFormDiscountType('PERCENTAGE');
    setFormDiscountValue(20);
    setFormMinAmount(0);
    setFormMaxDiscount('');
    setFormUsageLimit(100);
    setFormPerUserLimit(1);
    setFormStartDate(now.toISOString().slice(0, 16));
    setFormExpiryDate(future.toISOString().slice(0, 16));
    setFormStatus('ACTIVE');
    setFormDescription('Exclusive course promo coupon');
    setFormError(null);
    setEditingCoupon(null);
    setModalMode('CREATE');
  };

  const handleOpenEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);

    const crsId = typeof coupon.courseId === 'object' ? coupon.courseId?._id : coupon.courseId || '';
    const rawInstId = typeof coupon.instructorId === 'object' ? coupon.instructorId?._id : coupon.instructorId || '';

    // Find matching course in coursesList
    const matchedCourse = coursesList.find((c) => c._id === crsId);
    const resolvedInstId = matchedCourse?.instructor?.id
      ? String(matchedCourse.instructor.id)
      : (rawInstId ? String(rawInstId) : (instructorsList.length > 0 ? instructorsList[0].id : ''));

    setFormInstructorId(resolvedInstId);
    setFormCourseId(crsId);
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue);
    setFormMinAmount(coupon.minimumAmount || 0);
    setFormMaxDiscount(coupon.maximumDiscount !== undefined && coupon.maximumDiscount !== null ? coupon.maximumDiscount : '');
    setFormUsageLimit(coupon.usageLimit);
    setFormPerUserLimit(coupon.perUserLimit || 1);
    setFormStartDate(new Date(coupon.startDate).toISOString().slice(0, 16));
    setFormExpiryDate(new Date(coupon.expiryDate).toISOString().slice(0, 16));
    setFormStatus(coupon.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE');
    setFormDescription(coupon.description || '');
    setFormError(null);
    setModalMode('EDIT');
  };

  const selectedCourse = coursesList.find((c) => c._id === formCourseId);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    const cleanCode = formCode.trim();
    if (cleanCode.length !== 8) {
      setFormError('Coupon code must be exactly 8 characters.');
      return;
    }
    if (!EIGHT_CHAR_REGEX.test(cleanCode)) {
      setFormError('Code contains invalid characters. Allowed: Letters, Numbers, !@#$%^&*');
      return;
    }

    if (modalMode === 'CREATE' && !formCourseId) {
      setFormError('Please select a course for this coupon.');
      return;
    }

    if (!formDiscountValue || Number(formDiscountValue) <= 0) {
      setFormError('Discount value must be greater than 0.');
      return;
    }

    if (formDiscountType === 'PERCENTAGE' && Number(formDiscountValue) > 100) {
      setFormError('Percentage discount cannot exceed 100%.');
      return;
    }

    if (!formStartDate || !formExpiryDate) {
      setFormError('Start date and expiry date are required.');
      return;
    }

    const start = new Date(formStartDate);
    const expiry = new Date(formExpiryDate);
    if (start >= expiry) {
      setFormError('Start date and time must be earlier than expiry date and time.');
      return;
    }

    if (!formUsageLimit || Number(formUsageLimit) < 1) {
      setFormError('Usage limit must be a positive integer.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'CREATE') {
        const payload: CreateCouponPayload = {
          code: cleanCode,
          courseId: formCourseId,
          discountType: formDiscountType,
          discountValue: Number(formDiscountValue),
          minimumAmount: formMinAmount ? Number(formMinAmount) : 0,
          maximumDiscount: formMaxDiscount !== '' ? Number(formMaxDiscount) : undefined,
          usageLimit: Number(formUsageLimit),
          perUserLimit: formPerUserLimit ? Number(formPerUserLimit) : 1,
          startDate: start.toISOString(),
          expiryDate: expiry.toISOString(),
          status: formStatus,
          description: formDescription.trim() || undefined,
        };

        const res = await couponApi.createCoupon(payload);
        if (res.success) {
          setModalMode(null);
          fetchCoupons(true);
        }
      } else if (modalMode === 'EDIT' && editingCoupon) {
        const payload: UpdateCouponPayload = {
          code: cleanCode,
          courseId: formCourseId || undefined,
          discountType: formDiscountType,
          discountValue: Number(formDiscountValue),
          minimumAmount: formMinAmount ? Number(formMinAmount) : 0,
          maximumDiscount: formMaxDiscount !== '' ? Number(formMaxDiscount) : undefined,
          usageLimit: Number(formUsageLimit),
          perUserLimit: formPerUserLimit ? Number(formPerUserLimit) : 1,
          startDate: start.toISOString(),
          expiryDate: expiry.toISOString(),
          status: formStatus,
          description: formDescription.trim() || undefined,
        };

        const res = await couponApi.updateCoupon(editingCoupon._id, payload);
        if (res.success) {
          setModalMode(null);
          fetchCoupons(true);
        }
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save coupon.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const nextStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await couponApi.updateCouponStatus(coupon._id, nextStatus);
      fetchCoupons(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    const isUsed = coupon.usedCount > 0;
    const promptMsg = isUsed
      ? `Coupon "${coupon.code}" has already been used ${coupon.usedCount} time(s). It will be safely archived without breaking historical student orders. Proceed?`
      : `Are you sure you want to permanently delete coupon "${coupon.code}"?`;

    if (!window.confirm(promptMsg)) return;

    try {
      await couponApi.deleteCoupon(coupon._id);
      fetchCoupons(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const getDerivedStatusBadge = (derivedStatus: string) => {
    switch (derivedStatus) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'NOT_YET_ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-500" />
            SCHEDULED
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            EXPIRED
          </span>
        );
      case 'USAGE_LIMIT_REACHED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Layers className="w-3 h-3 text-purple-500" />
            LIMIT REACHED
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            INACTIVE
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold mb-2 border border-indigo-500/30">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            Super Admin Authority • Dynamic Pricing Engine
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Platform Coupon Management</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Create, audit, and configure 8-character promotional vouchers with live server-side validation, usage quotas, and expiry enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCoupons(false)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer border border-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Coupon</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Coupons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats?.totalCoupons ?? totalCount ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500">Total Configured</p>
            </div>
          </div>
        </div>

        {/* 2. Active Coupons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-emerald-600">{stats?.activeCoupons ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500">Live Active Coupons</p>
            </div>
          </div>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
          </span>
        </div>

        {/* 3. Expired Coupons */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats?.expiredCoupons ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500">Past Validity Window</p>
            </div>
          </div>
        </div>

        {/* 4. Total Redemptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{stats?.totalRedemptions ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500">Successful Redemptions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Coupons Table Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Platform Coupon Directory</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
              EXACT 8-CHAR CODES
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="NOT_YET_ACTIVE">Scheduled (Future)</option>
              <option value="EXPIRED">Expired</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Discount Type Filter */}
            <select
              value={discountTypeFilter}
              onChange={(e) => {
                setDiscountTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Discount Types</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed Amount (₹)</option>
            </select>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search code or note..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white w-48 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-sm font-semibold">Loading dynamic coupons registry...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm font-semibold space-y-2">
              <p>No coupons found matching current criteria.</p>
              <button
                onClick={handleOpenCreateModal}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                Create your first platform coupon
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-4">Target Course</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Validity Window</th>
                  <th className="py-3 px-4">Usage / Quota</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Live Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {coupons.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Code */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 tracking-wider">
                          {c.code}
                        </span>
                        <button
                          onClick={() => copyToClipboard(c.code)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedCode === c.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-[11px] text-slate-400 font-sans mt-0.5 truncate max-w-xs">
                          {c.description}
                        </p>
                      )}
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 max-w-[200px] truncate">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate" title={c.courseId?.title || 'Unknown Course'}>
                          {c.courseId?.title || 'Unknown Course'}
                        </span>
                      </div>
                      {c.courseId?.coursePrice !== undefined && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Base Price: ₹{c.courseId.coursePrice.toLocaleString('en-IN')}
                        </p>
                      )}
                    </td>

                    {/* Instructor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold">
                          {c.instructorId ? `${c.instructorId.firstName} ${c.instructorId.lastName}` : 'N/A'}
                        </span>
                      </div>
                      {c.instructorId?.email && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {c.instructorId.email}
                        </p>
                      )}
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-slate-900">
                        {c.discountType === 'PERCENTAGE'
                          ? `${c.discountValue}% OFF`
                          : `₹${c.discountValue.toLocaleString('en-IN')} OFF`}
                      </span>
                      {c.maximumDiscount ? (
                        <p className="text-[10px] text-slate-400">Max ₹{c.maximumDiscount.toLocaleString('en-IN')}</p>
                      ) : null}
                      {c.minimumAmount > 0 ? (
                        <p className="text-[10px] text-slate-400">Min Order ₹{c.minimumAmount.toLocaleString('en-IN')}</p>
                      ) : null}
                    </td>

                    {/* Validity Window */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <div className="text-[11px] space-y-0.5">
                        <p>From: <span className="font-semibold text-slate-800">{new Date(c.startDate).toLocaleDateString()}</span></p>
                        <p>Until: <span className="font-semibold text-slate-800">{new Date(c.expiryDate).toLocaleDateString()}</span></p>
                      </div>
                    </td>

                    {/* Usage / Limit */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{c.usedCount}</span>
                      <span className="text-slate-400"> / {c.usageLimit}</span>
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-4 font-bold text-indigo-600">
                      {c.remainingUses} left
                    </td>

                    {/* Live Status */}
                    <td className="py-3.5 px-4">{getDerivedStatusBadge(c.derivedStatus)}</td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleStatus(c)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            c.status === 'ACTIVE'
                              ? 'text-emerald-600 hover:bg-emerald-50'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                          title={c.status === 'ACTIVE' ? 'Deactivate Coupon' : 'Activate Coupon'}
                        >
                          {c.status === 'ACTIVE' ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(c)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Coupon"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCoupon(c)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete / Archive Coupon"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {page} of {totalPages} ({totalCount} total coupons)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg font-bold transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {modalMode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {modalMode === 'CREATE' ? 'Create Course-Scoped Coupon' : `Edit Coupon: ${editingCoupon?.code}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exact 8-character codes. Scoped to a specific course & derived instructor.
                </p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* 2-Step Tutor & Course Selection */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3.5">
                {/* 1. Tutor Dropdown */}
                <div>
                  <label className="block font-bold text-indigo-950 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      Step 1: Select Instructor / Tutor *
                    </span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      ({instructorsList.length} tutors available)
                    </span>
                  </label>
                  {coursesLoading ? (
                    <div className="py-2 text-xs text-indigo-600 animate-pulse font-semibold">Loading tutors & courses...</div>
                  ) : (
                    <select
                      value={formInstructorId}
                      onChange={(e) => handleInstructorChange(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                    >
                      <option value="" disabled>Select an instructor...</option>
                      {instructorsList.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} {inst.email ? `(${inst.email})` : ''} — {inst.courseCount} {inst.courseCount === 1 ? 'course' : 'courses'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Course Dropdown (Filtered by selected tutor) */}
                <div>
                  <label className="block font-bold text-indigo-950 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Step 2: Select Target Course *
                    </span>
                    <span className="text-[10px] text-indigo-600 font-normal">
                      ({filteredCoursesForInstructor.length} courses for selected tutor)
                    </span>
                  </label>
                  {coursesLoading ? (
                    <div className="py-2 text-xs text-indigo-600 animate-pulse font-semibold">Loading available courses...</div>
                  ) : (
                    <select
                      value={formCourseId}
                      onChange={(e) => setFormCourseId(e.target.value)}
                      required
                      disabled={!formInstructorId || filteredCoursesForInstructor.length === 0}
                      className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 shadow-xs cursor-pointer"
                    >
                      {filteredCoursesForInstructor.length === 0 ? (
                        <option value="">No courses available for this tutor</option>
                      ) : (
                        <>
                          <option value="" disabled>Select a course by this tutor...</option>
                          {filteredCoursesForInstructor.map((crs) => (
                            <option key={crs._id} value={crs._id}>
                              {crs.title} — ₹{crs.coursePrice?.toLocaleString('en-IN') || 0} ({crs.status})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  )}
                </div>

                {/* Authoritative Scoping Summary */}
                {selectedCourse && (
                  <div className="pt-2.5 border-t border-indigo-100/90 flex flex-wrap items-center justify-between text-[11px] gap-2">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Coupon will bind to: <strong className="text-slate-900">{selectedCourse.title}</strong>
                    </span>
                    <span className="font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                      Price: ₹{selectedCourse.coursePrice?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                )}
              </div>

              {/* 1. Coupon Code & Discount Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Coupon Code * <span className="text-[10px] text-indigo-600 font-mono">({formCode.length}/8 chars)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    required
                    placeholder="e.g. Ab7@X2!Q"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-sm text-slate-900 tracking-wider focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Letters, numbers, and !@#$%^&* allowed.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Type *</label>
                  <select
                    value={formDiscountType}
                    onChange={(e) => setFormDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    <option value="FIXED">FIXED AMOUNT (₹)</option>
                  </select>
                </div>
              </div>

              {/* 2. Discount Value & Maximum Discount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {formDiscountType === 'PERCENTAGE' ? 'Discount Percentage (%) *' : 'Fixed Discount Amount (₹) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={formDiscountType === 'PERCENTAGE' ? 100 : 100000}
                    required
                    value={formDiscountValue}
                    onChange={(e) => setFormDiscountValue(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Max Discount Cap (₹) <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 1000"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 3. Minimum Order Amount & Usage Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minimum Order Amount (₹) <span className="text-[10px] text-slate-400 font-normal">(0 = None)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formMinAmount}
                    onChange={(e) => setFormMinAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Usage Limit *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="e.g. 100"
                    value={formUsageLimit}
                    onChange={(e) => setFormUsageLimit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 4. Per User Limit & Initial Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Per User Limit *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formPerUserLimit}
                    onChange={(e) => setFormPerUserLimit(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* 5. Start Date+Time & Expiry Date+Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valid From (Date & Time) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Valid Until (Date & Time) *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              {/* 6. Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Festival Season 20% discount on this course"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : modalMode === 'CREATE' ? (
                    <span>Create Course Coupon</span>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
