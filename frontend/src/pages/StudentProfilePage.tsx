import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { getStudentDashboard } from '../api/studentDashboard';
import { normalizeImageUrl } from '../utils/imageUrl';
import {
  ArrowLeft,
  UserCheck,
  Save,
  Loader2,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Globe,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [headline, setHeadline] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [country, setCountry] = useState<string>('India');
  const [state, setState] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English');
  const [learningPreferences, setLearningPreferences] = useState<string>('Visual / Project-Based');
  const [qualification, setQualification] = useState<string>('');
  const [institution, setInstitution] = useState<string>('');
  const [graduationYear, setGraduationYear] = useState<number | ''>('');
  const [skillsInput, setSkillsInput] = useState<string>('');
  const [interestsInput, setInterestsInput] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);
        const data = await getStudentDashboard();
        if (data?.profile) {
          const p = data.profile;
          setFirstName(p.firstName || user?.firstName || '');
          setLastName(p.lastName || user?.lastName || '');
          setHeadline(p.headline || user?.headline || '');
          setPhone(p.phone || user?.phone || '');
          setProfilePhoto(p.profilePhoto || user?.profilePhoto || '');
          setCountry(p.country || user?.country || 'India');
          setState(p.state || user?.state || '');
          setCity(p.city || user?.city || '');
          setTimezone(p.timezone || 'Asia/Kolkata');
          setPreferredLanguage(p.preferredLanguage || 'English');
          setLearningPreferences(p.learningPreferences || 'Visual / Project-Based');
          setQualification(p.qualification || user?.qualification || '');
          setInstitution(p.institution || user?.institution || '');
          setGraduationYear(p.graduationYear || user?.graduationYear || '');
          setSkillsInput(Array.isArray(p.skills) ? p.skills.join(', ') : '');
          setInterestsInput(Array.isArray(p.interests) ? p.interests.join(', ') : '');
          setCompletionPercentage(p.completionPercentage || 0);
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

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
        headline: headline.trim() || undefined,
        phone: phone.trim() || undefined,
        profilePhoto: profilePhoto.trim() || undefined,
        country: country.trim() || undefined,
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        timezone: timezone.trim() || undefined,
        preferredLanguage: preferredLanguage.trim() || undefined,
        learningPreferences: learningPreferences.trim() || undefined,
        qualification: qualification.trim() || undefined,
        institution: institution.trim() || undefined,
        graduationYear: graduationYear ? Number(graduationYear) : undefined,
        skills: parsedSkills,
        interests: parsedInterests,
      });

      await refreshUser();
      setSuccessMessage('Profile updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard/student');
      }, 900);
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
    <div className="min-h-screen bg-slate-50/70 text-slate-800 flex flex-col justify-between selection:bg-[#FA5A36] selection:text-white font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard/student')}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          <span className="text-xs font-semibold text-slate-400">
            Student Settings
          </span>
        </div>

        {/* Page Header Card */}
        <div className="bg-gradient-to-r from-slate-950 via-stone-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl border border-orange-500/30 shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl p-1 bg-gradient-to-tr from-[#FA5A36] via-orange-500 to-amber-500 shadow-xl shadow-[#FA5A36]/20 shrink-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={firstName || 'Student'}
                  className="w-full h-full rounded-xl object-cover bg-slate-900 border border-white/20"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-stone-950 flex items-center justify-center text-[#FFCCC2] font-bold text-2xl uppercase">
                  {firstName ? firstName.charAt(0) : <GraduationCap className="w-8 h-8" />}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {firstName ? `${firstName} ${lastName}`.trim() : 'Your Student Profile'}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Manage your credentials, academic details, and course personalization signals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">Completion:</span>
            <span className="text-xs font-bold text-emerald-400">{completionPercentage}%</span>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#FA5A36] animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading student profile details...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {successMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold animate-in fade-in">
                {errorMessage}
              </div>
            )}

            {/* 1. Personal & Contact Information */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <UserCheck className="w-4 h-4 text-[#FA5A36]" />
                <h2 className="text-sm font-bold text-slate-900">Personal & Contact Info</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Manikanta"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Anandam"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Professional Headline / Target Role</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Aspiring Full Stack Developer"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* 2. Photo & Preferences */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Globe className="w-4 h-4 text-[#FA5A36]" />
                <h2 className="text-sm font-bold text-slate-900">Profile Photo & Regional Preferences</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Profile Photo URL</label>
                <input
                  type="text"
                  value={profilePhoto}
                  onChange={(e) => setProfilePhoto(e.target.value)}
                  placeholder="https://... (Google Drive, Unsplash, or direct image URL)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                />
                {previewUrl && (
                  <div className="mt-3 p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl flex items-center gap-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-orange-200 shadow-xs shrink-0"
                    />
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-[#FA5A36] block">Photo Preview Ready</span>
                      <span>This photo will appear in your dashboard header and top navigation bar.</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Bengaluru"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">State / Region</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. Karnataka"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Language</label>
                  <input
                    type="text"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    placeholder="e.g. English"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Timezone</label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    placeholder="e.g. Asia/Kolkata"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* 3. Academic & Education */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <GraduationCap className="w-4 h-4 text-[#FA5A36]" />
                <h2 className="text-sm font-bold text-slate-900">Academic & Education Information</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Degree / Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institution / University</label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="e.g. Andhra University"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Graduation Year</label>
                  <input
                    type="number"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 2025"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Learning Preferences</label>
                <input
                  type="text"
                  value={learningPreferences}
                  onChange={(e) => setLearningPreferences(e.target.value)}
                  placeholder="e.g. Visual / Project-Based"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                />
              </div>
            </div>

            {/* 4. Personalization Signals */}
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-[#FA5A36]" />
                <h2 className="text-sm font-bold text-slate-900">Personalization Signals (Recommendations)</h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Interests <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={interestsInput}
                  onChange={(e) => setInterestsInput(e.target.value)}
                  placeholder="e.g. Python, Pandas, Machine Learning, Docker"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Courses matching these topics will automatically be surfaced on your dashboard recommendation feed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. React, Node.js, JavaScript, Python"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition shadow-2xs"
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate('/dashboard/student')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-[#FA5A36] hover:bg-[#e04825] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-sm shadow-[#FA5A36]/25 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
};
