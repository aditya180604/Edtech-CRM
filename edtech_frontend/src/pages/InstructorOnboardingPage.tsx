import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { instructorApi } from '../api/instructor';
import {
  Sparkles,
  User,
  Mail,
  FileText,
  Briefcase,
  Clock,
  Building,
  Image,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
} from 'lucide-react';

const SUGGESTED_EXPERTISE = [
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'DevOps & Docker',
  'Cloud Architecture',
  'Data Science',
  'Machine Learning',
  'System Design',
  'Mobile App Dev',
  'UI/UX Design',
  'Cybersecurity',
  'Java / Spring Boot',
  'Go (Golang)',
];

export const InstructorOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [expertise, setExpertise] = useState<string[]>(['React', 'Node.js']);
  const [customExpertiseInput, setCustomExpertiseInput] = useState('');
  const [currentOrganization, setCurrentOrganization] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (name) setFullName(name);
      if (user.email) setEmail(user.email);
      if (user.profilePhoto) setProfilePhoto(user.profilePhoto);
    }
  }, [user]);

  const toggleExpertise = (tag: string) => {
    if (expertise.includes(tag)) {
      setExpertise(expertise.filter((item) => item !== tag));
    } else {
      setExpertise([...expertise, tag]);
    }
  };

  const handleAddCustomExpertise = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    const tag = customExpertiseInput.trim();
    if (tag && !expertise.includes(tag)) {
      setExpertise([...expertise, tag]);
      setCustomExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (tag: string) => {
    setExpertise(expertise.filter((item) => item !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }
    if (!bio.trim() || bio.trim().length < 20) {
      setErrorMsg('Please provide a bio of at least 20 characters describing your background.');
      return;
    }
    if (expertise.length === 0) {
      setErrorMsg('Please select or add at least one area of expertise / programming language.');
      return;
    }
    if (!workExperience.trim()) {
      setErrorMsg('Work experience / job title is required (e.g., Senior Software Engineer).');
      return;
    }
    if (yearsOfExperience < 0) {
      setErrorMsg('Please enter a valid number of years of experience.');
      return;
    }

    try {
      setLoading(true);
      const res = await instructorApi.completeOnboarding({
        fullName: fullName.trim(),
        bio: bio.trim(),
        expertise,
        currentOrganization: currentOrganization.trim() || undefined,
        workExperience: workExperience.trim(),
        yearsOfExperience: Number(yearsOfExperience),
        profilePhoto: profilePhoto.trim() || undefined,
      });

      if (res.success) {
        // Update user state in auth context
        updateUser({
          isProfileCompleted: true,
          firstName: fullName.trim().split(' ')[0],
          lastName: fullName.trim().split(' ').slice(1).join(' '),
          profilePhoto: profilePhoto.trim() || user?.profilePhoto,
        });

        // Trigger welcome toast
        toast.success('Profile completed successfully!', 'Welcome to your Instructor Dashboard.');

        // Navigate to instructor dashboard
        navigate('/dashboard/instructor');
      } else {
        setErrorMsg(res.message || 'Failed to save instructor profile.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error completing onboarding.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                Step 1 of 1 • Profile Setup
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Complete Your Instructor Profile
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Welcome to the instructor community! Please complete your credentials and expertise details to setup your teaching workspace and unlock course creation.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-100">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold">Required Information Missing</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Row 1: Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    disabled
                    value={email}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-100 text-sm text-slate-500 rounded-xl border border-slate-200 cursor-not-allowed font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Bio Data / Summary */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bio Data / Professional Summary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  required
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your future students about your teaching philosophy, industry journey, and technical passions..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-normal leading-relaxed"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Minimum 20 characters recommended.</p>
            </div>

            {/* Row 3: Expertise (Languages & Tech Fields) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Technical Expertise & Languages <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-2.5">
                Select your core domains or add custom languages/technologies you specialize in.
              </p>

              {/* Selected tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {expertise.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs animate-in fade-in"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(tag)}
                      className="hover:bg-indigo-200/50 p-0.5 rounded-md transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add custom tag */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customExpertiseInput}
                  onChange={(e) => setCustomExpertiseInput(e.target.value)}
                  onKeyDown={handleAddCustomExpertise}
                  placeholder="Add custom skill (e.g. Kubernetes, Rust, GraphQL)..."
                  className="flex-1 px-4 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCustomExpertise}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Suggested quick pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTED_EXPERTISE.map((tag) => {
                  const isSelected = expertise.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleExpertise(tag)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 4: Work Experience & Years */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Work Experience / Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={workExperience}
                    onChange={(e) => setWorkExperience(e.target.value)}
                    placeholder="e.g. Principal Cloud Engineer"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Total Experience (Years) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    required
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Row 5: Current Organization & Profile Photo URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Current Organization <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={currentOrganization}
                    onChange={(e) => setCurrentOrganization(e.target.value)}
                    placeholder="e.g. Google / Microsoft / Freelance"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Profile Photo URL <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Image className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Encrypted & saved directly to your instructor profile</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Complete & Go to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
