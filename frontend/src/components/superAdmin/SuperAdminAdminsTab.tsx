import React, { useState, useEffect } from 'react';
import {
  Shield,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Key,
  Lock,
  RefreshCw,
  Mail,
  Building,
  Calendar,
  X,
  AlertCircle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { superAdminApi } from '../../api/superAdmin';
import { useToast } from '../../context/ToastContext';

const DEPARTMENT_OPTIONS = [
  'Operations',
  'Curriculum & Academics',
  'Finance & Billing',
  'Learner Support',
  'Quality & Compliance',
  'Marketing & Growth',
  'Other',
];

const AVAILABLE_PERMISSIONS = [
  { key: 'VIEW_STUDENTS', label: 'View Students', description: 'Browse and inspect registered student profiles' },
  { key: 'MANAGE_STUDENTS', label: 'Manage Students', description: 'Suspend or reactivate student accounts' },
  { key: 'VIEW_INSTRUCTORS', label: 'View Instructors', description: 'Browse instructor directory and metrics' },
  { key: 'MANAGE_INSTRUCTORS', label: 'Manage Instructors', description: 'Suspend or reactivate instructor accounts' },
  { key: 'VIEW_COURSES', label: 'View Courses', description: 'Browse catalog and course curriculum' },
  { key: 'MANAGE_COURSES', label: 'Manage Courses', description: 'Publish, unpublish, or edit course status' },
  { key: 'VIEW_PAYMENTS', label: 'View Payments', description: 'Inspect verified orders and Cashfree transactions' },
  { key: 'VIEW_CONSULTATIONS', label: 'View Consultations', description: 'Inspect 1-on-1 mentorship bookings' },
  { key: 'VIEW_SUPPORT', label: 'View Support Tickets', description: 'Inspect incoming helpdesk and user issues' },
  { key: 'MANAGE_SUPPORT', label: 'Manage Support Tickets', description: 'Update ticket priority and reply to inquiries' },
  { key: 'VIEW_REPORTS', label: 'View Reports', description: 'Inspect operational sales and user analytics' },
  { key: 'VIEW_NOTIFICATIONS', label: 'View Notifications', description: 'Inspect delivery logs and alert history' },
  { key: 'MANAGE_SETTINGS', label: 'Manage Settings', description: 'Configure Admin account preferences' },
];

export const SuperAdminAdminsTab: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: 'Operations',
    permissions: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [departmentChoice, setDepartmentChoice] = useState('Operations');
  const [customDepartment, setCustomDepartment] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit Permissions Modal State
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Status Change State
  const [statusTarget, setStatusTarget] = useState<any | null>(null);
  const [statusReason, setStatusReason] = useState('Administrative operational review');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, [search, statusFilter]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await superAdminApi.getAdmins({
        search: search.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      if (res.success && res.data) {
        setAdmins(res.data.admins || []);
      }
    } catch (err: any) {
      toastError('Failed to load Admins', err.message || 'Could not fetch admin accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.firstName || !createForm.email || !createForm.password) {
      toastError('Validation Error', 'First name, email, and password are required.');
      return;
    }

    try {
      setCreating(true);
      const finalDepartment =
        departmentChoice === 'Other'
          ? (customDepartment.trim() || 'Operations')
          : departmentChoice;

      const res = await superAdminApi.createAdmin({
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        password: createForm.password,
        department: finalDepartment,
        permissions: createForm.permissions,
      });

      if (res.success) {
        success('Admin Created', `Admin account for ${createForm.email} successfully created.`);
        setShowCreateModal(false);
        setCreateForm({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          department: 'Operations',
          permissions: [],
        });
        setShowPassword(false);
        setDepartmentChoice('Operations');
        setCustomDepartment('');
        fetchAdmins();
      }
    } catch (err: any) {
      toastError('Creation Failed', err.response?.data?.message || err.message || 'Could not create Admin account.');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditPermissions = (admin: any) => {
    setEditingAdmin(admin);
    setSelectedPermissions(admin.permissions || []);
  };

  const handleSavePermissions = async () => {
    if (!editingAdmin) return;
    try {
      setSavingPermissions(true);
      const res = await superAdminApi.updateAdminPermissions(editingAdmin.id, selectedPermissions);
      if (res.success) {
        success('Permissions Updated', `Permissions for ${editingAdmin.name} updated successfully.`);
        setEditingAdmin(null);
        fetchAdmins();
      }
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.message || err.message || 'Could not update permissions.');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!statusTarget) return;
    const newStatus = statusTarget.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      setUpdatingStatus(true);
      const res = await superAdminApi.updateAdminStatus(statusTarget.id, newStatus, statusReason);
      if (res.success) {
        success('Status Changed', `Admin account status changed to ${newStatus}. Active sessions invalidated if deactivated.`);
        setStatusTarget(null);
        fetchAdmins();
      }
    } catch (err: any) {
      toastError('Action Failed', err.response?.data?.message || err.message || 'Failed to update admin status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const togglePermissionCheckbox = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const toggleCreatePermission = (permKey: string) => {
    setCreateForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-semibold mb-1">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Operational Roles & Access Control</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Accounts & Permissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision, manage, and assign least-privilege permissions to platform administrators.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-[#FA5A36] hover:bg-[#E04825] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision New Admin</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#FA5A36]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FA5A36] cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>

          <button
            onClick={fetchAdmins}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Admin Name & Email</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Permissions Assigned</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FA5A36]" />
                    <span>Loading administrator accounts...</span>
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">No administrator accounts found</p>
                    <p className="text-[11px] text-slate-400 mt-1">Use "Provision New Admin" above to create an operator account.</p>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] font-bold text-xs flex items-center justify-center shrink-0">
                          {admin.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{admin.name}</p>
                          <p className="text-[11px] text-slate-500">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {admin.department || 'Operations'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                        {admin.permissions?.length > 0 ? (
                          <>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              {admin.permissions.length} Granted
                            </span>
                            <span className="text-[10px] text-slate-400 truncate">
                              ({admin.permissions.slice(0, 2).join(', ')}
                              {admin.permissions.length > 2 ? '...' : ''})
                            </span>
                          </>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold">
                            None (Least-Privilege)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          admin.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {admin.status === 'ACTIVE' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        {admin.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(admin.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditPermissions(admin)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition cursor-pointer flex items-center gap-1"
                          title="Configure Permissions"
                        >
                          <Key className="w-3 h-3 text-slate-500" />
                          <span>Permissions</span>
                        </button>

                        <button
                          onClick={() => {
                            setStatusTarget(admin);
                            setStatusReason('Administrative access review');
                          }}
                          className={`px-2.5 py-1 font-bold rounded-lg text-[11px] transition cursor-pointer ${
                            admin.status === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {admin.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================== MODAL: PROVISION NEW ADMIN ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Provision New Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FA5A36]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FA5A36]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@edutech.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FA5A36]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Initial Password *</label>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Minimum 8 characters"
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="w-full p-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FA5A36]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show temporary password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department</label>
                  <select
                    value={departmentChoice}
                    onChange={(e) => setDepartmentChoice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:outline-none focus:border-[#FA5A36] cursor-pointer"
                  >
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Custom Department / Admin Role Title when 'Other' is selected */}
              {departmentChoice === 'Other' && (
                <div className="p-3 bg-orange-50/60 rounded-2xl border border-orange-200/80 space-y-1 animate-in fade-in slide-in-from-top-1">
                  <label className="block font-bold text-slate-800 text-[11px]">
                    Specify Custom Department / Admin Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Content Quality Lead, Operations Specialist, CRM Manager..."
                    value={customDepartment}
                    onChange={(e) => setCustomDepartment(e.target.value)}
                    className="w-full p-2.5 bg-white border border-orange-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-[#FA5A36]"
                  />
                  <p className="text-[10px] text-slate-500">
                    This custom department/role title will be attached to the new Administrator's profile and credentials.
                  </p>
                </div>
              )}

              {/* Initial Permissions Assignment (Least-Privilege) */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-800">Assign Initial Permissions</label>
                  <span className="text-[11px] text-slate-400">Least-privilege default</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((p) => {
                    const isChecked = createForm.permissions.includes(p.key);
                    return (
                      <div
                        key={p.key}
                        onClick={() => toggleCreatePermission(p.key)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/70'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[11px] leading-tight">{p.label}</p>
                          <p className="text-[10px] text-slate-500 leading-tight">{p.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#FA5A36] hover:bg-[#E04825] text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{creating ? 'Creating Account...' : 'Create Admin'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT PERMISSIONS MATRIX ==================== */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Operational Permissions</h3>
                <p className="text-xs text-slate-500">
                  Configuring permissions for <strong className="text-slate-800">{editingAdmin.name}</strong> ({editingAdmin.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {AVAILABLE_PERMISSIONS.map((p) => {
                const isChecked = selectedPermissions.includes(p.key);
                return (
                  <div
                    key={p.key}
                    onClick={() => togglePermissionCheckbox(p.key)}
                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight">{p.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{p.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">
                {selectedPermissions.length} of {AVAILABLE_PERMISSIONS.length} permissions granted
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingPermissions}
                  onClick={handleSavePermissions}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {savingPermissions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{savingPermissions ? 'Saving...' : 'Save Permissions'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: STATUS CHANGE CONFIRMATION ==================== */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <AlertCircle
                className={`w-5 h-5 ${statusTarget.status === 'ACTIVE' ? 'text-rose-500' : 'text-emerald-500'}`}
              />
              <h3 className="font-bold text-slate-900 text-sm">
                {statusTarget.status === 'ACTIVE' ? 'Deactivate Administrator' : 'Reactivate Administrator'}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {statusTarget.status === 'ACTIVE'
                ? `Are you sure you want to deactivate ${statusTarget.name}? Their active sessions and refresh tokens will be immediately invalidated.`
                : `Are you sure you want to reactivate ${statusTarget.name}? They will be able to log in with their assigned permissions.`}
            </p>

            <div>
              <label className="block font-bold text-slate-700 text-xs mb-1">Reason for Audit Log</label>
              <input
                type="text"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-none focus:border-[#FA5A36]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStatusTarget(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleToggleStatus}
                className={`px-5 py-2 font-bold rounded-xl text-xs text-white transition cursor-pointer shadow-xs disabled:opacity-60 ${
                  statusTarget.status === 'ACTIVE' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {updatingStatus
                  ? 'Updating...'
                  : statusTarget.status === 'ACTIVE'
                  ? 'Confirm Deactivation'
                  : 'Confirm Reactivation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
