import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Video,
  DollarSign,
  Layers,
  ArrowRight,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { aiApi, type ParsedModule, type ParsedTopic } from '../../api/ai';

interface AutoFillCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (result: {
    modules: ParsedModule[];
    courseTitle?: string;
    courseDescription?: string;
    price?: number;
    duration?: number;
  }) => void;
}

const SAMPLE_DEMO_SYLLABUS = `Course: Full-Stack Web Development Bootcamp
Price: 2999 INR
Duration: 24 Hours

Module 1: Modern Frontend Foundations
- Lesson 1.1: HTML5 Semantics & Accessible Web Architecture
  Duration: 25 mins
  Video: https://youtube.com/watch?v=demo_html5_arch
  Free Preview: Yes
- Lesson 1.2: Modern CSS3, Flexbox & CSS Grid Mastery
  Duration: 40 mins
  Video: https://youtube.com/watch?v=demo_css_grid
- Lesson 1.3: Responsive Web Design & Mobile-First Principles
  Duration: 35 mins

Module 2: JavaScript & React Deep Dive
- Lesson 2.1: Modern ES6+ JavaScript, Promises & Async/Await
  Duration: 45 mins
  Video: https://youtube.com/watch?v=demo_es6_async
- Lesson 2.2: React Components, State Management & Custom Hooks
  Duration: 60 mins
  Video: https://youtube.com/watch?v=demo_react_hooks
- Lesson 2.3: Consuming RESTful APIs & Optimistic UI Updates
  Duration: 30 mins

Module 3: Backend APIs & Database Integration
- Lesson 3.1: Node.js & Express.js REST API Architecture
  Duration: 50 mins
- Lesson 3.2: MongoDB Schema Modeling & JWT Authentication
  Duration: 55 mins
  Video: https://youtube.com/watch?v=demo_node_auth
- Lesson 3.3: Production Deployment, CI/CD & Cloud Hosting
  Duration: 40 mins`;

