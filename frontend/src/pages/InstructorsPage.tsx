import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  Star,
  Search,
  BookOpen,
  Users,
  ShieldCheck,
  UserPlus,
  Check,
  ArrowRight,
  MapPin,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { catalogApi, type CatalogInstructor } from '../api/catalog';
import { normalizeImageUrl } from '../utils/imageUrl';

export const InstructorsPage: React.FC = () => {
  const navigate = useNavigate();
  const [instructors, setInstructors] = useState<CatalogInstructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All');
  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('followed_instructors');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getInstructors({ limit: 50 })
      .then((data) => {
        setInstructors(data || []);
      })
      .catch((err) => {
        console.error('Failed to load instructors from MongoDB:', err);
        setError('Unable to load instructors list from the server.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const toggleFollow = (id: string) => {
    setFollowingIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('followed_instructors', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Derive all unique specializations from dynamic instructor data
  const specializations = useMemo(() => {
    const specs = new Set<string>();
    instructors.forEach((inst) => {
      if (inst.specialization) specs.add(inst.specialization);
      if (Array.isArray(inst.expertise)) {
        inst.expertise.forEach((e) => specs.add(e));
      }
    });
    return ['All', ...Array.from(specs).slice(0, 6)];
  }, [instructors]);

  // Filter instructors by search query & specialization
  const filteredInstructors = useMemo(() => {
    return instructors.filter((inst) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        (inst.title && inst.title.toLowerCase().includes(q)) ||
        (inst.bio && inst.bio.toLowerCase().includes(q)) ||
        (inst.specialization && inst.specialization.toLowerCase().includes(q)) ||
        (Array.isArray(inst.expertise) && inst.expertise.some((e) => e.toLowerCase().includes(q)));

      const matchesSpec =
        selectedSpecialization === 'All' ||
        inst.specialization?.toLowerCase() === selectedSpecialization.toLowerCase() ||
        (Array.isArray(inst.expertise) &&
          inst.expertise.some((e) => e.toLowerCase() === selectedSpecialization.toLowerCase()));

      return matchesSearch && matchesSpec;
    });
  }, [instructors, searchQuery, selectedSpecialization]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        {/* Page Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 rounded-3xl shadow-xl shadow-slate-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider inline-block">
              Expert Mentors
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Learn from Industry Experts
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore experienced engineering leads, data scientists, and cloud architects who build comprehensive, real-world learning curriculums.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-2xl font-black text-white">{instructors.length}</p>
              <p className="text-[11px] font-semibold text-indigo-200">Active Instructors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-center">
              <p className="text-2xl font-black text-white">
                {instructors.reduce((acc, curr) => acc + (curr.courseCount || 0), 0)}
              </p>
              <p className="text-[11px] font-semibold text-indigo-200">Published Courses</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by instructor name, domain, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Domain Tags */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedSpecialization === spec
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-100 animate-pulse space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-12 bg-slate-100 rounded-xl" />
                <div className="h-9 bg-slate-200 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white rounded-3xl p-12 text-center border border-red-100 max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Failed to load instructors</h3>
            <p className="text-xs text-slate-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredInstructors.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 max-w-lg mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Instructors Found</h3>
            <p className="text-xs text-slate-500">
              No registered instructors match your selected search or domain filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialization('All');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Instructors Card Grid */}
        {!isLoading && !error && filteredInstructors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInstructors.map((instructor) => {
              const isFollowing = followingIds.includes(instructor.id);
              const avatarUrl = normalizeImageUrl(instructor.avatar);
              const initials = instructor.name
                .split(' ')
                .map((w) => w[0])
                .filter(Boolean)
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'IN';

              return (
                <div
                  key={instructor.id}
                  className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between gap-5 group"
                >
                  <div>
                    {/* Top Row: Avatar & Verified Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        <div className="w-18 h-18 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/15">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={instructor.name}
                              className="w-full h-full rounded-2xl object-cover bg-slate-900 border-2 border-white"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full rounded-2xl bg-indigo-950 flex items-center justify-center font-black text-indigo-300 text-lg border-2 border-white">
                              {initials}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-extrabold text-slate-900 truncate">
                            {instructor.name}
                          </h3>
                          <span title="Verified Instructor" className="inline-flex items-center">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                          </span>
                        </div>

                        <p className="text-xs font-semibold text-indigo-600 truncate mt-0.5">
                          {instructor.title}
                        </p>

                        {instructor.country && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{instructor.country}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">
                      {instructor.bio}
                    </p>

                    {/* Expertise & Skills Badges */}
                    {instructor.expertise && instructor.expertise.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {instructor.expertise.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Instructor Courses Taught Preview */}
                    {instructor.courses && instructor.courses.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2 mb-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                          Popular Courses
                        </span>
                        <div className="space-y-1.5">
                          {instructor.courses.slice(0, 2).map((c) => (
                            <Link
                              key={c.id}
                              to={`/course/${c.slug}`}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-indigo-50/70 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition-colors group/c"
                            >
                              <span className="truncate">{c.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover/c:text-indigo-600 shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Actions */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{instructor.courseCount} {instructor.courseCount === 1 ? 'Course' : 'Courses'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{instructor.studentCount || 0} Students</span>
                      </div>

                      {instructor.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 font-black">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{instructor.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFollow(instructor.id)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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

                      <button
                        type="button"
                        onClick={() => navigate(`/courses?search=${encodeURIComponent(instructor.name)}`)}
                        className="p-2 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-xl transition-colors cursor-pointer"
                        title="View All Courses by Instructor"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
