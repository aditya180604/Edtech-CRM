import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  User,
  BookOpen,
} from 'lucide-react';
import {
  couponApi,
  type Coupon,
  type CourseDropdownItem,
  type CreateCouponPayload,
} from '../../api/coupons';
import { useToast } from '../../context/ToastContext';

export const SuperAdminCouponsTab: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<CourseDropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState<CreateCouponPayload>({
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

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponApi.getCoupons({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setCoupons(res.data?.coupons || []);
    } catch (err: any) {
      console.error('Failed to load coupons:', err);
      toastError('Coupons Error', 'Failed to fetch promotional coupons.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const res = await couponApi.getCoursesDropdown();
      setCourses(res.data || []);
    } catch (err: any) {
      console.error('Failed to load courses for coupon dropdown:', err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchAvailableCourses();
  }, [search, statusFilter]);

  // Derived list of unique instructors from course list
  const uniqueInstructors = Array.from(
    new Map(
      courses
        .filter((c) => c.instructor && c.instructor.id)
        .map((c) => [c.instructor!.id, { id: c.instructor!.id, name: c.instructor!.name, email: c.instructor!.email }])
    ).values()
  );

  // Filter courses cascading by selected instructor
  const filteredCourses = selectedInstructorId
    ? courses.filter((c) => c.instructor?.id === selectedInstructorId)
    : courses;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success('Code Copied', `"${code}" copied to clipboard.`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const nextStatus = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await couponApi.updateCoupon(coupon._id, { status: nextStatus });
      success('Status Updated', `Coupon "${coupon.code}" is now ${nextStatus}.`);
      fetchCoupons();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || 'Failed to update coupon status.');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    try {
      await couponApi.deleteCoupon(id);
      success('Coupon Deleted', `Coupon "${code}" has been deleted.`);
      fetchCoupons();
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.message || 'Failed to delete coupon.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toastError('Validation', 'Coupon code is required.');
      return;
    }
    if (!formData.courseId) {
      toastError('Validation', 'Please select a course for this coupon.');
      return;
    }

    try {
      setIsSubmitting(true);
      await couponApi.createCoupon(formData);
      success('Coupon Created', `Coupon "${formData.code.toUpperCase()}" created successfully!`);
      setIsModalOpen(false);
      // Reset form
      setFormData({
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
      toastError('Creation Failed', err.response?.data?.error?.message || err.response?.data?.message || 'Failed to create coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            Promotional Coupons & Vouchers
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create instructor and course-specific discount vouchers with usage quotas and automated expiry.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-indigo-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search coupon code or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-semibold text-slate-500">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Tag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Coupons Found</h3>
            <p className="text-xs text-slate-400">Click "Create New Coupon" to generate discount vouchers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Course / Target</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Usage / Limit</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {coupons.map((coupon) => {
                  const isCopied = copiedCode === coupon.code;
                  return (
                    <tr key={coupon._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => handleCopy(coupon.code)}
                            className="p-1 hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 rounded-md transition"
                            title="Copy Code"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 truncate max-w-[200px]" title={coupon.courseId?.title}>
                          {coupon.courseId?.title || 'All Eligible Courses'}
                        </p>
                        {coupon.instructorId && (
                          <p className="text-[10px] text-slate-400">
                            By {coupon.instructorId.firstName} {coupon.instructorId.lastName}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% OFF`
                            : `₹${coupon.discountValue} OFF`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{coupon.usedCount || 0}</span>
                        <span className="text-slate-400"> / {coupon.usageLimit} uses</span>
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {new Date(coupon.startDate).toLocaleDateString()} - {new Date(coupon.expiryDate).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide border ${
                            coupon.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {coupon.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(coupon)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg transition"
                            title="Toggle Active State"
                          >
                            {coupon.status === 'ACTIVE' ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>

                          <button
                            onClick={() => handleDelete(coupon._id, coupon.code)}
                            className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-100 shadow-2xl space-y-5 animate-scaleIn my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-600" />
                  Create Promotional Coupon
                </h3>
                <p className="text-xs text-slate-500">Configure discount rules and select target course.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              {/* Step 1: Cascading Tutor Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Filter by Instructor (Optional Cascading Filter)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={selectedInstructorId}
                    onChange={(e) => {
                      setSelectedInstructorId(e.target.value);
                      setFormData((prev) => ({ ...prev, courseId: '' }));
                    }}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">All Instructors ({uniqueInstructors.length} found)</option>
                    {uniqueInstructors.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.name} ({inst.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Target Course */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Target Course *
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, courseId: e.target.value }))}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Select Course --</option>
                    {filteredCourses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title} (₹{c.coursePrice})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH50, WELCOME10"
                  value={formData.code}
                  onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discountType: e.target.value as any }))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formData.discountType === 'PERCENTAGE' ? 100 : 50000}
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData((prev) => ({ ...prev, discountValue: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Usage Limit & Per User Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Global Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.usageLimit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Per User Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.perUserLimit || 1}
                    onChange={(e) => setFormData((prev) => ({ ...prev, perUserLimit: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Start & Expiry Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Save & Activate Coupon</span>
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
