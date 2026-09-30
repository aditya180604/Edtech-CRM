import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, UserPlus, Check, AlertCircle, UserCheck } from 'lucide-react';
import { catalogApi, type CatalogInstructor } from '../api/catalog';


export const TopInstructorsSection: React.FC = () => {
  const [instructors, setInstructors] = useState<CatalogInstructor[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getInstructors({ limit: 10 })
      .then((data) => {
        setInstructors(data);
      })
      .catch((err) => {
        console.error('Failed to load instructors:', err);
        setError('Unable to load instructors.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleFollow = (id: string) => {
    setFollowingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Top Instructors
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Learn from industry leaders working at premier technology organizations
          </p>
        </div>
        <Link
          to="/instructors"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-slate-100 animate-pulse flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-200" />
              <div className="h-4 bg-slate-200 rounded w-24" />
              <div className="h-3 bg-slate-100 rounded w-20" />
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 text-center text-xs text-rose-700">
          <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
          {error}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && instructors.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
          <UserCheck className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No instructors listed</h3>
          <p className="text-xs text-slate-500">Instructor profiles are currently being onboarded.</p>
        </div>
      )}

      {/* Instructors Grid */}
      {!isLoading && !error && instructors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5">
          {instructors.map((instructor) => {
            const isFollowing = followingIds.includes(instructor.id);

            return (
              <div
                key={instructor.id}
                className="bg-white rounded-2xl p-4.5 border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-150 flex flex-col items-center text-center justify-between"
              >
                <div className="flex flex-col items-center w-full">
                  {/* Avatar with gradient ring */}
                  <div className="relative mb-3">
                    <div className="w-18 h-18 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
                      {instructor.avatar ? (
                        <img
                          src={instructor.avatar}
                          alt={instructor.name}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center font-bold text-indigo-600 border-2 border-white">
                          {instructor.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-0.5 truncate w-full">
                    {instructor.name}
                  </h3>

                  {/* Role & Company */}
                  <p className="text-xs text-slate-500 leading-tight mb-2.5 truncate w-full">
                    {instructor.title}
                  </p>

                  {/* Course & Student Stats */}
                  <div className="text-[11px] font-medium text-slate-600 mb-1.5">
                    <span>{instructor.courseCount} Course{instructor.courseCount === 1 ? '' : 's'}</span>
                    <span className="mx-1 text-slate-300">|</span>
                    <span>{instructor.specialization}</span>
                  </div>

                  {/* Rating or Verified Badge */}
                  {instructor.rating > 0 ? (
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-900">{instructor.rating.toFixed(1)}</span>
                      <span>({instructor.studentCount} students)</span>
                    </div>
                  ) : (
                    <div className="text-[11px] font-medium text-indigo-600 mb-3">
                      {instructor.studentCount ? `${instructor.studentCount} students` : 'Verified Instructor'}
                    </div>
                  )}
                </div>

                {/* Follow Button */}
                <button
                  type="button"
                  onClick={() => toggleFollow(instructor.id)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
                    isFollowing
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
