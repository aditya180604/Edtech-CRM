import React from 'react';
import {
  X,
  Clock,
  BookOpen,
  Video,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Layers,
  GraduationCap,
  PlayCircle,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TopicItem } from '../api/courses';

interface TopicDetailModalProps {
  topic: TopicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (topic: TopicItem) => void;
}

export const TopicDetailModal: React.FC<TopicDetailModalProps> = ({
  topic,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !topic) return null;

  const displayPrice =
    topic.isFree || topic.price === 0
      ? 'FREE'
      : `₹${Number(topic.price).toLocaleString('en-IN')}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      aria-labelledby="topic-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden z-10 my-8 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-[#FA5A36] text-white text-[11px] font-bold uppercase tracking-wider shadow-xs">
              {topic.category || 'TOPIC'}
            </span>
            {topic.difficulty && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-slate-200 text-xs font-medium">
                {topic.difficulty}
              </span>
            )}
            {topic.isFree && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
                Free Preview
              </span>
            )}
          </div>

          <h2
            id="topic-modal-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug pr-8"
          >
            {topic.title}
          </h2>

          {/* Associated Course or Module info */}
          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300 mt-2 font-normal">
            {topic.courseTitle && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#FA5A36]" />
                <span>Course:</span>
                <span className="text-white font-medium">{topic.courseTitle}</span>
              </span>
            )}
            {topic.moduleTitle && (
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Module:</span>
                <span className="text-white font-medium">{topic.moduleTitle}</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FA5A36] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Duration</p>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {topic.duration ? `${topic.duration} mins` : 'Self-paced'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Lessons</p>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {topic.lessonsCount || (topic.lessons ? topic.lessons.length : 1)} Lessons
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Format</p>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {topic.hasVideo ? 'Video + Lab' : 'Interactive Lesson'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-400 font-medium">Credit</p>
                <p className="text-xs font-semibold text-slate-800 truncate">
                  Course Eligible
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Topic Overview
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              {topic.description ||
                'This dynamic topic offers modular, focused mastery designed for immediate practical application. Learn this core atomic skill independently and apply what you study right away.'}
            </p>
          </div>

          {/* Skills Covered */}
          {topic.skills && topic.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Skills You Will Learn
              </h4>
              <div className="flex flex-wrap gap-2">
                {topic.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] rounded-xl text-xs font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          {topic.learningObjectives && topic.learningObjectives.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Key Objectives
              </h4>
              <div className="space-y-2">
                {topic.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Included Lessons List */}
          {topic.lessons && topic.lessons.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Included Lessons ({topic.lessons.length})
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
                {topic.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id || idx}
                    className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <PlayCircle className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {idx + 1}. {lesson.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {lesson.isFreePreview && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-semibold text-[10px]">
                          Preview
                        </span>
                      )}
                      <span className="text-slate-400 font-normal">
                        {lesson.duration}m
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisites */}
          {topic.prerequisites && topic.prerequisites.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Prerequisites
              </h4>
              <p className="text-xs text-slate-500">
                {topic.prerequisites.join(', ')}
              </p>
            </div>
          )}

          {/* Instructor Mention */}
          {topic.instructor && topic.instructor.name && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#FA5A36] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {topic.instructor.avatar ? (
                    <img
                      src={topic.instructor.avatar}
                      alt={topic.instructor.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    topic.instructor.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-slate-400 font-medium">Instructor</p>
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {topic.instructor.name}
                  </p>
                </div>
              </div>

              {topic.courseSlug && (
                <Link
                  to={`/courses/${topic.courseSlug}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#FA5A36] hover:text-[#E04322] shrink-0"
                  onClick={onClose}
                >
                  <span>Full Course</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-medium text-slate-400 block">
              Topic Purchase Price
            </span>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {displayPrice}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer text-center"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onAddToCart(topic)}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-semibold shadow-md shadow-[#FA5A36]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy Topic</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
