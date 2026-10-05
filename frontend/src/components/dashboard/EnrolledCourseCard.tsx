import React from 'react';
import type { ActiveEnrolledCourse } from '../../types/studentDashboard';
import { BookOpen, Play, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EnrolledCourseCardProps {
  course: ActiveEnrolledCourse;
}

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({ course }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                {course.isFullCourseEnrolled ? 'Full Course Access' : 'Topic-Based Access'}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {course.enrolledTopicsCount} of {course.totalCourseTopicsCount} topics owned
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {course.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Instructor: {course.instructorName}
            </p>
          </div>
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Progress Bar & Subtext */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700">Enrolled Learning Progress</span>
            <span className="text-indigo-600 font-extrabold">{course.entitledProgressPercentage}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, course.entitledProgressPercentage))}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {course.entitledProgressPercentage}% of your purchased learning completed
          </p>
        </div>
      </div>

      {/* Next Lesson or Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        {course.lastAccessedLesson ? (
          <div className="flex items-center gap-2 text-xs text-slate-600 truncate flex-1">
            <Play className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate font-medium">Next: {course.lastAccessedLesson.title}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Ready to start</span>
          </div>
        )}

        <button
          onClick={() => navigate(`/course/${course.slug}`)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
