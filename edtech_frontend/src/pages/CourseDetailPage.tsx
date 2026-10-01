import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { coursesApi, type CourseDetailsResponse } from '../api/courses';
import { featuredCoursesData } from '../data/mockData';
import {
  Star,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Layers,
  Video,
  Download,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Award,
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [courseData, setCourseData] = useState<CourseDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchDetails = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await coursesApi.getDetails(slug);
        if (res.success && res.data) {
          setCourseData(res.data);
          // Expand first 2 modules by default
          const initialExp: Record<string, boolean> = {};
          (res.data.syllabus || []).forEach((m, idx) => {
            initialExp[m._id] = idx < 2;
          });
          setExpandedModules(initialExp);
        }
      } catch (err) {
        console.warn('Fallback course details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [slug]);

  const fallbackCourse =
    featuredCoursesData.find((c) => c.slug === slug) || featuredCoursesData[0];

  const course = courseData?.course || fallbackCourse;
  const syllabus = courseData?.syllabus || [
    {
      _id: 'm1',
      title: 'Module 1: Introduction & Fundamentals',
      order: 1,
      topicsCount: 3,
      lessonsCount: 6,
      duration: '1h 30m',
      topics: [
        {
          _id: 't1',
          title: 'Core Architecture & Setup',
          price: 499,
          isFree: true,
          duration: 30,
          lessons: [
            {
              _id: 'l1',
              title: 'Welcome to the Course & Architecture Overview',
              duration: 15,
              resources: [{ name: 'Setup_Guide.pdf', type: 'PDF', size: '1.2 MB' }],
            },
            {
              _id: 'l2',
              title: 'Environment Configuration & Tooling',
              duration: 15,
              resources: [{ name: 'Starter_Code.zip', type: 'ZIP', size: '3.4 MB' }],
            },
          ],
        },
        {
          _id: 't2',
          title: 'Key Concepts & Building Blocks',
          price: 599,
          isFree: false,
          duration: 30,
          lessons: [
            {
              _id: 'l3',
              title: 'Hands-on Coding & Execution',
              duration: 30,
              resources: [{ name: 'Cheatsheet.pdf', type: 'PDF', size: '850 KB' }],
            },
          ],
        },
      ],
    },
    {
      _id: 'm2',
      title: 'Module 2: Advanced Topics & Real-world Projects',
      order: 2,
      topicsCount: 4,
      lessonsCount: 8,
      duration: '3h 20m',
      topics: [
        {
          _id: 't3',
          title: 'Production Deployment & Best Practices',
          price: 799,
          isFree: false,
          duration: 50,
          lessons: [
            {
              _id: 'l4',
              title: 'CI/CD Pipeline & Cloud Deployment',
              duration: 25,
              resources: [{ name: 'Deployment_Config.yaml', type: 'YAML', size: '40 KB' }],
            },
          ],
        },
      ],
    },
  ];

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalLessons = syllabus.reduce((acc, m) => acc + (m.lessonsCount || 0), 0) || 14;
  const totalTopics = syllabus.reduce((acc, m) => acc + (m.topicsCount || 0), 0) || 7;

  if (loading && !courseData) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayPrice = course.coursePrice ?? course.price ?? 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Course Banner Header */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-8 relative overflow-hidden shadow-xl border border-slate-800">
          <div className="max-w-3xl relative z-10 space-y-4">
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider inline-block">
              {course.category}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              {course.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {course.shortDescription ||
                'Learn from industry experts with hands-on projects, real-world assignments, and verifiable certificates.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-300 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="text-white">{typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating}</span>
                <span className="text-slate-400 font-normal">({course.reviewCount || '12K ratings'})</span>
              </div>
              <div>
                Instructor: <strong className="text-white">{course.instructorName}</strong>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-400" /> {totalTopics} Topics • {totalLessons} Lessons
              </div>
            </div>
          </div>
        </div>

        {/* Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Learning Objectives & Syllabus */}
          <div className="lg:col-span-8 space-y-8">
            {/* What you'll learn */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>What you'll learn</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                {[
                  'Build complete, production-ready applications with hands-on labs',
                  'Master core modern architecture and industrial best practices',
                  'Atomic topic-by-topic learning with automatic course upgrades',
                  'Earn industry-recognized verifiable certificates upon completion',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* =========================================================================
                SYLLABUS & CURRICULUM SECTION
               ========================================================================= */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    <span>Course Curriculum (Syllabus)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {syllabus.length} Modules • {totalTopics} Topics • {totalLessons} Lessons
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (course.syllabusUrl && course.syllabusUrl.startsWith('http')) {
                        window.open(course.syllabusUrl, '_blank');
                      } else if (course.syllabusUrl && course.syllabusUrl.startsWith('data:')) {
                        const link = document.createElement('a');
                        link.href = course.syllabusUrl;
                        link.download = course.syllabusFileName || `${course.title}_Syllabus.pdf`;
                        link.click();
                      } else {
                        alert(`Downloading official syllabus document for "${course.title}"...`);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Syllabus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allExp: Record<string, boolean> = {};
                      syllabus.forEach((m) => (allExp[m._id] = true));
                      setExpandedModules(allExp);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 cursor-pointer"
                  >
                    Expand All
                  </button>
                </div>
              </div>

              {/* Syllabus Accordion Modules */}
              <div className="space-y-3">
                {syllabus.map((mod) => {
                  const isExpanded = !!expandedModules[mod._id];

                  return (
                    <div key={mod._id} className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all">
                      {/* Module Header */}
                      <button
                        onClick={() => toggleModule(mod._id)}
                        className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-600 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <div>
                            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{mod.title}</h3>
                            <p className="text-[11px] text-slate-500">
                              {mod.topicsCount || mod.topics?.length} Topics • {mod.lessonsCount} Lessons • {mod.duration}
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Topics & Lessons List inside Module */}
                      {isExpanded && (
                        <div className="p-4 bg-white divide-y divide-slate-100 space-y-3">
                          {mod.topics.map((top) => (
                            <div key={top._id} className="pt-3 first:pt-0 space-y-2">
                              {/* Topic Heading */}
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                                  <span className="font-bold text-slate-900">{top.title}</span>
                                  <span className="text-[10px] text-slate-400">({top.duration}m)</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {top.isFree ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                      FREE PREVIEW
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                      Topic Price: ₹{top.price}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Lessons and Video Content under Topic */}
                              <div className="pl-6 space-y-2">
                                {top.lessons && top.lessons.length > 0 ? (
                                  top.lessons.map((les: any) => (
                                    <div
                                      key={les._id}
                                      className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                          <Video className="w-4 h-4" />
                                        </div>
                                        <div>
                                          <span className="font-semibold text-slate-800 block">{les.title}</span>
                                          {les.playbackReference && (
                                            <span className="text-[10px] text-indigo-600 font-bold">Video Lesson Attached</span>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <span className="text-[11px] text-slate-400 font-medium">{les.duration || 15}m</span>
                                        {les.playbackReference && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (les.playbackReference.startsWith('http')) {
                                                window.open(les.playbackReference, '_blank');
                                              } else {
                                                alert(`Opening video: ${les.title}`);
                                              }
                                            }}
                                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                                          >
                                            Watch Video
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : top.videoUrl ? (
                                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between gap-2 text-xs">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                        <Video className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <span className="font-semibold text-slate-900 block">{top.title} - Video Lesson</span>
                                        <span className="text-[10px] text-purple-700 font-bold">Duration: {top.duration || 30} mins</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (top.videoUrl && top.videoUrl.startsWith('http')) {
                                          window.open(top.videoUrl, '_blank');
                                        } else {
                                          alert(`Opening video for topic: ${top.title}`);
                                        }
                                      }}
                                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer shadow-2xs"
                                    >
                                      Watch Video
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Instructor Profile Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">About the Instructor</h2>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
                  {course.instructorName[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{course.instructorName}</h3>
                  <p className="text-xs text-indigo-600 font-semibold mb-2">Senior Technology Lead & Certified Cloud Architect</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Over 8+ years of engineering experience architecting enterprise applications, microservices, and automated CI/CD pipelines.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing & Enrollment Action */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl sticky top-24 space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course Investment</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900">
                    {displayPrice === 0 ? 'FREE' : `₹${displayPrice.toLocaleString('en-IN')}`}
                  </span>
                  {displayPrice > 0 && (
                    <span className="text-sm text-slate-400 line-through">
                      ₹{Math.round(displayPrice * 2.2).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  to="/cart"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Enroll in Full Course</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/topics"
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center cursor-pointer"
                >
                  Buy Standalone Topics (from ₹499)
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full lifetime access & updates
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Access on web, tablet & mobile
                </p>
                <p className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" /> Industry verifiable completion certificate
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" /> 100% topic credit upgrade guarantee
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
