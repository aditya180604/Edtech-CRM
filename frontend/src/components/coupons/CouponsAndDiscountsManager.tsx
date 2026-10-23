import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Copy,
  Check,
  Percent,
  Calendar,
  AlertCircle,
  Loader2,
  BookOpen,
  Clock,
  Sparkles,
  Minus,
  X,
  Store,
  Ticket,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  couponApi,
  type Coupon,
  type CourseDropdownItem,
  type CreateCouponPayload,
  type CourseDiscountItem,
} from '../../api/coupons';
import { useToast } from '../../context/ToastContext';

interface CouponsAndDiscountsManagerProps {
  role?: 'SUPER_ADMIN' | 'INSTRUCTOR';
  initialCourses?: any[];
}

export const CouponsAndDiscountsManager: React.FC<CouponsAndDiscountsManagerProps> = ({
  role = 'SUPER_ADMIN',
  initialCourses = [],
}) => {
  const { success, error: toastError } = useToast();

  // Active subtab: 'discounts' or 'coupons'
  const [activeTab, setActiveTab] = useState<'discounts' | 'coupons'>('discounts');

  // Convert initialCourses to CourseDiscountItem format as default
  const formattedInitial: CourseDiscountItem[] = (initialCourses || []).map((c: any) => {
    const isExpired = c.discountValidUntil ? new Date(c.discountValidUntil) <= new Date() : false;
    const isDiscountActive = Boolean(c.discountPercent > 0 && !isExpired);
    const effectivePrice = isDiscountActive
      ? (c.discountPrice || Math.round((c.coursePrice || 0) * (1 - c.discountPercent / 100)))
      : (c.coursePrice ?? c.price ?? 0);

    return {
      _id: c._id || c.id || '',
      title: c.title || 'Untitled Course',
      slug: c.slug || c._id || '',
      thumbnail: c.thumbnail,
      category: c.category || 'General',
      status: c.status || 'PUBLISHED',
      coursePrice: c.coursePrice ?? c.price ?? 0,
      discountPrice: effectivePrice,
      discountPercent: isDiscountActive ? (c.discountPercent || 0) : 0,
      rawDiscountPercent: c.discountPercent || 0,
      discountValidUntil: c.discountValidUntil || null,
      isDiscountActive,
      isExpired,
      discountAppliedByRole: c.discountAppliedByRole || 'NONE',
    };
  });

  // ==========================================
  // 1. COURSE DISCOUNTS STATE
  // ==========================================
  const [courseDiscounts, setCourseDiscounts] = useState<CourseDiscountItem[]>(formattedInitial);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [discountSearch, setDiscountSearch] = useState('');
  const [discountStatusFilter, setDiscountStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'NONE'>('ALL');

  // Edit Course Discount Modal
  const [editingDiscountCourse, setEditingDiscountCourse] = useState<CourseDiscountItem | null>(null);
  const [modalDiscountPercent, setModalDiscountPercent] = useState<number>(20);
  const [modalExpiryDate, setModalExpiryDate] = useState<string>('');
  const [submittingDiscount, setSubmittingDiscount] = useState(false);

  // ==========================================
  // 2. COUPONS STATE
  // ==========================================
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<CourseDropdownItem[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponStatusFilter, setCouponStatusFilter] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Coupon Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isSubmittingCoupon, setIsSubmittingCoupon] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');

  const [couponFormData, setCouponFormData] = useState<CreateCouponPayload>({
    code: '',
    courseId: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minimumAmount: 0,
    maximumDiscount: undefined,
    usageLimit: 100,
    perUserLimit: 1,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'ACTIVE',
    description: '',
  });

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const fetchDiscounts = async () => {
    try {
      setLoadingDiscounts(true);
      const res = await couponApi.getCourseDiscounts({
        search: discountSearch || undefined,
      });
      if (res.data && res.data.length > 0) {
        setCourseDiscounts(res.data);
      } else if (formattedInitial.length > 0 && !discountSearch) {
        setCourseDiscounts(formattedInitial);
      } else {
        setCourseDiscounts(res.data || []);
      }
    } catch (err: any) {
      console.warn('Could not load course discounts from server, using existing list:', err);
      if (formattedInitial.length > 0) {
        setCourseDiscounts(formattedInitial);
      }
    } finally {
      setLoadingDiscounts(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const res = await couponApi.getCoupons({
        search: couponSearch || undefined,
        status: couponStatusFilter || undefined,
      });
      setCoupons(res.data?.coupons || []);
    } catch (err: any) {
      console.warn('Coupons list fetch quiet warning:', err);
      // Suppress noisy error toast for instructors who have no coupons yet
    } finally {
      setLoadingCoupons(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const res = await couponApi.getCoursesDropdown();
      setCourses(res.data || []);
    } catch (err: any) {
      console.warn('Could not load courses dropdown:', err);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [discountSearch]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchCoupons();
      fetchAvailableCourses();
    }
  }, [activeTab, couponSearch, couponStatusFilter]);

  // Keep synced if initialCourses changes
  useEffect(() => {
    if (initialCourses && initialCourses.length > 0 && courseDiscounts.length === 0) {
      setCourseDiscounts(formattedInitial);
    }
  }, [initialCourses]);

  // ==========================================
  // COURSE DISCOUNT ACTIONS
  // ==========================================
  const openDiscountModal = (course: CourseDiscountItem) => {
    setEditingDiscountCourse(course);
    setModalDiscountPercent(course.isDiscountActive ? course.discountPercent : 20);
    if (course.discountValidUntil) {
      setModalExpiryDate(new Date(course.discountValidUntil).toISOString().split('T')[0]);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 14);
      setModalExpiryDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSaveDiscount = async (percentToSave?: number) => {
    if (!editingDiscountCourse) return;
    const finalPercent = percentToSave !== undefined ? percentToSave : modalDiscountPercent;

    try {
      setSubmittingDiscount(true);
      await couponApi.updateCourseDiscount(editingDiscountCourse._id, {
        discountPercent: finalPercent,
        discountValidUntil: finalPercent > 0 ? (modalExpiryDate || null) : null,
      });

      if (finalPercent === 0) {
        success('Discount Removed', `Regular price restored for "${editingDiscountCourse.title}".`);
      } else {
        success('Discount Live', `${finalPercent}% discount applied to "${editingDiscountCourse.title}".`);
      }

      setEditingDiscountCourse(null);
      fetchDiscounts();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || err.message || 'Could not update discount.');
    } finally {
      setSubmittingDiscount(false);
    }
  };

  const handleQuickAdjust = async (course: CourseDiscountItem, delta: number) => {
    const current = course.isDiscountActive ? course.discountPercent : 0;
    const next = Math.max(0, Math.min(90, current + delta));
    try {
      await couponApi.updateCourseDiscount(course._id, {
        discountPercent: next,
        discountValidUntil: course.discountValidUntil || null,
      });
      success('Updated', `Discount for "${course.title}" set to ${next}%.`);
      fetchDiscounts();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Could not adjust discount.');
    }
  };

  // Filtered Course Discounts
  const filteredDiscounts = courseDiscounts.filter((c) => {
    if (discountStatusFilter === 'ACTIVE') return c.isDiscountActive;
    if (discountStatusFilter === 'EXPIRED') return c.isExpired;
    if (discountStatusFilter === 'NONE') return !c.isDiscountActive && !c.isExpired;
    return true;
  });

  // ==========================================
  // COUPON ACTIONS
  // ==========================================
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Code Copied', `"${code}" copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const nextStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await couponApi.updateCouponStatus(coupon._id, nextStatus);
      success('Status Updated', `Coupon "${coupon.code}" is now ${nextStatus}.`);
      fetchCoupons();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!window.confirm(`Delete coupon "${code}"?`)) return;
    try {
      await couponApi.deleteCoupon(id);
      success('Deleted', `Coupon "${code}" deleted.`);
      fetchCoupons();
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.message || 'Failed to delete coupon.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponFormData.code.trim()) {
      toastError('Validation', 'Coupon code is required.');
      return;
    }
    if (!couponFormData.courseId) {
      toastError('Validation', 'Please select a course for this coupon.');
      return;
    }

    try {
      setIsSubmittingCoupon(true);
      await couponApi.createCoupon(couponFormData);
      success('Coupon Created', `Coupon "${couponFormData.code.toUpperCase()}" created!`);
      setIsCouponModalOpen(false);
      setCouponFormData({
        code: '',
        courseId: '',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        minimumAmount: 0,
        usageLimit: 100,
        perUserLimit: 1,
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'ACTIVE',
        description: '',
      });
      setSelectedInstructorId('');
      fetchCoupons();
    } catch (err: any) {
      toastError('Failed', err.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setIsSubmittingCoupon(false);
    }
  };

  const uniqueInstructors = Array.from(
    new Map(
      courses
        .filter((c) => c.instructor && c.instructor.id)
        .map((c) => [c.instructor!.id, { id: c.instructor!.id, name: c.instructor!.name, email: c.instructor!.email }])
    ).values()
  );

  const filteredCoursesForCoupon = selectedInstructorId
    ? courses.filter((c) => c.instructor?.id === selectedInstructorId)
    : courses;

  return (
    <div className="space-y-5">
      {/* ========================================================
          1. SLEEK, COMPACT EDUCATIONAL SUMMARY BANNER
         ======================================================== */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
              Promotions & Pricing Studio
            </h2>
            <p className="text-[11px] text-slate-500">
              Offer course discounts on student cards or generate checkout coupon vouchers.
            </p>
          </div>
        </div>

        {/* 2 Neat Explanatory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
          {/* Card 1: Course Discount */}
          <div className="p-3 rounded-xl bg-orange-50/70 border border-orange-100 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#FA5A36]">
              <Store className="w-3.5 h-3.5 shrink-0" />
              <span>Course Discount (Storefront Sale)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Public sale price shown directly on course cards (<del className="text-slate-400">₹4,999</del> <strong className="text-emerald-700">₹3,999 [20% OFF]</strong>). Students get it automatically without entering codes. Can be adjusted or set with an expiry date anytime.
            </p>
          </div>

          {/* Card 2: Coupon Voucher */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span>Coupon Code (Checkout Promo)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Private promotional code (e.g. <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-1 py-0.2 rounded">SAVE20</span>) that students manually enter in the payment promo box. Great for partnerships, college campaigns, and redemptions with limits.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          2. CLEAN TABS: DISCOUNTS vs. COUPONS
         ======================================================== */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('discounts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'discounts'
                ? 'bg-[#FA5A36] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Course Discounts</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'discounts' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {courseDiscounts.filter((c) => c.isDiscountActive).length} Active
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'coupons'
                ? 'bg-[#FA5A36] text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Coupon Vouchers</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'coupons' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}>
              {coupons.length}
            </span>
          </button>
        </div>

        {activeTab === 'coupons' && (
          <button
            type="button"
            onClick={() => setIsCouponModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Coupon</span>
          </button>
        )}
      </div>

      {/* ========================================================
          3. TAB 1: COURSE DISCOUNTS
         ======================================================== */}
      {activeTab === 'discounts' && (
        <div className="space-y-3.5">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={discountSearch}
                onChange={(e) => setDiscountSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#FA5A36]"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {(['ALL', 'ACTIVE', 'EXPIRED', 'NONE'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  onClick={() => setDiscountStatusFilter(filterKey)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    discountStatusFilter === filterKey
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filterKey === 'ALL' && 'All Courses'}
                  {filterKey === 'ACTIVE' && 'On Sale (% OFF)'}
                  {filterKey === 'EXPIRED' && 'Sale Expired'}
                  {filterKey === 'NONE' && 'Regular Price'}
                </button>
              ))}
            </div>
          </div>

          {/* Courses Discount Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {loadingDiscounts && courseDiscounts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#FA5A36] mx-auto" />
                <p className="text-xs font-medium text-slate-500">Loading courses...</p>
              </div>
            ) : filteredDiscounts.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Percent className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-xs font-bold text-slate-700">No Courses in Filter</h3>
                <p className="text-[11px] text-slate-400">Select "All Courses" to view all published and draft courses.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Course Info</th>
                      {role === 'SUPER_ADMIN' && <th className="py-3 px-4">Instructor</th>}
                      <th className="py-3 px-4">Base Price</th>
                      <th className="py-3 px-4">Discount %</th>
                      <th className="py-3 px-4">Selling Price</th>
                      <th className="py-3 px-4">Offer Ends</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDiscounts.map((course) => {
                      const hasActiveSale = course.isDiscountActive;
                      const savings = Math.max(0, course.coursePrice - course.discountPrice);

                      return (
                        <tr key={course._id} className="hover:bg-slate-50/60 transition">
                          {/* Course Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=100&q=80'}
                                alt=""
                                className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0 max-w-[200px] sm:max-w-[260px]">
                                <h4 className="font-bold text-slate-900 truncate" title={course.title}>
                                  {course.title}
                                </h4>
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                                  {course.category || 'General'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Instructor (SuperAdmin) */}
                          {role === 'SUPER_ADMIN' && (
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-700">
                                {course.instructor?.name || 'Platform'}
                              </span>
                            </td>
                          )}

                          {/* Base Price */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">
                              ₹{course.coursePrice.toLocaleString('en-IN')}
                            </span>
                          </td>

                          {/* Discount % with quick stepper */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {hasActiveSale ? (
                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-extrabold rounded-md text-[11px]">
                                  {course.discountPercent}% OFF
                                </span>
                              ) : course.isExpired ? (
                                <span className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-md text-[10px]">
                                  Expired
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">None</span>
                              )}

                              {/* Stepper buttons */}
                              <div className="flex items-center gap-0.5 ml-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(course, -5)}
                                  title="Decrease discount by 5%"
                                  disabled={course.discountPercent <= 0}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  -
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdjust(course, 5)}
                                  title="Increase discount by 5%"
                                  disabled={course.discountPercent >= 90}
                                  className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 disabled:opacity-30 flex items-center justify-center font-bold text-xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Effective Price */}
                          <td className="py-3 px-4">
                            {hasActiveSale ? (
                              <div>
                                <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                                  ₹{course.discountPrice.toLocaleString('en-IN')}
                                </span>
                                <span className="block text-[10px] text-emerald-600 font-bold">
                                  Save ₹{savings.toLocaleString('en-IN')}
                                </span>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-900">
                                ₹{course.coursePrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* Offer Ends */}
                          <td className="py-3 px-4">
                            {hasActiveSale && course.discountValidUntil ? (
                              <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                {new Date(course.discountValidUntil).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            ) : hasActiveSale ? (
                              <span className="text-[11px] text-slate-400">Always Active</span>
                            ) : (
                              <span className="text-[11px] text-slate-400">—</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openDiscountModal(course)}
                              className="px-2.5 py-1 bg-[#FFF5F2] hover:bg-[#FFE5DF] text-[#FA5A36] font-bold rounded-lg text-xs transition border border-[#FFCCC2] cursor-pointer"
                            >
                              {hasActiveSale ? 'Edit Discount' : 'Apply Discount'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          4. TAB 2: COUPONS VIEW
         ======================================================== */}
      {activeTab === 'coupons' && (
        <div className="space-y-3.5">
          {/* Coupons Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
            {loadingCoupons ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#FA5A36] mx-auto" />
                <p className="text-xs font-semibold text-slate-500">Loading coupons...</p>
              </div>
            ) : coupons.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Tag className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-xs font-bold text-slate-700">No Promotional Coupons Yet</h3>
                <p className="text-[11px] text-slate-400">Click "Create Coupon" to create promo codes for checkout.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Coupon Code</th>
                      <th className="py-3 px-4">Course</th>
                      <th className="py-3 px-4">Discount</th>
                      <th className="py-3 px-4">Redemptions</th>
                      <th className="py-3 px-4">Expiry</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {coupons.map((coupon) => {
                      const isCopied = copiedCode === coupon.code;
                      return (
                        <tr key={coupon._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => handleCopy(coupon.code)}
                                className="text-slate-400 hover:text-slate-600 transition p-1"
                                title="Copy Coupon Code"
                              >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="max-w-[180px] truncate font-medium text-slate-900">
                              {coupon.courseId?.title || 'Course'}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">
                              {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {new Date(coupon.expiryDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleToggleStatus(coupon)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                                coupon.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {coupon.status}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                              className="text-slate-400 hover:text-red-600 transition p-1 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          5. MODAL: EDIT COURSE DISCOUNT
         ======================================================== */}
      {editingDiscountCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                  <Percent className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Manage Course Discount</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                    {editingDiscountCourse.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingDiscountCourse(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Percentage selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Discount Percentage</span>
                <span className="text-sm font-extrabold text-[#FA5A36]">{modalDiscountPercent}% OFF</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalDiscountPercent((p) => Math.max(0, p - 5))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={modalDiscountPercent}
                  onChange={(e) => setModalDiscountPercent(Number(e.target.value))}
                  className="flex-1 accent-[#FA5A36] cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setModalDiscountPercent((p) => Math.min(90, p + 5))}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {[10, 20, 30, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setModalDiscountPercent(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      modalDiscountPercent === preset
                        ? 'bg-[#FA5A36] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset}% OFF
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setModalDiscountPercent(0)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                >
                  Remove (0%)
                </button>
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Offer Expiry Date</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={modalExpiryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setModalExpiryDate(e.target.value)}
                  className="flex-1 p-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#FA5A36]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 7);
                    setModalExpiryDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  +7d
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 30);
                    setModalExpiryDate(d.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  +30d
                </button>
              </div>
            </div>

            {/* Product Card Live Preview */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Storefront Preview
              </span>
              {(() => {
                const base = editingDiscountCourse.coursePrice || 0;
                const calc = Math.max(0, Math.round(base * (1 - modalDiscountPercent / 100)));
                const savings = base - calc;

                return (
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    {modalDiscountPercent > 0 ? (
                      <>
                        <span className="text-xl font-black text-slate-900">
                          ₹{calc.toLocaleString('en-IN')}
                        </span>
                        <del className="text-xs font-semibold text-slate-400">
                          ₹{base.toLocaleString('en-IN')}
                        </del>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                          {modalDiscountPercent}% OFF
                        </span>
                        <span className="text-xs font-bold text-emerald-600 ml-auto">
                          Save ₹{savings.toLocaleString('en-IN')}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-black text-slate-900">
                        ₹{base.toLocaleString('en-IN')} (Normal Price)
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingDiscountCourse(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDiscount}
                onClick={() => handleSaveDiscount()}
                className="px-5 py-2 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                {submittingDiscount ? 'Saving...' : 'Save & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          6. MODAL: CREATE NEW COUPON
         ======================================================== */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Create Coupon Code</h3>
                  <p className="text-[11px] text-slate-500">Generate a voucher code for checkout.</p>
                </div>
              </div>
              <button onClick={() => setIsCouponModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coupon Code * (8 characters)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={8}
                    required
                    value={couponFormData.code}
                    onChange={(e) => setCouponFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. FLASH26"
                    className="flex-1 p-2 font-mono uppercase tracking-wider rounded-xl border border-slate-200 font-bold focus:outline-none focus:border-[#FA5A36]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                      let gen = '';
                      for (let i = 0; i < 8; i++) gen += chars.charAt(Math.floor(Math.random() * chars.length));
                      setCouponFormData((prev) => ({ ...prev, code: gen }));
                    }}
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700 cursor-pointer"
                  >
                    Random
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Course *</label>
                <select
                  required
                  value={couponFormData.courseId}
                  onChange={(e) => setCouponFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36]"
                >
                  <option value="">Select a Course...</option>
                  {(courses.length > 0 ? courses : courseDiscounts).map((c: any) => (
                    <option key={c._id} value={c._id}>
                      {c.title} (₹{c.coursePrice})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={couponFormData.discountValue}
                    onChange={(e) => setCouponFormData((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36]"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={couponFormData.usageLimit}
                    onChange={(e) => setCouponFormData((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={couponFormData.expiryDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCouponFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full p-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCoupon}
                  className="px-5 py-2 bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {isSubmittingCoupon ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
