import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Key,
  CheckCircle2,
  Lock,
  Save,
  Building,
  Mail,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../../../api/admin';
import type { AdminProfileData } from '../../../api/admin';

interface AdminSettingsTabProps {
  onNotify?: (message: string, type: 'success' | 'error') => void;
  currentUser: any;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({ onNotify, currentUser }) => {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const res = await adminApi.getProfile();
        if (res.success) {
          setProfile(res.data);
          setFirstName(res.data.firstName || '');
          setLastName(res.data.lastName || '');
          setPhone(res.data.phone || '');
        }
      } catch (err: any) {
        console.error('Failed to load admin profile:', err);
        onNotify?.('Failed to load profile details', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [onNotify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await adminApi.updateProfile({
        firstName,
        lastName,
        phone,
      });

      if (res.success) {
        onNotify?.('Profile details updated successfully', 'success');
        setProfile(res.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      onNotify?.(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA5A36] mb-2" />
        <span>Loading operational profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#FA5A36]" />
          <h2 className="text-lg font-bold text-slate-900">Operational Profile & Security</h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Personal contact details, assigned department, and granular operational permissions.
        </p>
      </div>

      {/* Account Info & Permissions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#FA5A36] to-amber-500 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 mb-4">
            {profile?.firstName?.[0] || 'A'}
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {profile?.firstName} {profile?.lastName}
          </h3>
          <p className="text-xs text-slate-500">{profile?.email}</p>

          <div className="mt-4 w-full space-y-2 pt-4 border-t border-slate-100 text-xs text-left">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">System Role</span>
              <span className="font-semibold text-slate-800">{profile?.role}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Department</span>
              <span className="font-semibold text-[#FA5A36]">{profile?.department || 'Operations'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Created On</span>
              <span className="font-medium text-slate-600">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-[#FA5A36]" />
            <span>Contact Information</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FA5A36] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FA5A36] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Direct Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FA5A36] focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#FA5A36] hover:bg-[#e04825] text-white rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm shadow-[#FA5A36]/30"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Permissions Matrix Inspection */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-900">Assigned Operational Permissions</h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Granular permission entitlements governed by the Super Admin according to principle of least privilege.
        </p>

        {profile?.adminPermissions && profile.adminPermissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.adminPermissions.map((perm) => (
              <span
                key={perm}
                className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[11px] font-semibold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                <span>{perm}</span>
              </span>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
            No special administrative scopes assigned. Please contact the Super Admin for additional role permissions.
          </div>
        )}
      </div>
    </div>
  );
};
