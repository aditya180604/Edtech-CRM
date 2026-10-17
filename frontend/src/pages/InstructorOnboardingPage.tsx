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
  GraduationCap,
  Globe,
  Phone,
  UploadCloud,
  FileCheck,
  Shield,
  BookOpen,
  Info,
  Loader2,
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../components/ui/SocialIcons';

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

const SUGGESTED_SUBJECTS = [
  'Full-Stack Web Development',
  'Backend Engineering & APIs',
  'Frontend Architecture',
  'Cloud Computing & DevOps',
  'Data Science & Analytics',
  'Machine Learning & AI',
  'System Design & Microservices',
  'Mobile Application Development',
  'Cybersecurity & Ethical Hacking',
  'Database Engineering & SQL',
];

const GOV_ID_TYPES = [
  { value: 'PASSPORT', label: 'Passport (International)' },
  { value: 'DRIVING_LICENSE', label: "Driver's License" },
  { value: 'NATIONAL_ID', label: 'National Identity Card' },
  { value: 'VOTER_ID', label: "Voter's ID Card" },
  { value: 'OTHER_GOVT_ID', label: 'Other Government-Issued ID' },
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
  const [teachingSubjects, setTeachingSubjects] = useState<string[]>(['Full-Stack Web Development']);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Employment Details
  const [isEmployed, setIsEmployed] = useState<boolean>(true);
  const [currentOrganization, setCurrentOrganization] = useState('');
  const [currentJobTitle, setCurrentJobTitle] = useState('');
  const [workExperience, setWorkExperience] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [qualification, setQualification] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');

  // Professional URLs
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Government ID & Document Uploads
  const [governmentIdType, setGovernmentIdType] = useState('PASSPORT');
  const [governmentIdDoc, setGovernmentIdDoc] = useState<any>(null);
  const [resumeDoc, setResumeDoc] = useState<any>(null);
  const [employmentDoc, setEmploymentDoc] = useState<any>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Review Status / Feedback
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('NEW');

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await instructorApi.getProfile();
        if (res?.success && res.data?.profile) {
          const prof = res.data.profile;
          if (prof.bio) setBio(prof.bio);
          if (Array.isArray(prof.expertise) && prof.expertise.length > 0) setExpertise(prof.expertise);
          if (Array.isArray(prof.teachingSubjects) && prof.teachingSubjects.length > 0) setTeachingSubjects(prof.teachingSubjects);
          if (prof.currentOrganization) setCurrentOrganization(prof.currentOrganization);
          if (prof.currentJobTitle) setCurrentJobTitle(prof.currentJobTitle);
          if (prof.isEmployed !== undefined) setIsEmployed(prof.isEmployed);
          if (prof.workExperience) setWorkExperience(prof.workExperience);
          if (prof.yearsOfExperience !== undefined) setYearsOfExperience(Number(prof.yearsOfExperience));
          if (prof.qualification) setQualification(prof.qualification);
          if (prof.phone) setPhone(prof.phone);
          if (prof.country) setCountry(prof.country);
          if (prof.profilePhoto) setProfilePhoto(prof.profilePhoto);
          if (prof.linkedinUrl) setLinkedinUrl(prof.linkedinUrl);
          if (prof.githubUrl) setGithubUrl(prof.githubUrl);
          if (prof.portfolioUrl) setPortfolioUrl(prof.portfolioUrl);
          if (prof.governmentId && (prof.governmentId.fileName || prof.governmentId.documentUrl || prof.governmentId.diskPath)) {
            setGovernmentIdDoc(prof.governmentId);
            if (prof.governmentId.idType) setGovernmentIdType(prof.governmentId.idType);
          }
          if (Array.isArray(prof.verificationDocuments)) {
            const resume = prof.verificationDocuments.find(
              (d: any) => d.documentType === 'RESUME_CV' && (d.fileName || d.fileUrl || d.diskPath)
            );
            if (resume) setResumeDoc(resume);
            const emp = prof.verificationDocuments.find(
              (d: any) => d.documentType === 'EMPLOYMENT_PROOF' && (d.fileName || d.fileUrl || d.diskPath)
            );
            if (emp) setEmploymentDoc(emp);
          }
          if (prof.verificationStatus) setReviewStatus(prof.verificationStatus);
          if (prof.rejectionReason) setRejectionReason(prof.rejectionReason);
        }
      } catch (e) {
        // Non-blocking if profile not yet created
      } finally {
        setInitialLoading(false);
      }
    };

    if (user) {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (name) setFullName(name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.country) setCountry(user.country);
      if (user.profilePhoto) setProfilePhoto(user.profilePhoto);
      fetchExisting();
    } else {
      setInitialLoading(false);
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

  const toggleSubject = (subj: string) => {
    if (teachingSubjects.includes(subj)) {
      setTeachingSubjects(teachingSubjects.filter((s) => s !== subj));
    } else {
      setTeachingSubjects([...teachingSubjects, subj]);
    }
  };

  const handleAddCustomSubject = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') return;
    e.preventDefault();
    const subj = customSubjectInput.trim();
    if (subj && !teachingSubjects.includes(subj)) {
      setTeachingSubjects([...teachingSubjects, subj]);
      setCustomSubjectInput('');
    }
  };

  // Generic secure document upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string, title: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File Too Large', 'Maximum file size allowed is 5 MB.');
      return;
    }

    try {
      setUploadingDoc(docType);
      const res = await instructorApi.uploadDocument(file, docType, title, docType === 'GOVERNMENT_ID' ? governmentIdType : undefined);
      if (res?.success) {
        toast.success('Document Uploaded ✓', `${title} has been stored securely for verification.`);
        if (docType === 'GOVERNMENT_ID') {
          const doc = res.data?.governmentId || res.data?.document || { fileName: file.name, idType: governmentIdType, documentUrl: res.data?.document?.fileUrl };
          setGovernmentIdDoc(doc);
        } else if (docType === 'RESUME_CV') {
          const doc = res.data?.verificationDocuments?.find((d: any) => d.documentType === 'RESUME_CV') || res.data?.document || { fileName: file.name, documentType: 'RESUME_CV' };
          setResumeDoc(doc);
        } else if (docType === 'EMPLOYMENT_PROOF') {
          const doc = res.data?.verificationDocuments?.find((d: any) => d.documentType === 'EMPLOYMENT_PROOF') || res.data?.document || { fileName: file.name, documentType: 'EMPLOYMENT_PROOF' };
          setEmploymentDoc(doc);
        }
      } else {
        toast.error('Upload Failed', res?.message || 'Could not upload document.');
      }
    } catch (err: any) {
      toast.error('Upload Error', err?.response?.data?.message || err.message || 'File upload failed.');
    } finally {
      setUploadingDoc(null);
    }
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
    if (isEmployed && !workExperience.trim()) {
      setErrorMsg('Industry Experience Summary is required for employed professionals.');
      return;
    }
    if (isEmployed && !currentOrganization.trim()) {
      setErrorMsg('Please specify your current organization/employer or select Independent Practitioner.');
      return;
    }
    if (yearsOfExperience < 0) {
      setErrorMsg('Please enter a valid number of years of experience.');
      return;
    }
    if (!linkedinUrl.trim()) {
      setErrorMsg('LinkedIn Profile URL is mandatory.');
      return;
    }
    if (!githubUrl.trim()) {
      setErrorMsg('GitHub Profile is mandatory.');
      return;
    }
    if (!governmentIdDoc) {
      setErrorMsg('Government-Issued ID Proof document is mandatory. Please upload your ID proof.');
      return;
    }
    if (!resumeDoc) {
      setErrorMsg('Curriculum Vitae / Resume (PDF) is mandatory. Please upload your CV/resume.');
      return;
    }

    try {
      setLoading(true);
      const res = await instructorApi.completeOnboarding({
        fullName: fullName.trim(),
        bio: bio.trim(),
        expertise,
        currentOrganization: isEmployed ? currentOrganization.trim() : (currentOrganization.trim() || 'Independent Practitioner / Freelancer'),
        currentJobTitle: currentJobTitle.trim() || undefined,
        isEmployed,
        qualification: qualification.trim() || undefined,
        workExperience: isEmployed ? workExperience.trim() : (workExperience.trim() || 'Independent Practitioner / Consultant'),
        yearsOfExperience: Number(yearsOfExperience),
        profilePhoto: profilePhoto.trim() || undefined,
        phone: phone.trim() || undefined,
        country: country.trim() || undefined,
        linkedinUrl: linkedinUrl.trim(),
        githubUrl: githubUrl.trim(),
        portfolioUrl: portfolioUrl.trim() || undefined,
        teachingSubjects: teachingSubjects.length > 0 ? teachingSubjects : undefined,
        governmentId: governmentIdDoc
          ? {
              idType: governmentIdType,
              documentUrl: governmentIdDoc.documentUrl || '',
              fileName: governmentIdDoc.fileName,
              fileType: governmentIdDoc.fileType,
              fileSize: governmentIdDoc.fileSize,
            }
          : undefined,
        verificationDocuments: [
          ...(resumeDoc ? [resumeDoc] : []),
          ...(employmentDoc ? [employmentDoc] : []),
        ],
      });

      if (res.success) {
        updateUser({
          isProfileCompleted: true,
          firstName: fullName.trim().split(' ')[0],
          lastName: fullName.trim().split(' ').slice(1).join(' '),
          profilePhoto: profilePhoto.trim() || user?.profilePhoto,
          phone: phone.trim() || user?.phone,
          country: country.trim() || user?.country,
        });

        toast.success(
          'Profile & Documents Submitted!',
          'Your credentials have been securely saved. Proceed to verification review and activation.'
        );

        navigate('/instructor/pending-verification');
      } else {
        setErrorMsg(res.message || 'Failed to save instructor profile.');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Error completing onboarding.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FA5A36] animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading your profile details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center gap-3.5 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF5F2] border border-[#FFCCC2] flex items-center justify-center text-[#FA5A36] shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#FA5A36] bg-[#FFF5F2] px-2.5 py-1 rounded-full">
                Professional Profile & Verification
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                Complete Your Instructor Credentials
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Welcome to the instructor community! Please complete your professional background, social profiles, and verification documents. All files are encrypted and stored privately for Super Admin verification.
          </p>
        </div>

        {/* Change Request / Rejection Alert Banner (if applicable) */}
        {reviewStatus === 'CHANGES_REQUESTED' && rejectionReason && (
          <div className="mb-6 p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm flex items-start gap-3.5">
            <Info className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900">Revisions Requested by Review Team</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed whitespace-pre-wrap">
                {rejectionReason}
              </p>
              <p className="text-[11px] text-amber-700 font-semibold mt-2">
                Please update the requested details or re-upload documents below, then submit to proceed.
              </p>
            </div>
          </div>
        )}

        {reviewStatus === 'REJECTED' && rejectionReason && (
          <div className="mb-6 p-5 rounded-3xl bg-rose-50 border border-rose-200 text-rose-900 shadow-sm flex items-start gap-3.5">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-900">Previous Application Feedback</h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed whitespace-pre-wrap">
                {rejectionReason}
              </p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-100">
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold">Required Information Missing</p>
                <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* SECTION 1: Personal & Bio */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#FA5A36]" />
                <span>1. Core Personal Details</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
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

              {/* Contact Phone & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Mobile Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Required for verification updates and 1-on-1 session alerts.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Country / Region <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. India, United States"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Operational region for tax, identity compliance, and timezones.</p>
                </div>
              </div>

              {/* Profile Photo Headshot */}
              <div className="mb-5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                        Professional Profile Photo / Headshot <span className="text-red-500">*</span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Clear face photo builds student trust and boosts your readiness score by 10 points.
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 3 * 1024 * 1024) {
                            toast.error('Image Too Large', 'Maximum photo size allowed is 3 MB.');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) {
                              setProfilePhoto(reader.result as string);
                              toast.success('Photo Attached ✓', 'Profile headshot selected.');
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="sr-only"
                      />
                      <div className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition shadow-xs w-full">
                        <UploadCloud className="w-3.5 h-3.5 text-[#FA5A36]" />
                        <span>{profilePhoto ? 'Change Photo' : 'Upload Photo'}</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Or Image URL:</span>
                  <input
                    type="url"
                    value={profilePhoto}
                    onChange={(e) => setProfilePhoto(e.target.value)}
                    placeholder="https://images.unsplash.com/... or paste image link"
                    className="w-full px-3 py-1 bg-white text-xs text-slate-800 rounded-lg border border-slate-200 focus:outline-none focus:border-[#FA5A36]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Professional Bio / Teaching Philosophy <span className="text-red-500">*</span>
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
                    placeholder="Tell your students and the review board about your journey, industry expertise, and core teaching strengths..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-normal leading-relaxed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Minimum 20 characters required.</p>
              </div>
            </div>

            {/* SECTION 2: Professional Role & Employment Status */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#FA5A36]" />
                <span>2. Employment & Background</span>
              </h3>

              {/* Employment Status Selector */}
              <div className="mb-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Employment Status <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEmployed(true)}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      isEmployed
                        ? 'border-[#FA5A36] bg-[#FFF5F2] ring-2 ring-[#FA5A36]/15'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Building className={`w-5 h-5 mt-0.5 shrink-0 ${isEmployed ? 'text-[#FA5A36]' : 'text-slate-400'}`} />
                    <div>
                      <p className={`font-bold text-xs ${isEmployed ? 'text-[#FA5A36]' : 'text-slate-800'}`}>
                        Employed at Company / Organization
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        You currently hold a position at an enterprise, institution, or agency.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsEmployed(false);
                      setCurrentOrganization('Independent Practitioner / Freelancer');
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      !isEmployed
                        ? 'border-[#FA5A36] bg-[#FFF5F2] ring-2 ring-[#FA5A36]/15'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className={`w-5 h-5 mt-0.5 shrink-0 ${!isEmployed ? 'text-[#FA5A36]' : 'text-slate-400'}`} />
                    <div>
                      <p className={`font-bold text-xs ${!isEmployed ? 'text-[#FA5A36]' : 'text-slate-800'}`}>
                        Independent Practitioner / Consultant
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Freelance educator, contractor, or full-time content creator.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    {isEmployed ? 'Organization / Company Name' : 'Practice / Brand Name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={currentOrganization}
                      onChange={(e) => setCurrentOrganization(e.target.value)}
                      placeholder={isEmployed ? 'e.g. Google, Microsoft, Amazon' : 'e.g. Independent Consultant'}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Current Job Title / Designation <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={currentJobTitle}
                      onChange={(e) => setCurrentJobTitle(e.target.value)}
                      placeholder="e.g. Principal Cloud Architect"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Industry Experience Summary {isEmployed ? <span className="text-red-500">*</span> : <span className="text-slate-400 font-normal lowercase">(optional)</span>}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required={isEmployed}
                      value={workExperience}
                      onChange={(e) => setWorkExperience(e.target.value)}
                      placeholder={isEmployed ? "e.g. Senior Full-Stack Engineer with 8+ years building enterprise SaaS" : "e.g. Independent tech consultant, educator, or mentor (optional)"}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Total Years Exp <span className="text-red-500">*</span>
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
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Highest Educational Qualification <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. M.Tech in Computer Science / B.Sc Software"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Teaching & Mentorship Track <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Full-Stack / Cloud Architecture"
                      value={teachingSubjects[0] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeachingSubjects(val ? [val, ...teachingSubjects.slice(1)] : teachingSubjects.slice(1));
                      }}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-sm text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white focus:ring-2 focus:ring-[#FA5A36]/10 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Technical Expertise & Teaching Subjects */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#FA5A36]" />
                <span>3. Expertise & Teaching Subjects</span>
              </h3>

              {/* Skills / Tech Stack */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Technical Expertise & Languages <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {expertise.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] font-semibold text-xs"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => setExpertise(expertise.filter((item) => item !== tag))}
                        className="hover:bg-[#FFCCC2] p-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customExpertiseInput}
                    onChange={(e) => setCustomExpertiseInput(e.target.value)}
                    onKeyDown={handleAddCustomExpertise}
                    placeholder="Add custom skill (e.g. Kubernetes, Rust, GraphQL)..."
                    className="flex-1 px-4 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition-all"
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

                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_EXPERTISE.map((tag) => {
                    const isSelected = expertise.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleExpertise(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#FA5A36] text-white font-bold'
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

              {/* Teaching Subjects */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Target Curriculum & Teaching Subjects <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {teachingSubjects.map((subj) => (
                    <span
                      key={subj}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-xs"
                    >
                      <span>{subj}</span>
                      <button
                        type="button"
                        onClick={() => setTeachingSubjects(teachingSubjects.filter((s) => s !== subj))}
                        className="hover:bg-indigo-200 p-0.5 rounded-md transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    onKeyDown={handleAddCustomSubject}
                    placeholder="Add subject (e.g. Distributed Systems Architecture)..."
                    className="flex-1 px-4 py-2 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SUBJECTS.map((subj) => {
                    const isSelected = teachingSubjects.includes(subj);
                    return (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => toggleSubject(subj)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {subj}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 4: Professional Links */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FA5A36]" />
                <span>4. Verified Professional Profiles</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    LinkedIn Profile URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <LinkedinIcon className="w-4 h-4 text-sky-600" />
                    </div>
                    <input
                      type="url"
                      required
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    GitHub Profile <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GithubIcon className="w-4 h-4 text-slate-800" />
                    </div>
                    <input
                      type="url"
                      required
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      placeholder="https://github.com/username"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Portfolio / Website <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      placeholder="https://yourportfolio.dev"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 text-xs text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 5: Pre-Payment Document Uploads */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FA5A36]" />
                  <span>5. Pre-Payment Verification Documents</span>
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Private & Encrypted Storage
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Upload your identity proof and curriculum vitae before payment. All files are restricted exclusively to authorized Super Admin reviewers. Max 5 MB per file (PDF, JPG, PNG, WEBP).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Document 1: Government-issued ID */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#FA5A36]" />
                      <span>Government-Issued ID Proof <span className="text-red-500">*</span></span>
                    </span>
                    {governmentIdDoc ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Mandatory *
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select ID Document Type <span className="text-red-500">*</span></label>
                    <select
                      value={governmentIdType}
                      onChange={(e) => setGovernmentIdType(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-xs text-slate-800 rounded-xl border border-slate-200 font-medium focus:outline-none focus:border-[#FA5A36]"
                    >
                      {GOV_ID_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {governmentIdDoc && (
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium text-slate-800">{governmentIdDoc.fileName || `${governmentIdType}_Document`}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase shrink-0">Ready</span>
                    </div>
                  )}

                  <label className="block">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, 'GOVERNMENT_ID', 'Government Identity Proof')}
                      disabled={uploadingDoc === 'GOVERNMENT_ID'}
                      className="sr-only"
                    />
                    <div className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-dashed border-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                      {uploadingDoc === 'GOVERNMENT_ID' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA5A36]" />
                          <span>Encrypting & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                          <span>{governmentIdDoc ? 'Replace Document' : 'Upload ID Proof (PDF/Image) *'}</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Document 2: Resume / CV */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Curriculum Vitae / Resume <span className="text-red-500">*</span></span>
                    </span>
                    {resumeDoc ? (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                        Mandatory *
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Upload your latest CV highlighting technical projects, past teaching experience, or publications.
                  </p>

                  {resumeDoc && (
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium text-slate-800">{resumeDoc.fileName || 'Resume_Document'}</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase shrink-0">Ready</span>
                    </div>
                  )}

                  <label className="block pt-4">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, 'RESUME_CV', 'Curriculum Vitae')}
                      disabled={uploadingDoc === 'RESUME_CV'}
                      className="sr-only"
                    />
                    <div className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-dashed border-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                      {uploadingDoc === 'RESUME_CV' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>Uploading Resume...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                          <span>{resumeDoc ? 'Replace Resume' : 'Upload Resume / CV (PDF)'}</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Optional Document 3: Employment Proof / Experience Letter */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Optional Supporting Document (Offer Letter / Certificate / Experience Verification)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {employmentDoc?.fileName ? `Uploaded: ${employmentDoc.fileName}` : 'Helpful if applying for advanced enterprise topics.'}
                  </p>
                </div>
                <label className="shrink-0">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'EMPLOYMENT_PROOF', 'Supporting Verification Document')}
                    disabled={uploadingDoc === 'EMPLOYMENT_PROOF'}
                    className="sr-only"
                  />
                  <div className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{employmentDoc ? 'Replace Document' : 'Upload Document'}</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Pre-payment data saved. Numerical readiness score calculated upon activation.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#FA5A36] hover:bg-[#e04825] active:bg-[#c93d1d] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#FA5A36]/25 transition-all disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span>Saving Profile...</span>
                ) : (
                  <>
                    <span>Submit & Proceed to Verification Review</span>
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
