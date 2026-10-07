import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/auth';
import {
  User,
  GraduationCap,
  Briefcase,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Plus,
  X,
  Compass,
  Upload,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'JavaScript',
  'React',
  'Node.js',
  'TypeScript',
  'Python',
  'HTML / CSS',
  'MongoDB',
  'SQL & Databases',
  'Git & GitHub',
  'Docker',
  'Cloud Architecture',
  'Data Structures & Algorithms',
  'Tailwind CSS',
  'REST APIs',
  'Java',
  'C++',
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
];

export const StudentOnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { success, error } = useToast();

  // Form State - Mandatory Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(AVATAR_PRESETS[0]);
  const [headline, setHeadline] = useState('');
  const [institution, setInstitution] = useState('');
  const [qualification, setQualification] = useState('');
  const [graduationYear, setGraduationYear] = useState<number | ''>(2025);
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [skills, setSkills] = useState<string[]>(['JavaScript', 'React']);
  const [customSkill, setCustomSkill] = useState('');
  const [learningPreferences, setLearningPreferences] = useState('Hands-on Projects & Code Labs');

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Profile image size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfilePhoto(reader.result);
        setCustomAvatarUrl('');
        setValidationError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Prepopulate if user already has some fields
  useEffect(() => {
    if (user) {
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
      if (user.phone) setPhone(user.phone);
      if (user.profilePhoto) setProfilePhoto(user.profilePhoto);
      if (user.headline) setHeadline(user.headline);
      if (user.institution) setInstitution(user.institution);
      if (user.qualification) setQualification(user.qualification);
      if (user.graduationYear) setGraduationYear(user.graduationYear);
      if (user.city) setCity(user.city);
      if (user.state) setState(user.state);
      if (user.country) setCountry(user.country);
      if (user.skills && user.skills.length > 0) setSkills(user.skills);
    }
  }, [user]);

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Strict validation: ALL fields are mandatory
    if (!firstName.trim()) {
      setValidationError('First Name is required.');
      return;
    }
    if (!lastName.trim()) {
      setValidationError('Last Name is required.');
      return;
    }
    if (!phone.trim()) {
      setValidationError('Contact Phone Number is required.');
      return;
    }
    if (!headline.trim()) {
      setValidationError('Professional Headline / Career Goal is required.');
      return;
    }
    if (!institution.trim()) {
      setValidationError('School / College / University Name is required.');
      return;
    }
    if (!qualification.trim()) {
      setValidationError('Current Degree / Qualification is required.');
      return;
    }
    if (!graduationYear || Number(graduationYear) < 1980 || Number(graduationYear) > 2035) {
      setValidationError('A valid Graduation Year (e.g., 2025) is required.');
      return;
    }
    if (!city.trim()) {
      setValidationError('City is required.');
      return;
    }
    if (!state.trim()) {
      setValidationError('State / Region is required.');
      return;
    }
    if (!country.trim()) {
      setValidationError('Country is required.');
      return;
    }
    if (skills.length === 0) {
      setValidationError('Please select or add at least 1 primary skill.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        profilePhoto: profilePhoto.trim() || AVATAR_PRESETS[0],
        headline: headline.trim(),
        institution: institution.trim(),
        qualification: qualification.trim(),
        graduationYear: Number(graduationYear),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        skills,
        learningPreferences,
        isProfileCompleted: true,
      };

      await authApi.updateMe(payload);
      await refreshUser();

      success('Student details verified & saved successfully!');
      navigate('/dashboard/student');
    } catch (err: any) {
      console.error('Failed to update student profile:', err);
      const msg = err?.response?.data?.message || 'Failed to save student details. Please try again.';
      setValidationError(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Student Identity Verification
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Required for Credentials
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Complete Your Student Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            Please provide your current and accurate details. <strong className="text-slate-800 font-semibold">All fields are mandatory</strong> to verify your student identity, issue genuine course certificates, and generate your public <span className="text-indigo-600 font-bold">Verified Skill Passport</span>.
          </p>
        </div>

        {/* Validation Warning Alert */}
        {validationError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Mandatory Form Container */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal & Identity */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                1. Personal & Identity Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  First Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Aditya"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Last Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Kumar"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Phone Number <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full text-xs pl-9 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Professional Headline / Target Role <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Aspiring Full Stack Developer"
                    className="w-full text-xs pl-9 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Student Profile Avatar Upload & Presets */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Student Profile Avatar <span className="text-rose-500 font-bold">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Provide your official photo for student verification and your Verified Skill Passport.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                {/* Active Avatar Large Preview */}
                <div className="relative shrink-0">
                  <img
                    src={profilePhoto || AVATAR_PRESETS[0]}
                    alt="Current Avatar"
                    className="w-18 h-18 rounded-2xl object-cover border-2 border-indigo-600 shadow-sm ring-4 ring-indigo-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = AVATAR_PRESETS[0];
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex-1 space-y-3 w-full">
                  {/* File Upload Button */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo from Device</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">PNG, JPG or WEBP (Max 5MB)</span>
                  </div>

                  {/* Or Enter Custom Image URL */}
                  <div className="relative">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={(e) => {
                        setCustomAvatarUrl(e.target.value);
                        if (e.target.value.trim()) {
                          setProfilePhoto(e.target.value.trim());
                        }
                      }}
                      placeholder="Or paste external avatar URL (e.g. https://...)"
                      className="w-full text-xs pl-8.5 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* Or Quick Preset Selection */}
              <div>
                <span className="text-[11px] font-bold text-slate-500 block mb-2">Or select a preset avatar:</span>
                <div className="flex flex-wrap items-center gap-3">
                  {AVATAR_PRESETS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfilePhoto(url);
                        setCustomAvatarUrl('');
                      }}
                      className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition p-0.5 cursor-pointer ${
                        profilePhoto === url
                          ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={url} alt={`Avatar Preset ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Educational & Academic Information */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                2. Academic & College Information
              </h2>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                School / College / University Name <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. Indian Institute of Technology, Madras"
                  className="w-full text-xs pl-9 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Current Degree / Qualification <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. B.Tech Computer Science, BCA, MCA"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Graduation / Expected Passing Year <span className="text-rose-500 font-bold">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    required
                    min={1980}
                    max={2035}
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value ? Number(e.target.value) : '')}
                    placeholder="2025"
                    className="w-full text-xs pl-9 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Location Details */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                3. Location & Region
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  City <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Bengaluru"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  State / Region <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Country <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Technical Skills & Learning Style */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                4. Primary Skills & Learning Goals
              </h2>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Skills You Know or Want to Master <span className="text-rose-500 font-bold">* (Minimum 1 Required)</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-3">
                Click to add popular skills or type your own below. These will be verified in your Skill Passport.
              </p>

              {/* Selected Skills Chips */}
              <div className="flex flex-wrap gap-2 mb-3 min-h-[38px] p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                {skills.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">No skills selected yet. Click from suggestions below.</span>
                ) : (
                  skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="hover:text-indigo-200 transition cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Add Custom Skill */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder="Type a custom skill & press enter..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Suggested Pills */}
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_SKILLS.map((sk) => {
                  const isSelected = skills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => toggleSkill(sk)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Primary Learning Goal / Preference <span className="text-rose-500 font-bold">*</span>
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <select
                  value={learningPreferences}
                  onChange={(e) => setLearningPreferences(e.target.value)}
                  className="w-full text-xs pl-9 p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900 cursor-pointer"
                >
                  <option value="Hands-on Projects & Code Labs">Hands-on Projects & Code Labs</option>
                  <option value="Job Readiness & Career Transition">Job Readiness & Career Transition</option>
                  <option value="College Degree Supplement & Semester Exams">College Degree Supplement & Semester Exams</option>
                  <option value="Live Webinar Interactive Classroom">Live Webinar Interactive Classroom</option>
                  <option value="Fast-paced Self-Directed Learning">Fast-paced Self-Directed Learning</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="flex items-center justify-between gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/student')}
              className="px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-extrabold transition flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Verifying & Saving...' : 'Save & Verify My Student Profile'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};