export const AutoFillCurriculumModal: React.FC<AutoFillCurriculumModalProps> = ({
  isOpen,
  onClose,
  onApprove,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string>('');

  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Upload & Analysis Progress States
  const [progress, setProgress] = useState(0);
  const [progressStage, setProgressStage] = useState('');
  const [fileUploadProgress, setFileUploadProgress] = useState(0);

  // Extracted data for interactive verification
  const [parsedModules, setParsedModules] = useState<ParsedModule[]>([]);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [metaPrice, setMetaPrice] = useState<number>(0);
  const [metaDuration, setMetaDuration] = useState<number>(0);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg(null);
    setFileUploadProgress(15);

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 95);
        setFileUploadProgress(percent);
      }
    };

    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setFileDataUrl(result || '');
      setFileUploadProgress(100);
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file. Please try again.');
      setFileUploadProgress(0);
    };

    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);

    if (activeTab === 'text' && (!rawText || rawText.trim().length < 10)) {
      setErrorMsg('Please paste your course outline, syllabus, or lecture topics.');
      return;
    }

    if (activeTab === 'file' && !selectedFile && !fileDataUrl) {
      setErrorMsg('Please select a document file (.pdf, .docx, or .txt).');
      return;
    }

    try {
      setLoading(true);
      setProgress(15);
      setProgressStage('Reading and validating syllabus content...');

      // Simulated smooth progress timer while AI is processing
      const progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 35) {
            setProgressStage('Detecting modules and learning units...');
            return prev + 6;
          }
          if (prev < 65) {
            setProgressStage('Extracting topics, durations & video links...');
            return prev + 5;
          }
          if (prev < 90) {
            setProgressStage('Structuring curriculum for verification...');
            return prev + 3;
          }
          return prev;
        });
      }, 400);

      const res = await aiApi.parseCurriculum({
        text: activeTab === 'text' ? rawText : '',
        fileDataUrl: activeTab === 'file' ? fileDataUrl : '',
        fileName: selectedFile?.name || '',
        fileType: selectedFile?.type || '',
      });

      clearInterval(progressTimer);

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Could not parse curriculum from the provided input.');
      }

      setProgress(100);
      setProgressStage('Curriculum successfully extracted! Loading preview...');

      setTimeout(() => {
        const { data } = res;
        setParsedModules(data.modules || []);
        setMetaTitle(data.courseTitle || '');
        setMetaDescription(data.courseDescription || '');
        setMetaPrice(data.price || 0);
        setMetaDuration(data.duration || 0);
        setStep('verify');
        setLoading(false);
        setProgress(0);
      }, 500);
    } catch (err: any) {
      console.error('Curriculum parsing error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to analyze curriculum.');
      setLoading(false);
      setProgress(0);
    }
  };

  // Verification Mutations
  const handleUpdateModuleTitle = (mIdx: number, newTitle: string) => {
    setParsedModules((prev) =>
      prev.map((mod, idx) => (idx === mIdx ? { ...mod, title: newTitle } : mod))
    );
  };

  const handleRemoveModule = (mIdx: number) => {
    setParsedModules((prev) => prev.filter((_, idx) => idx !== mIdx));
  };

  const handleAddTopic = (mIdx: number) => {
    setParsedModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== mIdx) return mod;
        return {
          ...mod,
          topics: [
            ...mod.topics,
            {
              title: `New Lesson ${mod.topics.length + 1}`,
              description: '',
              duration: 30,
              videoUrl: '',
              price: 0,
              isFree: false,
            },
          ],
        };
      })
    );
  };

  const handleUpdateTopic = (mIdx: number, tIdx: number, field: keyof ParsedTopic, val: any) => {
    setParsedModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== mIdx) return mod;
        return {
          ...mod,
          topics: mod.topics.map((top, topicIdx) => {
            if (topicIdx !== tIdx) return top;
            return { ...top, [field]: val };
          }),
        };
      })
    );
  };

  const handleRemoveTopic = (mIdx: number, tIdx: number) => {
    setParsedModules((prev) =>
      prev.map((mod, idx) => {
        if (idx !== mIdx) return mod;
        return {
          ...mod,
          topics: mod.topics.filter((_, topicIdx) => topicIdx !== tIdx),
        };
      })
    );
  };

  const handleConfirmAndApply = () => {
    onApprove({
      modules: parsedModules,
      courseTitle: metaTitle,
      courseDescription: metaDescription,
      price: metaPrice,
      duration: metaDuration,
    });
    onClose();
  };

  const totalLessons = parsedModules.reduce((acc, m) => acc + (m.topics ? m.topics.length : 0), 0);
  const totalMins = parsedModules.reduce(
    (acc, m) => acc + (m.topics ? m.topics.reduce((sum, t) => sum + (t.duration || 0), 0) : 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/60 via-white to-amber-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Auto-Fill Course Curriculum</h3>
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-[#FA5A36] text-[10px] font-black uppercase tracking-wider">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {step === 'input'
                  ? 'Extract full modules, topics, durations & video links from your notes or syllabus.'
                  : 'Verify & approve the extracted curriculum before applying to your course.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* =========================================================================
              PHASE 1: INPUT & UPLOAD
             ========================================================================= */}
          {step === 'input' && (
            <div className="space-y-6">
              {/* Educational Explain Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 space-y-1">
                  <p className="font-bold">How does Auto-Fill work?</p>
                  <p className="text-blue-700 leading-relaxed font-normal">
                    Provide your curriculum in any text or document format. Our VStudyOnline model reads your modules,
                    lesson names, video URLs, and durations. If any field is missing, it is simply left
                    blank so you can review and approve it on the next screen.
                  </p>
                </div>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('text');
                    setErrorMsg(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'text'
                      ? 'bg-[#FA5A36] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste Syllabus / Outline</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('file');
                    setErrorMsg(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                    activeTab === 'file'
                      ? 'bg-[#FA5A36] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document (PDF / Word / Text)</span>
                </button>
              </div>

              {/* TAB 1: TEXT AREA */}
              {activeTab === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Paste Course Syllabus / Topic Outline *
                    </label>
                    <button
                      type="button"
                      onClick={() => setRawText(SAMPLE_DEMO_SYLLABUS)}
                      className="text-[11px] font-bold text-[#FA5A36] hover:text-[#E04322] flex items-center gap-1 cursor-pointer transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Load Sample Demo Outline</span>
                    </button>
                  </div>
                  <textarea
                    rows={9}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`e.g.\nModule 1: Introduction to Web Design\n- Lesson 1: Fundamentals of Typography (Duration: 20 mins, video: https://youtube.com/...)\n- Lesson 2: Color Theory & Modern Palettes\n\nModule 2: Figma to Code\n- Lesson 1: Exporting Assets\n- Lesson 2: Building with Flexbox`}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 font-mono focus:outline-none focus:border-[#FA5A36] focus:bg-white transition leading-relaxed resize-none"
                  />
                  <p className="text-[11px] text-slate-400">
                    You can paste bullet points, lecture notes, or markdown. Our model will automatically detect modules and lessons.
                  </p>
                </div>
              )}

              {/* TAB 2: FILE UPLOAD */}
              {activeTab === 'file' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-[#FA5A36]/60 transition bg-slate-50/60 relative">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FA5A36] border border-orange-200/80 flex items-center justify-center mx-auto mb-3 shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Click to browse or drop your syllabus file here'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Supports PDF (.pdf), Microsoft Word (.docx, .doc), or Text (.txt, .md) up to 10MB
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText className="w-4 h-4 text-[#FA5A36] shrink-0" />
                          <span className="font-bold text-slate-800 truncate">{selectedFile.name}</span>
                          <span className="text-[10px] text-slate-400">
                            ({(selectedFile.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-emerald-600 font-mono">
                            {fileUploadProgress}%
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null);
                              setFileDataUrl('');
                              setFileUploadProgress(0);
                            }}
                            className="text-rose-500 hover:text-rose-700 font-bold text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                          style={{ width: `${fileUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              PHASE 2: INTERACTIVE VERIFICATION & APPROVAL SCREEN
             ========================================================================= */}
          {step === 'verify' && (
            <div className="space-y-6">
              {/* Review Guidance Header */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">Curriculum Extracted Successfully — Verification Required</p>
                  <p className="text-emerald-700 leading-relaxed font-normal">
                    Please review your detected modules and topics below. You can edit any title, duration, or
                    video link. Missing fields are left blank so you can complete them now or later.
                  </p>
                </div>
              </div>

              {/* Statistics Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Modules</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{parsedModules.length}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Lessons / Topics</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">{totalLessons}</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Total Duration</span>
                  <p className="text-lg font-black text-slate-900 mt-0.5">
                    {Math.floor(totalMins / 60)}h {totalMins % 60}m
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Course Fee (INR)</span>
                  <input
                    type="number"
                    value={metaPrice || ''}
                    onChange={(e) => setMetaPrice(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 1999"
                    className="w-full text-center text-sm font-black text-slate-900 bg-white border border-slate-200 rounded-lg py-0.5 mt-0.5 focus:outline-none focus:border-[#FA5A36]"
                  />
                </div>
              </div>

              {/* Modules and Topics Interactive Tree */}
              <div className="space-y-4">
                {parsedModules.map((mod, mIdx) => (
                  <div key={mIdx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                    {/* Module Header Bar */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="px-2.5 py-1 bg-blue-600 text-white font-black text-[10px] rounded-lg shrink-0">
                          Module {mIdx + 1}
                        </span>
                        <input
                          type="text"
                          value={mod.title}
                          onChange={(e) => handleUpdateModuleTitle(mIdx, e.target.value)}
                          placeholder="Module Title"
                          className="flex-1 font-black text-xs text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddTopic(mIdx)}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-blue-400 text-blue-600 font-bold rounded-xl text-[11px] cursor-pointer transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Lesson</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveModule(mIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Topics inside Module */}
                    <div className="space-y-2 pl-2 sm:pl-4 border-l-2 border-blue-200">
                      {mod.topics.map((topic, tIdx) => (
                        <div
                          key={tIdx}
                          className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[10px] font-bold text-slate-400 font-mono shrink-0">
                                {mIdx + 1}.{tIdx + 1}
                              </span>
                              <input
                                type="text"
                                value={topic.title}
                                onChange={(e) =>
                                  handleUpdateTopic(mIdx, tIdx, 'title', e.target.value)
                                }
                                placeholder="Topic Title *"
                                className="w-full text-xs font-bold text-slate-800 border border-slate-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#FA5A36]"
                              />
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <input
                                  type="number"
                                  value={topic.duration}
                                  onChange={(e) =>
                                    handleUpdateTopic(
                                      mIdx,
                                      tIdx,
                                      'duration',
                                      Math.max(1, Number(e.target.value))
                                    )
                                  }
                                  className="w-10 text-center text-xs font-bold text-slate-700 bg-transparent focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400">m</span>
                              </div>

                              <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={topic.isFree}
                                  onChange={(e) =>
                                    handleUpdateTopic(mIdx, tIdx, 'isFree', e.target.checked)
                                  }
                                  className="w-3.5 h-3.5 text-[#FA5A36] rounded cursor-pointer"
                                />
                                <span>Free</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveTopic(mIdx, tIdx)}
                                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer transition"
                                title="Remove Topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Video Link & Description */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-100 text-[11px]">
                            <div className="flex-1 flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                              <Video className="w-3 h-3 text-slate-400 shrink-0" />
                              <input
                                type="text"
                                value={topic.videoUrl || ''}
                                onChange={(e) =>
                                  handleUpdateTopic(mIdx, tIdx, 'videoUrl', e.target.value)
                                }
                                placeholder="Paste lecture video URL (YouTube, Vimeo, MP4, Drive) or leave empty"
                                className="w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none font-mono text-[10px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Analysis Progress Bar (Visible while analyzing) */}
        {loading && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-orange-50/90 via-amber-50/70 to-white border-t border-orange-200/80 animate-in fade-in duration-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FA5A36] animate-ping" />
                <span className="font-extrabold text-slate-800">{progressStage || 'Analyzing syllabus...'}</span>
              </div>
              <span className="font-black text-[#FA5A36] font-mono text-sm">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#FA5A36] to-[#FF8A65] rounded-full transition-all duration-300 ease-out shadow-xs"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Modal Bottom Sticky Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === 'input' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleAnalyze}
                className="px-6 py-2.5 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing... ({progress}%)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analyze & Extract Curriculum</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Back / Re-Upload
              </button>
              <button
                type="button"
                onClick={handleConfirmAndApply}
                className="px-6 py-2.5 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Apply to Course ({parsedModules.length} Modules)</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
