import React, { useState } from 'react';
import { X, UserCheck, Save, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';
import { normalizeImageUrl } from '../../utils/imageUrl';
import type { StudentDashboardProfile } from '../../types/studentDashboard';

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentDashboardProfile;
  onSuccess: () => void;
}

export const ProfileUpdateModal: React.FC<ProfileUpdateModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const [firstName, setFirstName] = useState<string>(profile.firstName || '');
  const [lastName, setLastName] = useState<string>(profile.lastName || '');
  const [phone, setPhone] = useState<string>(profile.phone || '');
  const [profilePhoto, setProfilePhoto] = useState<string>(profile.profilePhoto || '');
  const [country, setCountry] = useState<string>(profile.country || 'India');
  const [timezone, setTimezone] = useState<string>(profile.timezone || 'Asia/Kolkata');
  const [preferredLanguage, setPreferredLanguage] = useState<string>(profile.preferredLanguage || 'English');
  const [learningPreferences, setLearningPreferences] = useState<string>(profile.learningPreferences || 'Visual / Project-Based');
  const [qualification, setQualification] = useState<string>(profile.qualification || '');
  const [institution, setInstitution] = useState<string>(profile.institution || '');
  const [skillsInput, setSkillsInput] = useState<string>(
    Array.isArray(profile.skills) ? profile.skills.join(', ') : ''
  );
  const [interestsInput, setInterestsInput] = useState<string>(
    Array.isArray(profile.interests) ? profile.interests.join(', ') : ''
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize form states whenever modal opens or profile changes
  React.useEffect(() => {
    if (isOpen) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhone(profile.phone || '');
      setProfilePhoto(profile.profilePhoto || '');
      setCountry(profile.country || 'India');
      setTimezone(profile.timezone || 'Asia/Kolkata');
      setPreferredLanguage(profile.preferredLanguage || 'English');
      setLearningPreferences(profile.learningPreferences || 'Visual / Project-Based');
      setQualification(profile.qualification || '');
      setInstitution(profile.institution || '');
      setSkillsInput(Array.isArray(profile.skills) ? profile.skills.join(', ') : '');
      setInterestsInput(Array.isArray(profile.interests) ? profile.interests.join(', ') : '');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const previewUrl = normalizeImageUrl(profilePhoto);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedSkills = skillsInput
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    const parsedInterests = interestsInput
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean);

    try {
      await authApi.updateMe({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim() || undefined,
        profilePhoto: profilePhoto.trim() || undefined,
        country: country.trim() || undefined,
        timezone: timezone.trim() || undefined,
        preferredLanguage: preferredLanguage.trim() || undefined,
        learningPreferences: learningPreferences.trim() || undefined,
        qualification: qualification.trim() || undefined,
        institution: institution.trim() || undefined,
        skills: parsedSkills,
        interests: parsedInterests,
      });

      await refreshUser();
      setSuccessMessage('Profile updated successfully! Refreshing dashboard...');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMessage(
        err?.response?.data?.message || 'Failed to update profile. Please check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Update Student Profile</h2>
              <p className="text-xs text-slate-500">
                Complete your profile to unlock personalized course recommendations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {successMessage && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Manikanta"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Contact & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 9876543210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. India"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Language & Timezone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Preferred Language</label>
              <input
                type="text"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                placeholder="e.g. English"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Timezone</label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Education Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Degree / Qualification</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. B.Tech Computer Science"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Institution / University</label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Skills & Interests (For Personalized Recommendations) */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600">
              <Sparkles className="w-4 h-4" />
              <span>Personalization Signals</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Interests <span className="text-slate-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={interestsInput}
                onChange={(e) => setInterestsInput(e.target.value)}
                placeholder="e.g. Docker, Python, Full Stack Development, AI"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Courses matching your interests will appear in your personalized recommendation feed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g. React, Node.js, Next.js, JavaScript"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Learning Preferences</label>
              <input
                type="text"
                value={learningPreferences}
                onChange={(e) => setLearningPreferences(e.target.value)}
                placeholder="e.g. Visual / Project-Based"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo URL</label>
              <input
                type="text"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                placeholder="https://... (Google Drive, Unsplash, or direct image link)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
              {previewUrl && (
                <div className="mt-2.5 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3.5">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-200 shadow-xs shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="text-[11px] text-slate-600">
                    <span className="font-bold text-indigo-700 block">Photo Preview Ready</span>
                    <span>This photo will display on your student dashboard header and navbar.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to MongoDB...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
