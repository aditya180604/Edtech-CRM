import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  BookOpen,
  Users,
  Check,
  Upload,
  Link2,
  ImageIcon,
  Video,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Code,
  Quote,
  Strikethrough,
  Search,
  Award,
  ShieldCheck,
  Monitor,
  Cpu,
  Tag,
  Laptop,
  Key,
  HelpCircle,
  X,
  CreditCard,
  UserCheck,
  Clock,
  Heart,
  Bookmark,
  GraduationCap,
  Star,
} from 'lucide-react';
import { superAdminApi } from '../../api/superAdmin';
import { useToast } from '../../context/ToastContext';

interface InstructorOption {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profilePhoto?: string;
  coursesCount?: number;
}

interface CreateCourseOnBehalfViewProps {
  instructors: InstructorOption[];
  onSuccess: (course: any, published: boolean) => void;
  onCancel: () => void;
}

export const CreateCourseOnBehalfView: React.FC<CreateCourseOnBehalfViewProps> = ({
  instructors,
  onSuccess,
  onCancel,
}) => {
  const { success: toastSuccess, error: toastError } = useToast();

  // Selected Instructor
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(
    instructors[0]?.id || instructors[0]?._id || ''
  );
  const [instructorSearch, setInstructorSearch] = useState('');

  // 9-Step Wizard State
  const [createStep, setCreateStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State matching full Instructor Course Schema
  const [courseFormData, setCourseFormData] = useState({
    title: '',
    shortDescription: '',
    description: '',
    thumbnail: '',
    banner: '',
    category: 'Development',
    subcategory: 'Full-Stack',
    level: 'Beginner',
    language: 'English',
    skills: ['React', 'Node.js', 'MongoDB'] as string[],
    detailedOverview: '',
    targetAudience: [
      'Aspiring Software Engineers and Web Developers',
      'Computer Science Students & Bootcamp Graduates',
      'Frontend Developers transitioning to Full-Stack',
    ] as string[],
    courseGoals: [
      'Master industry-standard enterprise architecture and clean code',
      'Deploy production-ready distributed microservices and databases',
      'Build scalable real-time full-stack applications with state management',
    ] as string[],
    teachingMethodology: 'Hands-on Projects, Practical Architecture Labs, and Real-world Case Studies',
    learningObjectives: [
      'Architect robust backend APIs with Node.js and modern databases',
      'Build fluid, responsive and accessible user interfaces with React',
      'Implement real-time features, authentication, and secure authorization',
    ] as string[],
    foundationalConcepts: [
      'Component Architecture & State Management',
      'RESTful & GraphQL API Design Patterns',
      'Relational and NoSQL Database Schema Optimization',
    ] as string[],
    recommendedPriorKnowledge: [
      'Basic knowledge of JavaScript ES6+ syntax',
      'Fundamental understanding of HTML & CSS',
    ] as string[],
    coreTools: ['VS Code', 'Git & GitHub', 'Node.js', 'Docker', 'Postman'] as string[],
    requirements: [
      'A computer (Windows, Mac, or Linux) with internet connectivity',
      'Basic computer literacy and desire to learn',
    ] as string[],
    hardwareRequirements: [
      'Minimum 8 GB RAM (16 GB Recommended)',
      'Modern Multi-core Processor (Intel i5/AMD Ryzen 5 or Apple Silicon)',
      'At least 20 GB free disk space',
    ] as string[],
    softwareRequirements: [
      'Visual Studio Code or modern code editor',
      'Node.js 18+ LTS and npm installed',
      'Google Chrome or modern browser for debugging',
    ] as string[],
    requiredAccounts: [
      'Free GitHub Account for version control',
      'Free MongoDB Atlas account (no credit card required)',
    ] as string[],
    courseIncludes: {
      videoHours: '25+ Hours of On-Demand HD Video',
      resourcesCount: '20 Downloadable Architecture Guides & Source Repos',
      projectsCount: '3 Full-Stack Production Projects',
      certificate: true,
      qaSupport: true,
      lifetimeAccess: true,
      otherBenefits: [
        'Direct instructor forum support & Q&A assistance',
        'Official certificate of completion shareable on LinkedIn',
        'Lifetime access to all future course updates & curriculum releases',
      ] as string[],
    },
    promotionalVideo: '',
    coursePrice: 1999,
    discountPrice: 1499,
    accessDuration: 'Lifetime Access',
    certificateSettings: {
      enableCertificate: true,
      certificateTitle: '',
    },
    currency: 'INR',
    syllabusUrl: '',
    syllabusFileName: '',
    // Optional Enrollment Cap & Rich Card Attributes (Image 1 Spec)
    maxEnrollmentLimit: '' as string | number,
    schedule: '',
    mentorStatus: 'Pro Mentor',
    professionalTags: ['Ex-Apple', 'Full Stack Engineer', 'MERN Developer'] as string[],
    experienceMetrics: ['18y Exp', 'Top 1% Mentor', '10x Engineer'] as string[],
    qualifications: [] as string[],
    totalSessions: '' as string | number,
    modules: [
      {
        title: 'Module 1: Foundations & Architecture Setup',
        topics: [
          {
            title: 'Welcome & Full-Stack Roadmap Overview',
            description: 'Orientation to course topics, tools, environment setup, and architectural foundations.',
            price: 0,
            isFree: true,
            duration: 20,
            videoUrl: '',
          },
          {
            title: 'Setting Up Modern Development Environment',
            description: 'Installing Node.js, Git, VS Code extensions, and initializing git workspace.',
            price: 299,
            isFree: false,
            duration: 35,
            videoUrl: '',
          },
        ],
      },
      {
        title: 'Module 2: Core Development & Database Integration',
        topics: [
          {
            title: 'Database Schema Modeling & Relationships',
            description: 'Designing production-grade schemas, indexes, and relationship constraints.',
            price: 499,
            isFree: false,
            duration: 45,
            videoUrl: '',
          },
        ],
      },
    ] as Array<{
      title: string;
      topics: Array<{
        title: string;
        description?: string;
        price: number;
        isFree: boolean;
        duration: number;
        videoUrl?: string;
        lessons?: Array<any>;
      }>;
    }>,
  });

  // Upload tab state
  const [thumbUploadTab, setThumbUploadTab] = useState<'device' | 'url'>('url');
  const [thumbUrlInput, setThumbUrlInput] = useState('');
  const [syllabusUploadTab, setSyllabusUploadTab] = useState<'device' | 'url'>('url');
  const [syllabusUrlInput, setSyllabusUrlInput] = useState('');

  // Helper inputs for dynamic tag additions
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newAudienceInput, setNewAudienceInput] = useState('');
  const [newLearningObjectiveInput, setNewLearningObjectiveInput] = useState('');
  const [newFoundationalConceptInput, setNewFoundationalConceptInput] = useState('');
  const [newPriorKnowledgeInput, setNewPriorKnowledgeInput] = useState('');
  const [newCoreToolInput, setNewCoreToolInput] = useState('');
  const [newPrerequisiteInput, setNewPrerequisiteInput] = useState('');
  const [newHardwareReqInput, setNewHardwareReqInput] = useState('');
  const [newSoftwareReqInput, setNewSoftwareReqInput] = useState('');
  const [newRequiredAccountInput, setNewRequiredAccountInput] = useState('');
  const [newOtherBenefitInput, setNewOtherBenefitInput] = useState('');
  const [newSkillTagInput, setNewSkillTagInput] = useState('');
  const [newProfessionalTagInput, setNewProfessionalTagInput] = useState('');
  const [newExperienceMetricInput, setNewExperienceMetricInput] = useState('');
  const [newQualificationInput, setNewQualificationInput] = useState('');

  // Curriculum Modals
  const [wizardModuleModal, setWizardModuleModal] = useState(false);
  const [wizardModuleTitle, setWizardModuleTitle] = useState('');
  const [wizardTopicModal, setWizardTopicModal] = useState(false);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number | null>(null);
  const [editingTopicIndex, setEditingTopicIndex] = useState<number | null>(null);
  const [wizardTopicForm, setWizardTopicForm] = useState({
    title: '',
    description: '',
    price: 0,
    isFree: false,
    duration: 30,
    videoUrl: '',
  });

  // Selected instructor object
  const selectedInstructor = instructors.find(
    (i) => (i.id || i._id) === selectedInstructorId
  ) || instructors[0];

  const instructorDisplayName = selectedInstructor
    ? selectedInstructor.name ||
      `${selectedInstructor.firstName || ''} ${selectedInstructor.lastName || ''}`.trim() ||
      selectedInstructor.email
    : 'Selected Instructor';

  // Utility to parse single, comma, semicolon or line separated inputs
  const parseMultiItems = (text: string): string[] => {
    if (!text || !text.trim()) return [];
    return text
      .split(/\r?\n|,|;/)
      .map((s) => s.replace(/^[\s\d+.\-•*–—>)\]]+/, '').trim())
      .filter((s) => s.length > 0);
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setCourseFormData((prev) => ({ ...prev, thumbnail: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplyWebUrl = () => {
    if (thumbUrlInput.trim()) {
      setCourseFormData((prev) => ({ ...prev, thumbnail: thumbUrlInput.trim() }));
      setThumbUrlInput('');
    }
  };

  const handleSyllabusFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setCourseFormData((prev) => ({
        ...prev,
        syllabusUrl: base64,
        syllabusFileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleApplySyllabusWebUrl = () => {
    if (syllabusUrlInput.trim()) {
      const fileName = syllabusUrlInput.trim().split('/').pop() || 'Syllabus.pdf';
      setCourseFormData((prev) => ({
        ...prev,
        syllabusUrl: syllabusUrlInput.trim(),
        syllabusFileName: fileName,
      }));
      setSyllabusUrlInput('');
    }
  };

  // Module & Topic helpers
  const handleWizardAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wizardModuleTitle.trim()) return;
    const cleanTitle = wizardModuleTitle.trim().replace(/^Module\s*\d+\s*:\s*/i, '');
    const moduleNumber = courseFormData.modules.length + 1;
    setCourseFormData((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          title: `Module ${moduleNumber}: ${cleanTitle}`,
          topics: [],
        },
      ],
    }));
    setWizardModuleTitle('');
    setWizardModuleModal(false);
  };

  const handleRemoveModule = (mIdx: number) => {
    setCourseFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, idx) => idx !== mIdx),
    }));
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedModuleIndex === null) return;
    if (!wizardTopicForm.title.trim()) {
      toastError('Title Required', 'Please enter a title for this topic.');
      return;
    }
    if (!wizardTopicForm.description.trim()) {
      toastError('Description Required', 'Please provide a brief topic summary.');
      return;
    }

    setCourseFormData((prev) => {
      const updatedModules = [...prev.modules];
      const targetModule = { ...updatedModules[selectedModuleIndex] };
      const targetTopics = [...targetModule.topics];

      const topicPayload = {
        title: wizardTopicForm.title.trim(),
        description: wizardTopicForm.description.trim(),
        price: Number(wizardTopicForm.price) || 0,
        isFree: !!wizardTopicForm.isFree,
        duration: Number(wizardTopicForm.duration) || 30,
        videoUrl: wizardTopicForm.videoUrl.trim(),
      };

      if (editingTopicIndex !== null) {
        targetTopics[editingTopicIndex] = topicPayload;
      } else {
        targetTopics.push(topicPayload);
      }

      targetModule.topics = targetTopics;
      updatedModules[selectedModuleIndex] = targetModule;
      return { ...prev, modules: updatedModules };
    });

    setWizardTopicModal(false);
    setSelectedModuleIndex(null);
    setEditingTopicIndex(null);
  };

  const handleRemoveTopic = (mIdx: number, tIdx: number) => {
    setCourseFormData((prev) => {
      const updatedModules = [...prev.modules];
      updatedModules[mIdx].topics = updatedModules[mIdx].topics.filter((_, idx) => idx !== tIdx);
      return { ...prev, modules: updatedModules };
    });
  };

  // Submission handler with 100% Payment Exemption
  const handleSubmitCourse = async (publishDirectly: boolean) => {
    if (!selectedInstructorId) {
      toastError('Target Instructor Required', 'Please select an instructor from the dropdown.');
      return;
    }
    if (!courseFormData.title.trim()) {
      toastError('Title Required', 'Please provide a course title in Step 1.');
      setCreateStep(1);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...courseFormData,
        instructorId: selectedInstructorId,
        publishDirectly,
      };

      const res = await superAdminApi.createCourseOnBehalf(payload);
      if (res.success) {
        toastSuccess(
          publishDirectly ? 'Course Published Live!' : 'Course Draft Saved!',
          `Course "${courseFormData.title}" has been assigned to ${instructorDisplayName} with platform publishing fees 100% waived.`
        );
        onSuccess(res.data, publishDirectly);
      }
    } catch (err: any) {
      console.error('Error creating course on behalf:', err);
      toastError('Submission Failed', err.response?.data?.message || err.message || 'Could not create course.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered instructors for dropdown
  const filteredInstructors = instructors.filter((inst) => {
    const q = instructorSearch.toLowerCase();
    const name = (inst.name || `${inst.firstName || ''} ${inst.lastName || ''}`).toLowerCase();
    const email = (inst.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-6 font-sans">
      {/* =========================================================================
          TOP BAR HEADER CARD (Image 1 Style with Admin Privilege & Fee Exemption)
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          {createStep > 1 && (
            <button
              type="button"
              onClick={() => setCreateStep(createStep - 1)}
              className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-colors flex items-center justify-center cursor-pointer shrink-0"
              title="Previous Step"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Create Course on Behalf of Instructor
              </h2>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                Root Admin Mode
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                Fee Waived (₹0)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Create, configure, and instantly publish a complete course for any instructor. All payment requirements bypassed.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-auto flex-wrap">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmitCourse(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Save as Draft for Instructor</span>
          </button>

          {createStep < 9 ? (
            <button
              type="button"
              onClick={() => setCreateStep(createStep + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmitCourse(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Publishing Course...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create & Publish Live (Pre-Approved)</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Cancel and return to courses"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          TARGET INSTRUCTOR ASSIGNMENT CARD (Prominent Selector with Details)
         ========================================================================= */}
      <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/60 to-blue-50/70 rounded-3xl border border-indigo-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Target Instructor Assignment <span className="text-red-500">*</span>
              </h3>
              <p className="text-[11px] text-slate-600 font-medium">
                Select which instructor will own this course and receive enrollments.
              </p>
            </div>
          </div>

          <span className="self-start sm:self-auto text-[11px] font-bold text-indigo-800 bg-white/90 px-3 py-1 rounded-full border border-indigo-200 shadow-2xs">
            {instructors.length} Registered Instructors Available
          </span>
        </div>

        {instructors.length === 0 ? (
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>No instructors found in database. Please register an instructor account first.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-8">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Choose Registered Instructor:
              </label>
              <select
                value={selectedInstructorId}
                onChange={(e) => setSelectedInstructorId(e.target.value)}
                className="w-full p-3 bg-white border border-indigo-200 rounded-xl font-bold text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                {filteredInstructors.map((inst) => {
                  const id = inst.id || inst._id;
                  const name = inst.name || `${inst.firstName || ''} ${inst.lastName || ''}`.trim() || 'Instructor';
                  return (
                    <option key={id} value={id}>
                      {name} ({inst.email})
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedInstructor && (
              <div className="md:col-span-4 p-3 bg-white/90 rounded-2xl border border-indigo-100 flex items-center gap-3 shadow-2xs">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {selectedInstructor.profilePhoto ? (
                    <img
                      src={selectedInstructor.profilePhoto}
                      alt="avatar"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    instructorDisplayName[0]?.toUpperCase() || 'I'
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-xs text-slate-900 truncate">
                    {instructorDisplayName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {selectedInstructor.email}
                  </p>
                  <span className="inline-block text-[9px] font-black text-emerald-700 uppercase">
                    Fee Waived • Direct Assignment
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          STEPPER PROGRESS BAR (Exact 9 Steps Matching Instructor View)
         ========================================================================= */}
      <div className="overflow-x-auto pb-2 scrollbar-thin">
        <div className="flex items-center gap-2 min-w-max p-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          {[
            { step: 1, label: 'Basic Information' },
            { step: 2, label: 'Course Description' },
            { step: 3, label: "What You'll Learn" },
            { step: 4, label: 'Curriculum' },
            { step: 5, label: 'Course Foundations' },
            { step: 6, label: 'Requirements' },
            { step: 7, label: 'This Course Includes' },
            { step: 8, label: 'Media & Pricing' },
            { step: 9, label: 'Review & Submit (Exemption)' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setCreateStep(s.step)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                createStep === s.step
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-2xs'
                  : createStep > s.step
                  ? 'bg-emerald-50/60 border border-emerald-100 text-emerald-800'
                  : 'bg-transparent border border-transparent text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[11px] shrink-0 ${
                  createStep === s.step
                    ? 'bg-indigo-600 text-white'
                    : createStep > s.step
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {createStep > s.step ? '✓' : s.step}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MAIN WIZARD STEP CONTAINER CARD
         ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">

        {/* -----------------------------------------------------------------------
            STEP 1: BASIC INFORMATION
           ----------------------------------------------------------------------- */}
        {createStep === 1 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Basic Information</h3>
                <p className="text-slate-500 font-medium text-xs">Add core course title, descriptions, category and thumbnail.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-6 space-y-5">
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Course Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Full-Stack Web Development & Microservices"
                    value={courseFormData.title}
                    onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800">Short Description *</label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {courseFormData.shortDescription.length}/150
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={150}
                    placeholder="Brief 1-2 sentence overview shown on catalog cards..."
                    value={courseFormData.shortDescription}
                    onChange={(e) => setCourseFormData({ ...courseFormData, shortDescription: e.target.value })}
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:border-indigo-500 focus:outline-none shadow-2xs resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800">Full Description *</label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {courseFormData.description.length}/3000
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-50 border-b border-slate-200 text-slate-600">
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><Bold className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><Italic className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><Underline className="w-3.5 h-3.5" /></button>
                      <span className="w-px h-4 bg-slate-300 mx-1" />
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><List className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><ListOrdered className="w-3.5 h-3.5" /></button>
                      <span className="w-px h-4 bg-slate-300 mx-1" />
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><Code className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1.5 hover:bg-white hover:text-slate-900 rounded-lg font-bold"><Quote className="w-3.5 h-3.5" /></button>
                    </div>
                    <textarea
                      rows={6}
                      maxLength={3000}
                      placeholder="Comprehensive course synopsis, topics covered, practical projects, and expected outcomes..."
                      value={courseFormData.description}
                      onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                      className="w-full p-3.5 bg-white font-medium text-slate-900 focus:outline-none leading-relaxed resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-6 space-y-5">
                {/* Thumbnail */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Course Thumbnail Image *</label>
                  {courseFormData.thumbnail ? (
                    <div className="relative rounded-2xl overflow-hidden h-40 bg-slate-100 border border-slate-200 group">
                      <img src={courseFormData.thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCourseFormData({ ...courseFormData, thumbnail: '' })}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-xl bg-red-600/90 text-white shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                        title="Remove Image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 space-y-3">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <button
                          type="button"
                          onClick={() => setThumbUploadTab('url')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                            thumbUploadTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Web URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbUploadTab('device')}
                          className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer transition-colors ${
                            thumbUploadTab === 'device' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Device File
                        </button>
                      </div>

                      {thumbUploadTab === 'url' ? (
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/photo-..."
                            value={thumbUrlInput}
                            onChange={(e) => setThumbUrlInput(e.target.value)}
                            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                          />
                          <button
                            type="button"
                            onClick={handleApplyWebUrl}
                            className="px-4 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-slate-900"
                          >
                            Set URL
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer text-center">
                          <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                          <span className="font-bold text-slate-800 text-xs">Click to browse image from device</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WebP up to 5MB</span>
                          <input type="file" accept="image/*" onChange={handleDeviceFileUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  )}
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">Category *</label>
                    <select
                      value={courseFormData.category}
                      onChange={(e) => setCourseFormData({ ...courseFormData, category: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="Development">Development</option>
                      <option value="Business">Business</option>
                      <option value="IT & Software">IT & Software</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Cloud Computing">Cloud Computing</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">Subcategory</label>
                    <input
                      type="text"
                      placeholder="e.g. Full-Stack / React"
                      value={courseFormData.subcategory}
                      onChange={(e) => setCourseFormData({ ...courseFormData, subcategory: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>

                {/* Level & Language */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">Difficulty Level</label>
                    <select
                      value={courseFormData.level}
                      onChange={(e) => setCourseFormData({ ...courseFormData, level: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="All Levels">All Levels</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">Primary Language</label>
                    <select
                      value={courseFormData.language}
                      onChange={(e) => setCourseFormData({ ...courseFormData, language: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>
                </div>

                {/* Schedule & Deadline + Mentor Badge (Image 1 Features) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Schedule & Deadline (Image 1 Feature)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Thursday, 5th September | 7:30PM"
                      value={courseFormData.schedule}
                      onChange={(e) => setCourseFormData({ ...courseFormData, schedule: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Displayed at the top of the course card.</p>
                  </div>
                  <div>
                    <label className="font-bold text-slate-800 block mb-1.5">
                      Mentor Highlight Badge (Image 1 Feature)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Pro Mentor, Top 1% Mentor"
                      value={courseFormData.mentorStatus}
                      onChange={(e) => setCourseFormData({ ...courseFormData, mentorStatus: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Visual highlight badge on the course thumbnail.</p>
                  </div>
                </div>

                {/* Promo Video */}
                <div>
                  <label className="font-bold text-slate-800 block mb-1.5">Promotional Video URL</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or Vimeo"
                    value={courseFormData.promotionalVideo}
                    onChange={(e) => setCourseFormData({ ...courseFormData, promotionalVideo: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 2: COURSE DESCRIPTION & AUDIENCE
           ----------------------------------------------------------------------- */}
        {createStep === 2 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Course Overview & Target Audience</h3>
                <p className="text-slate-500 font-medium text-xs">Define who should take this course and what goals it achieves.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Detailed Overview</label>
                <textarea
                  rows={4}
                  placeholder="In-depth explanation of the course structure, methodologies, and outcomes..."
                  value={courseFormData.detailedOverview}
                  onChange={(e) => setCourseFormData({ ...courseFormData, detailedOverview: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Teaching Methodology</label>
                <input
                  type="text"
                  value={courseFormData.teachingMethodology}
                  onChange={(e) => setCourseFormData({ ...courseFormData, teachingMethodology: e.target.value })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Target Audience Profiles</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Frontend developers looking to master full-stack"
                    value={newAudienceInput}
                    onChange={(e) => setNewAudienceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const items = parseMultiItems(newAudienceInput);
                        if (items.length) {
                          setCourseFormData((p) => ({ ...p, targetAudience: [...p.targetAudience, ...items] }));
                          setNewAudienceInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newAudienceInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, targetAudience: [...p.targetAudience, ...items] }));
                        setNewAudienceInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.targetAudience.map((aud, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium">
                      <span>• {aud}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            targetAudience: p.targetAudience.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Course Goals */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Primary Course Goals</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Build production-grade cloud native web apps"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const items = parseMultiItems(newGoalInput);
                        if (items.length) {
                          setCourseFormData((p) => ({ ...p, courseGoals: [...p.courseGoals, ...items] }));
                          setNewGoalInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newGoalInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, courseGoals: [...p.courseGoals, ...items] }));
                        setNewGoalInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.courseGoals.map((g, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-800 font-medium border border-purple-100">
                      <span>✓ {g}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            courseGoals: p.courseGoals.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-purple-400 hover:text-red-600 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Professional Summary Tags (Image 1 Feature) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-extrabold text-slate-800 block">
                      Professional Summary Tags (Image 1 Feature)
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Core corporate & role experience points (e.g., Ex-Apple | Full Stack Engineer | MERN Developer).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                    {courseFormData.professionalTags.length} Tags
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.professionalTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs shadow-2xs"
                    >
                      <Tag className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCourseFormData({
                            ...courseFormData,
                            professionalTags: courseFormData.professionalTags.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-indigo-400 hover:text-rose-600 cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Ex-Apple, Senior Manager, MERN Developer..."
                    value={newProfessionalTagInput}
                    onChange={(e) => setNewProfessionalTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newProfessionalTagInput.trim()) {
                          setCourseFormData({
                            ...courseFormData,
                            professionalTags: [...courseFormData.professionalTags, newProfessionalTagInput.trim()],
                          });
                          setNewProfessionalTagInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newProfessionalTagInput.trim()) {
                        setCourseFormData({
                          ...courseFormData,
                          professionalTags: [...courseFormData.professionalTags, newProfessionalTagInput.trim()],
                        });
                        setNewProfessionalTagInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Education & Qualifications (Image 1 Feature - Optional) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-extrabold text-slate-800 block">
                      Education & Qualifications (Optional - Image 1 Feature)
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Degrees & certifications (e.g., PG Diploma, Art & Design). Omitted from card if left empty.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    {courseFormData.qualifications.length} Credentials
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.qualifications.map((q, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs shadow-2xs"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCourseFormData({
                            ...courseFormData,
                            qualifications: courseFormData.qualifications.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-purple-400 hover:text-rose-600 cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. PG Diploma, Art & Design, B.Tech Computer Science..."
                    value={newQualificationInput}
                    onChange={(e) => setNewQualificationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newQualificationInput.trim()) {
                          setCourseFormData({
                            ...courseFormData,
                            qualifications: [...courseFormData.qualifications, newQualificationInput.trim()],
                          });
                          setNewQualificationInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-purple-500 focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newQualificationInput.trim()) {
                        setCourseFormData({
                          ...courseFormData,
                          qualifications: [...courseFormData.qualifications, newQualificationInput.trim()],
                        });
                        setNewQualificationInput('');
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                  >
                    + Add Credential
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 3: WHAT YOU'LL LEARN
           ----------------------------------------------------------------------- */}
        {createStep === 3 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">What Students Will Learn</h3>
                <p className="text-slate-500 font-medium text-xs">Define tangible skills, learning objectives, and core concepts.</p>
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Learning Objectives & Outcomes</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Master asynchronous JavaScript, Promises and Event Loops"
                    value={newLearningObjectiveInput}
                    onChange={(e) => setNewLearningObjectiveInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newLearningObjectiveInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, learningObjectives: [...p.learningObjectives, ...items] }));
                        setNewLearningObjectiveInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {courseFormData.learningObjectives.map((obj, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-950 font-medium">
                      <span>✓ {obj}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            learningObjectives: p.learningObjectives.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foundational Concepts */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Foundational Concepts</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Component Lifecycle, State Immutability, Hooks"
                    value={newFoundationalConceptInput}
                    onChange={(e) => setNewFoundationalConceptInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newFoundationalConceptInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, foundationalConcepts: [...p.foundationalConcepts, ...items] }));
                        setNewFoundationalConceptInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.foundationalConcepts.map((fc, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 font-medium">
                      <span>• {fc}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            foundationalConcepts: p.foundationalConcepts.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-blue-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Recommended Prior Knowledge */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Recommended Prior Knowledge</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. High school mathematics, basic terminal commands"
                    value={newPriorKnowledgeInput}
                    onChange={(e) => setNewPriorKnowledgeInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newPriorKnowledgeInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, recommendedPriorKnowledge: [...p.recommendedPriorKnowledge, ...items] }));
                        setNewPriorKnowledgeInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.recommendedPriorKnowledge.map((pk, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium">
                      <span>• {pk}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            recommendedPriorKnowledge: p.recommendedPriorKnowledge.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience & Achievement Metrics (Image 1 Feature) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-extrabold text-slate-800 block">
                      Experience & Achievement Metrics (Image 1 Feature)
                    </label>
                    <p className="text-[11px] text-slate-500 font-medium">
                      High-value highlights (e.g. 18y Exp | Top 1% Mentor | 10x Engineer).
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {courseFormData.experienceMetrics.length} Highlights
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.experienceMetrics.map((met, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{met}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCourseFormData({
                            ...courseFormData,
                            experienceMetrics: courseFormData.experienceMetrics.filter((_, i) => i !== idx),
                          });
                        }}
                        className="text-emerald-400 hover:text-rose-600 cursor-pointer ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 18y Exp, Top 1% Mentor, 10x Engineer..."
                    value={newExperienceMetricInput}
                    onChange={(e) => setNewExperienceMetricInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newExperienceMetricInput.trim()) {
                          setCourseFormData({
                            ...courseFormData,
                            experienceMetrics: [...courseFormData.experienceMetrics, newExperienceMetricInput.trim()],
                          });
                          setNewExperienceMetricInput('');
                        }
                      }
                    }}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-emerald-500 focus:outline-none shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newExperienceMetricInput.trim()) {
                        setCourseFormData({
                          ...courseFormData,
                          experienceMetrics: [...courseFormData.experienceMetrics, newExperienceMetricInput.trim()],
                        });
                        setNewExperienceMetricInput('');
                      }
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                  >
                    + Add Metric
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 4: CURRICULUM & SYLLABUS
           ----------------------------------------------------------------------- */}
        {createStep === 4 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Curriculum & Syllabus Structure</h3>
                  <p className="text-slate-500 font-medium text-xs">Organize modules, atomic lessons/topics, and upload syllabus document.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWizardModuleModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Module</span>
              </button>
            </div>

            {/* Modules List */}
            {courseFormData.modules.length === 0 ? (
              <div className="text-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                <p className="font-bold text-slate-600">No modules added yet.</p>
                <button
                  type="button"
                  onClick={() => setWizardModuleModal(true)}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Create First Module
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {courseFormData.modules.map((mod, mIdx) => (
                  <div key={mIdx} className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          {mIdx + 1}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm">{mod.title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModuleIndex(mIdx);
                            setEditingTopicIndex(null);
                            setWizardTopicForm({
                              title: '',
                              description: '',
                              price: 0,
                              isFree: false,
                              duration: 30,
                              videoUrl: '',
                            });
                            setWizardTopicModal(true);
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 text-indigo-600 font-bold rounded-xl text-xs cursor-pointer shadow-2xs"
                        >
                          + Add Topic
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(mIdx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          title="Delete Module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Topics inside Module */}
                    {mod.topics.length === 0 ? (
                      <p className="text-slate-400 italic text-[11px] pl-8">No topics added to this module yet.</p>
                    ) : (
                      <div className="space-y-2 pl-4 border-l-2 border-indigo-200 ml-3">
                        {mod.topics.map((t, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {tIdx + 1}. {t.title}
                              </p>
                              {t.description && (
                                <p className="text-[10px] text-slate-500 truncate">{t.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-semibold text-slate-500">{t.duration} mins</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.isFree ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {t.isFree ? 'Free Preview' : `₹${t.price}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedModuleIndex(mIdx);
                                  setEditingTopicIndex(tIdx);
                                  setWizardTopicForm({
                                    title: t.title,
                                    description: t.description || '',
                                    price: t.price || 0,
                                    isFree: !!t.isFree,
                                    duration: t.duration || 30,
                                    videoUrl: t.videoUrl || '',
                                  });
                                  setWizardTopicModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                                title="Edit Topic"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveTopic(mIdx, tIdx)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                                title="Delete Topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Syllabus Upload Section */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 pt-4">
              <label className="font-bold text-slate-800 block">Course Syllabus PDF Document</label>
              {courseFormData.syllabusUrl ? (
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-indigo-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0" />
                    <span className="font-bold text-xs text-slate-800 truncate">
                      {courseFormData.syllabusFileName || 'Syllabus.pdf'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCourseFormData({ ...courseFormData, syllabusUrl: '', syllabusFileName: '' })}
                    className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Remove syllabus"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setSyllabusUploadTab('url')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        syllabusUploadTab === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Web URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setSyllabusUploadTab('device')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer ${
                        syllabusUploadTab === 'device' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Upload PDF
                    </button>
                  </div>

                  {syllabusUploadTab === 'url' ? (
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/syllabus.pdf"
                        value={syllabusUrlInput}
                        onChange={(e) => setSyllabusUrlInput(e.target.value)}
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={handleApplySyllabusWebUrl}
                        className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl cursor-pointer"
                      >
                        Set Syllabus
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer text-center">
                      <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                      <span className="font-bold text-slate-800 text-xs">Select Syllabus PDF from device</span>
                      <input type="file" accept=".pdf" onChange={handleSyllabusFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 5: COURSE FOUNDATIONS & TOOLS
           ----------------------------------------------------------------------- */}
        {createStep === 5 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Course Foundations & Core Tools</h3>
                <p className="text-slate-500 font-medium text-xs">List key tools, IDEs, platforms and prerequisites.</p>
              </div>
            </div>

            {/* Core Tools */}
            <div className="space-y-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Core Tools & Technologies Used</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Docker, Kubernetes, AWS, GraphQL"
                    value={newCoreToolInput}
                    onChange={(e) => setNewCoreToolInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newCoreToolInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, coreTools: [...p.coreTools, ...items] }));
                        setNewCoreToolInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.coreTools.map((tool, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-100 font-medium">
                      <span>• {tool}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            coreTools: p.coreTools.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-indigo-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">General Prerequisites</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Familiarity with HTML and web browsers"
                    value={newPrerequisiteInput}
                    onChange={(e) => setNewPrerequisiteInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newPrerequisiteInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, requirements: [...p.requirements, ...items] }));
                        setNewPrerequisiteInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {courseFormData.requirements.map((req, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                      <span>• {req}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            requirements: p.requirements.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 6: HARDWARE & SOFTWARE REQUIREMENTS
           ----------------------------------------------------------------------- */}
        {createStep === 6 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">System & Software Requirements</h3>
                <p className="text-slate-500 font-medium text-xs">Hardware specs, runtime engines, and necessary developer accounts.</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Hardware */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Hardware Specifications</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. 16 GB RAM recommended for Docker"
                    value={newHardwareReqInput}
                    onChange={(e) => setNewHardwareReqInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newHardwareReqInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, hardwareRequirements: [...p.hardwareRequirements, ...items] }));
                        setNewHardwareReqInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.hardwareRequirements.map((hw, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium">
                      <span>• {hw}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            hardwareRequirements: p.hardwareRequirements.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Software */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Software & Runtime Requirements</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Node.js 18+, Docker Desktop"
                    value={newSoftwareReqInput}
                    onChange={(e) => setNewSoftwareReqInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newSoftwareReqInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, softwareRequirements: [...p.softwareRequirements, ...items] }));
                        setNewSoftwareReqInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.softwareRequirements.map((sw, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium">
                      <span>• {sw}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            softwareRequirements: p.softwareRequirements.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Required Accounts */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Required Accounts & Subscriptions</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="e.g. Free AWS tier account, GitHub account"
                    value={newRequiredAccountInput}
                    onChange={(e) => setNewRequiredAccountInput(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const items = parseMultiItems(newRequiredAccountInput);
                      if (items.length) {
                        setCourseFormData((p) => ({ ...p, requiredAccounts: [...p.requiredAccounts, ...items] }));
                        setNewRequiredAccountInput('');
                      }
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courseFormData.requiredAccounts.map((acc, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-medium">
                      <span>• {acc}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCourseFormData((p) => ({
                            ...p,
                            requiredAccounts: p.requiredAccounts.filter((_, i) => i !== idx),
                          }))
                        }
                        className="text-slate-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 7: THIS COURSE INCLUDES
           ----------------------------------------------------------------------- */}
        {createStep === 7 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">This Course Includes & Highlights</h3>
                <p className="text-slate-500 font-medium text-xs">Video hours, downloadable resources, project count, and certificate perks.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Video Hours Highlight</label>
                <input
                  type="text"
                  value={courseFormData.courseIncludes.videoHours}
                  onChange={(e) =>
                    setCourseFormData((p) => ({
                      ...p,
                      courseIncludes: { ...p.courseIncludes, videoHours: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Downloadable Resources</label>
                <input
                  type="text"
                  value={courseFormData.courseIncludes.resourcesCount}
                  onChange={(e) =>
                    setCourseFormData((p) => ({
                      ...p,
                      courseIncludes: { ...p.courseIncludes, resourcesCount: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Projects Count</label>
                <input
                  type="text"
                  value={courseFormData.courseIncludes.projectsCount}
                  onChange={(e) =>
                    setCourseFormData((p) => ({
                      ...p,
                      courseIncludes: { ...p.courseIncludes, projectsCount: e.target.value },
                    }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Total Sessions (Optional)</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 24 Sessions"
                  value={courseFormData.totalSessions || ''}
                  onChange={(e) =>
                    setCourseFormData((p) => ({
                      ...p,
                      totalSessions: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            {/* Certificate Toggle */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={courseFormData.certificateSettings.enableCertificate}
                  onChange={(e) =>
                    setCourseFormData((p) => ({
                      ...p,
                      certificateSettings: { ...p.certificateSettings, enableCertificate: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="font-bold text-slate-900 text-xs">Enable Verified Certificate of Completion</span>
              </label>

              {courseFormData.certificateSettings.enableCertificate && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px]">Certificate Title / Credential Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Certified Full-Stack Software Architect"
                    value={courseFormData.certificateSettings.certificateTitle}
                    onChange={(e) =>
                      setCourseFormData((p) => ({
                        ...p,
                        certificateSettings: { ...p.certificateSettings, certificateTitle: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              )}
            </div>

            {/* Skills & Search Tags */}
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">Skills & Search Keywords</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Next.js, Redux, PostgreSQL"
                  value={newSkillTagInput}
                  onChange={(e) => setNewSkillTagInput(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    const items = parseMultiItems(newSkillTagInput);
                    if (items.length) {
                      setCourseFormData((p) => ({ ...p, skills: [...p.skills, ...items] }));
                      setNewSkillTagInput('');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {courseFormData.skills.map((sk, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-100 font-bold">
                    <span>#{sk}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setCourseFormData((p) => ({
                          ...p,
                          skills: p.skills.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-indigo-400 hover:text-red-600 cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 8: MEDIA & PRICING
           ----------------------------------------------------------------------- */}
        {createStep === 8 && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Tuition Pricing & Access Tier</h3>
                <p className="text-slate-500 font-medium text-xs">Set the course tuition, discounts, currency, and access duration.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Tuition Base Price (₹) *</label>
                <input
                  type="number"
                  min={0}
                  value={courseFormData.coursePrice}
                  onChange={(e) => setCourseFormData({ ...courseFormData, coursePrice: Number(e.target.value) })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-base focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Set 0 for a free course.</span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Discounted / Promotional Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={courseFormData.discountPrice}
                  onChange={(e) => setCourseFormData({ ...courseFormData, discountPrice: Number(e.target.value) })}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-base focus:border-indigo-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Optional discounted student price.</span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Currency</label>
                <select
                  value={courseFormData.currency}
                  onChange={(e) => setCourseFormData({ ...courseFormData, currency: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Access Duration</label>
                <select
                  value={courseFormData.accessDuration}
                  onChange={(e) => setCourseFormData({ ...courseFormData, accessDuration: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                >
                  <option value="Lifetime Access">Lifetime Access</option>
                  <option value="1 Year Access">1 Year Access</option>
                  <option value="6 Months Access">6 Months Access</option>
                </select>
              </div>
            </div>

            {/* Maximum Enrollment Limit (Optional Seat Cap) */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Maximum Enrollment Limit (Optional)
                </label>
                {courseFormData.maxEnrollmentLimit ? (
                  <span className="px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-[11px]">
                    Capped at {courseFormData.maxEnrollmentLimit} Students
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    Unlimited Seats
                  </span>
                )}
              </div>
              <input
                type="number"
                min="1"
                placeholder="e.g., 50 (Leave blank for unlimited access)"
                value={courseFormData.maxEnrollmentLimit || ''}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setCourseFormData((prev) => ({
                    ...prev,
                    maxEnrollmentLimit: val === '' ? '' : Math.max(1, parseInt(val, 10)),
                  }));
                }}
                className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 text-base focus:border-indigo-500 focus:outline-none shadow-2xs"
              />
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Restrict maximum student signups. Once active enrollments hit this limit, the course automatically locks with a <strong>"Sold Out / Course Full"</strong> badge.
              </p>
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------------
            STEP 9: REVIEW & SUBMIT (ADMIN EXEMPTION MODE - CRUCIAL REQUIREMENT 3)
           ----------------------------------------------------------------------- */}
        {createStep === 9 && (
          <div className="space-y-6 text-xs pt-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Step 9: Complete Course Review & Super Admin Publication
                </h3>
                <p className="text-slate-500 font-medium">
                  Verify course parameters, catalog preview, and publish on behalf of {instructorDisplayName} with publishing fees 100% waived.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black">
                Step 9 of 9
              </span>
            </div>

            {/* Summary Metric Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-lg font-black text-slate-900">{courseFormData.modules.length}</p>
                <p className="text-[11px] font-semibold text-slate-500">Modules Configured</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-lg font-black text-indigo-600">
                  {courseFormData.modules.reduce((acc, m) => acc + m.topics.length, 0)}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">Atomic Topics</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-lg font-black text-purple-600">
                  {courseFormData.modules.reduce(
                    (acc, m) => acc + m.topics.reduce((tAcc, t) => tAcc + (t.duration || 30), 0),
                    0
                  )}m
                </p>
                <p className="text-[11px] font-semibold text-slate-500">Total Duration</p>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                <p className="text-lg font-black text-emerald-600">
                  {courseFormData.coursePrice === 0 ? 'FREE' : `₹${courseFormData.coursePrice.toLocaleString('en-IN')}`}
                </p>
                <p className="text-[11px] font-semibold text-slate-500">Tuition Price</p>
              </div>
            </div>

            {/* Student View Live Interactive Card (Image 1 Layout) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-extrabold text-slate-900 text-sm">Student View Catalog Preview (Image 1 Layout)</h4>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Live Simulation</span>
              </div>

              <div className="max-w-md mx-auto sm:max-w-none bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Top Bar: Schedule & Deadline + Actionable Icons */}
                  <div className="p-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 truncate">
                      <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate">{courseFormData.schedule || 'Flexible Self-Paced Schedule'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-rose-500 hover:border-rose-200 transition-colors cursor-pointer"
                        title="Add to Wishlist"
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
                        title="Bookmark"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail with Mentor Status & Category Badges */}
                  <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-900">
                    {courseFormData.thumbnail ? (
                      <img src={courseFormData.thumbnail} alt={courseFormData.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                        <ImageIcon className="w-8 h-8 mb-1" />
                        <span className="text-xs font-bold">Course Thumbnail</span>
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[10px] font-black rounded-md uppercase tracking-wider">
                        {courseFormData.category}
                      </span>
                      {courseFormData.mentorStatus && (
                        <span className="px-2.5 py-0.5 bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-3 h-3 fill-current" />
                          {courseFormData.mentorStatus}
                        </span>
                      )}
                    </div>

                    {courseFormData.maxEnrollmentLimit && (
                      <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-indigo-900/90 backdrop-blur-md text-white text-[10px] font-extrabold rounded-lg border border-indigo-500/30">
                        Seat Limit: {courseFormData.maxEnrollmentLimit}
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4.5 space-y-3">
                    <h3 className="text-base font-extrabold text-slate-900 line-clamp-2 leading-snug">
                      {courseFormData.title || 'Untitled Course'}
                    </h3>

                    {/* Professional Summary Tags */}
                    {courseFormData.professionalTags && courseFormData.professionalTags.length > 0 && (
                      <div className="text-[11px] font-semibold text-slate-600 flex flex-wrap items-center gap-1">
                        {courseFormData.professionalTags.map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center">
                            <span>{tag}</span>
                            {idx < courseFormData.professionalTags.length - 1 && (
                              <span className="mx-1 text-slate-300 font-normal">|</span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Experience & Achievement Metrics */}
                    {courseFormData.experienceMetrics && courseFormData.experienceMetrics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        {courseFormData.experienceMetrics.map((met, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-black rounded-md border border-emerald-200/60 flex items-center gap-1"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            {met}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Education & Qualifications (Optional - Omitted if empty) */}
                    {courseFormData.qualifications && courseFormData.qualifications.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        {courseFormData.qualifications.map((q, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-purple-50 text-purple-800 text-[10px] font-bold rounded-md border border-purple-200/60"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Structural Content Badges Row */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sessions</p>
                          <p className="text-[11px] font-extrabold text-slate-800 truncate">
                            {courseFormData.totalSessions || courseFormData.modules.reduce((a, m) => a + m.topics.length, 0) || 12}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                          <p className="text-[11px] font-extrabold text-slate-800 truncate">
                            {courseFormData.courseIncludes.videoHours || '20+ Hrs'}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Enrolled</p>
                          <p className="text-[11px] font-extrabold text-slate-800 truncate">
                            {courseFormData.maxEnrollmentLimit ? `Max ${courseFormData.maxEnrollmentLimit}` : 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Formatted Rating Summary */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-slate-900">4.8</span>
                        <span className="text-[11px] text-slate-400 font-medium">(10.5k)</span>
                      </div>
                      <span className="text-slate-500 font-semibold text-[11px]">By {instructorDisplayName}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Price & Action */}
                <div className="px-4.5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tuition</p>
                    <p className="text-base font-black text-slate-900">
                      {courseFormData.coursePrice === 0 ? 'FREE' : `₹${courseFormData.coursePrice.toLocaleString('en-IN')}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>

              {/* Dynamic Syllabus Preview Hierarchy */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">Course Curriculum (Syllabus Preview)</h4>

                {courseFormData.modules.length === 0 ? (
                  <p className="text-slate-400 italic text-xs py-2">No modules configured yet.</p>
                ) : (
                  <div className="space-y-2">
                    {courseFormData.modules.map((mod, mIdx) => (
                      <div key={mIdx} className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-slate-900 text-xs">
                            Module {mIdx + 1}: {mod.title.replace(/^Module\s*\d+\s*:\s*/i, '')}
                          </h5>
                          <span className="text-[11px] font-semibold text-slate-500">{mod.topics.length} Topics</span>
                        </div>
                        <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                          {mod.topics.map((t, tIdx) => (
                            <div key={tIdx} className="flex items-center justify-between text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-100">
                              <span>• {t.title}</span>
                              <span className="font-semibold text-slate-500">{t.isFree ? 'Free Preview' : `₹${t.price}`}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* =====================================================================
                CRUCIAL REQUIREMENT 3: 100% PAYMENT EXEMPTION GATEWAY BYPASS
               ===================================================================== */}
            <div className="p-6 sm:p-7 rounded-3xl border bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-emerald-300 text-emerald-950 space-y-5 shadow-sm animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base text-emerald-950">
                        Platform Publishing Fee 100% Waived
                      </h4>
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-400">
                        ROOT ADMIN PRIVILEGE • ₹0 PAYABLE
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                      Cashfree Payment Gateway bypassed by Super Admin. Instructors are normally required to settle a 10% platform publishing fee, but creating on behalf of an instructor is <strong>100% free</strong> and pre-approved for immediate live release.
                    </p>
                  </div>
                </div>
              </div>

              {/* Exemption Financial Breakdown Table */}
              <div className="p-4 rounded-2xl bg-white/95 border border-emerald-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Course Tuition Price</span>
                  <p className="font-black text-slate-900 text-base">
                    ₹{courseFormData.coursePrice.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Standard 10% Fee</span>
                  <p className="font-bold text-slate-400 line-through text-sm">
                    ₹{(courseFormData.coursePrice * 0.10).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Super Admin Waiver</span>
                  <p className="font-black text-emerald-700 text-base">
                    -100% (WAIVED)
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider block">Total Amount Due</span>
                  <p className="font-black text-emerald-700 text-xl">
                    ₹0.00
                  </p>
                </div>
              </div>

              {/* Action Buttons inside Step 9 */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCourse(false)}
                  className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  Save as Draft for Instructor
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSubmitCourse(true)}
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl text-xs shadow-md shadow-emerald-600/20 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Publishing Course...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create & Publish Live (Pre-Approved)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          IN-UI MODAL: ADD MODULE (Numbering Added Automatically)
         ========================================================================= */}
      {wizardModuleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Add Module {courseFormData.modules.length + 1}
              </h3>
              <button
                type="button"
                onClick={() => setWizardModuleModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleWizardAddModule} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Advanced Routing & Controller Logic"
                  value={wizardModuleTitle}
                  onChange={(e) => setWizardModuleTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                The system will automatically prefix this as "Module {courseFormData.modules.length + 1}: [Your Title]".
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWizardModuleModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm hover:bg-indigo-700"
                >
                  Add Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          IN-UI MODAL: ADD / EDIT TOPIC
         ========================================================================= */}
      {wizardTopicModal && selectedModuleIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTopicIndex !== null ? 'Edit Topic / Lesson' : 'Add New Topic / Lesson'}
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Under: {courseFormData.modules[selectedModuleIndex]?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setWizardTopicModal(false);
                  setEditingTopicIndex(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Topic Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database Transactions & Rollbacks"
                  value={wizardTopicForm.title}
                  onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Topic Summary Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Brief synopsis of what this lesson covers..."
                  value={wizardTopicForm.description}
                  onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={wizardTopicForm.duration}
                    onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, duration: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">Individual Topic Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    disabled={wizardTopicForm.isFree}
                    value={wizardTopicForm.isFree ? 0 : wizardTopicForm.price}
                    onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  checked={wizardTopicForm.isFree}
                  onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, isFree: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="font-bold text-slate-800 text-xs">Allow as Free Preview Lesson</span>
              </label>

              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Lesson Video URL</label>
                <input
                  type="url"
                  placeholder="https://commondatastorage.googleapis.com/... or YouTube/Vimeo"
                  value={wizardTopicForm.videoUrl}
                  onChange={(e) => setWizardTopicForm({ ...wizardTopicForm, videoUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setWizardTopicModal(false);
                    setEditingTopicIndex(null);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl cursor-pointer shadow-sm hover:bg-indigo-700"
                >
                  {editingTopicIndex !== null ? 'Save Topic' : 'Add Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
