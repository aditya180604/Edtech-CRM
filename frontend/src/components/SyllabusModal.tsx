import React, { useState, useEffect } from 'react';
import { coursesApi, type CourseDetailsResponse } from '../api/courses';
import type { Course } from '../types';
import { Link } from 'react-router-dom';
import { X, BookOpen, Download, ChevronDown, ChevronRight, Video } from 'lucide-react';

interface SyllabusModalProps {
  course: Course | null;
  onClose: () => void;
}

export const SyllabusModal: React.FC<SyllabusModalProps> = ({ course, onClose }) => {
  const [details, setDetails] = useState<CourseDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!course) return;
    const fetchCurriculum = async () => {
      try {
        setLoading(true);
        const res = await coursesApi.getDetails(course.slug || course.id);
        if (res.success && res.data) {
          setDetails(res.data);
          const initExp: Record<string, boolean> = {};
          (res.data.syllabus || []).forEach((m, idx) => {
            initExp[m._id] = idx < 3; // expand first 3
          });
          setExpandedModules(initExp);
        }
      } catch (err) {
        console.warn('Failed to load syllabus details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurriculum();
  }, [course]);

  if (!course) return null;

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const syllabus = details?.syllabus || [];
  const totalLessons = syllabus.reduce((acc, m) => acc + (m.lessonsCount || 0), 0);
  const totalTopics = syllabus.reduce((acc, m) => acc + (m.topicsCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col justify-between border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">
              {course.category} Syllabus
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {course.title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Instructor: <strong className="text-slate-800">{course.instructorName}</strong> • {totalTopics || 4} Topics • {totalLessons || 8} Lessons
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Curriculum Content */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent"></div>
              <p className="text-xs font-bold text-slate-500">Loading course curriculum & syllabus...</p>
            </div>
          ) : syllabus.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700 text-xs">Curriculum details being updated by the instructor.</p>
            </div>
          ) : (
            syllabus.map((module, mIdx) => {
              const isExpanded = expandedModules[module._id];
              return (
                <div
                  key={module._id}
                  className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => toggleModule(module._id)}
                    className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {module.title.startsWith('Module') ? module.title : `Module ${mIdx + 1}: ${module.title}`}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {module.topics?.length || 0} Topics • {module.lessonsCount || 0} Lessons
                        </p>
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-3.5 space-y-2.5 bg-white border-t border-slate-100">
                      {module.topics?.map((topic, tIdx) => (
                        <div
                          key={topic._id || tIdx}
                          className="p-3 rounded-xl bg-slate-50/70 border border-slate-100 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-slate-800 text-xs">
                              {topic.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  topic.isFree
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {topic.isFree ? 'Free Preview' : `₹${topic.price}`}
                              </span>
                            </div>
                          </div>

                          {/* Dynamic Topic Description */}
                          {topic.description && (
                            <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                              {topic.description}
                            </p>
                          )}

                          {/* Lessons inside topic */}
                          {topic.lessons && topic.lessons.length > 0 && (
                            <div className="pl-3 border-l-2 border-slate-200 space-y-1.5 pt-1">
                              {topic.lessons.map((lesson: any, lIdx: number) => (
                                <div
                                  key={lesson._id || lIdx}
                                  className="flex items-center justify-between text-[11px] text-slate-600"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>{lesson.title}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {lesson.duration}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-slate-900">
              {course.price === 0 ? 'FREE' : `₹${course.price?.toLocaleString('en-IN')}`}
            </span>
            <span className="text-xs text-slate-500 font-medium">Full Lifetime Access</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                const targetSyllabusUrl = details?.course?.syllabusUrl || course.syllabusUrl;
                const targetFileName = details?.course?.syllabusFileName || course.syllabusFileName || `${course.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Syllabus.txt`;

                if (targetSyllabusUrl && targetSyllabusUrl.startsWith('data:')) {
                  // Direct Base64 File Download
                  const link = document.createElement('a');
                  link.href = targetSyllabusUrl;
                  link.download = targetFileName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                } else if (targetSyllabusUrl && targetSyllabusUrl.startsWith('http')) {
                  // External Hosted PDF URL Download
                  window.open(targetSyllabusUrl, '_blank');
                } else {
                  // Generate and download curriculum syllabus outline document dynamically
                  const crs: any = details?.course || course;
                  const lines = [
                    `=============================================================`,
                    `COURSE SYLLABUS: ${crs.title?.toUpperCase()}`,
                    `=============================================================`,
                    `Instructor: ${crs.instructorName || 'Lead Instructor'}`,
                    `Category: ${crs.category || 'Technology'}`,
                    `Level: ${crs.level || 'All Levels'}`,
                    `Language: ${crs.language || 'English'}`,
                    `Course Price: ${crs.price === 0 ? 'FREE' : `₹${crs.price?.toLocaleString('en-IN')}`}`,
                    `Generated On: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
                    `\n-------------------------------------------------------------`,
                    `COURSE OVERVIEW`,
                    `-------------------------------------------------------------`,
                    crs.description || crs.shortDescription || 'Comprehensive hands-on course curriculum.',
                  ];

                  if (crs.learningObjectives && crs.learningObjectives.length > 0) {
                    lines.push(`\n-------------------------------------------------------------`);
                    lines.push(`WHAT YOU WILL LEARN`);
                    lines.push(`-------------------------------------------------------------`);
                    crs.learningObjectives.forEach((obj: string) => lines.push(`• ${obj}`));
                  }

                  if (crs.requirements && crs.requirements.length > 0) {
                    lines.push(`\n-------------------------------------------------------------`);
                    lines.push(`PREREQUISITES & REQUIREMENTS`);
                    lines.push(`-------------------------------------------------------------`);
                    crs.requirements.forEach((req: string) => lines.push(`• ${req}`));
                  }

                  lines.push(`\n-------------------------------------------------------------`);
                  lines.push(`CURRICULUM MODULES & TOPICS`);
                  lines.push(`-------------------------------------------------------------`);

                  syllabus.forEach((mod, mIdx) => {
                    lines.push(`\nMODULE ${mIdx + 1}: ${mod.title}`);
                    if (mod.topics && mod.topics.length > 0) {
                      mod.topics.forEach((top: any, tIdx: number) => {
                        lines.push(`   ${mIdx + 1}.${tIdx + 1} ${top.title} [${top.isFree ? 'Free Preview' : `₹${top.price}`}] (${top.duration || 30} mins)`);
                        if (top.description) {
                          lines.push(`       Description: ${top.description}`);
                        }
                        if (top.lessons && top.lessons.length > 0) {
                          top.lessons.forEach((les: any, lIdx: number) => {
                            lines.push(`       - Lesson ${lIdx + 1}: ${les.title} (${les.duration || 15} mins)`);
                          });
                        }
                      });
                    } else {
                      lines.push(`   (No topics listed)`);
                    }
                  });

                  lines.push(`\n=============================================================`);
                  lines.push(`EduTech Learning Platform • Verified Certification Curriculum`);
                  lines.push(`=============================================================`);

                  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = targetFileName.endsWith('.pdf') ? targetFileName.replace('.pdf', '_Curriculum.txt') : `${crs.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Syllabus.txt`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Syllabus</span>
            </button>
            <Link
              to={`/course/${course.slug}`}
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>View Full Course</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
