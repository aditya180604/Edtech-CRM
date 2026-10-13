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

const FALLBACK_INSTRUCTORS: CatalogInstructor[] = [
  {
    id: 'inst-1',
    name: 'Sarah Drasner',
    title: 'VP of Engineering & Design Systems Expert',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=faces',
    bio: 'Award-winning engineering leader specializing in design systems, SVG animations, and modern frontend architecture at scale.',
    specialization: 'Design Systems',
    expertise: ['UI/UX', 'Figma', 'Frontend', 'Design Systems'],
    rating: 4.9,
    studentCount: '18.4k',
    courseCount: 4,
    isVerified: true
  },
  {
    id: 'inst-2',
    name: 'Alexandre Xu',
    title: 'Lead Cloud Solutions Architect',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=faces',
    bio: 'Cloud architecture specialist with 12+ years deploying enterprise-scale distributed systems across AWS and GCP.',
    specialization: 'Cloud & DevOps',
    expertise: ['AWS', 'Kubernetes', 'Docker', 'Microservices'],
    rating: 4.95,
    studentCount: '24.1k',
    courseCount: 5,
    isVerified: true
  },
  {
    id: 'inst-3',
    name: 'Priya Sundaram',
    title: 'Senior Full Stack & AI Engineer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=300&fit=crop&crop=faces',
    bio: 'Passionate software educator teaching modern React, Node.js, and GenAI workflows to thousands worldwide.',
    specialization: 'Full Stack',
    expertise: ['React', 'Node.js', 'Next.js', 'PostgreSQL'],
    rating: 4.88,
    studentCount: '15.6k',
    courseCount: 3,
    isVerified: true
  }
];

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
        if (Array.isArray(data) && data.length > 0) {
          setInstructors(data);
        } else {
          setInstructors(FALLBACK_INSTRUCTORS);
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic instructors, using fallback:', err);
        setInstructors(FALLBACK_INSTRUCTORS);
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
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Page Header Banner */}
        <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle decorative background gradient circles */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br from-[#FFF5F2] to-[#FFCCC2]/30 blur-2xl pointer-events-none" />
          <div className="absolute right-40 -bottom-20 w-60 h-60 rounded-full bg-slate-50 blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-2 max-w-2xl">
            <span className="px-3 py-1 bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-semibold rounded-lg uppercase tracking-wider inline-block">
              Expert Mentors
            </span>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Learn from Industry Experts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Explore experienced engineering leads, data scientists, and cloud architects who build comprehensive, real-world learning curriculums.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-slate-50/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
              <p className="text-2xl font-bold text-slate-900">{instructors.length}</p>
              <p className="text-[11px] font-semibold text-slate-500">Active Instructors</p>
            </div>
            <div className="bg-slate-50/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/80 text-center shadow-2xs">
              <p className="text-2xl font-bold text-[#FA5A36]">
                {instructors.reduce((acc, curr) => acc + (curr.courseCount || 0), 0)}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">Published Courses</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by instructor name, domain, or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 text-xs sm:text-sm text-slate-800 rounded-xl border border-slate-200/80 focus:outline-none focus:border-[#FA5A36] focus:bg-white transition-all"
            />
          </div>

          {/* Quick Domain Tags */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpecialization(spec)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedSpecialization === spec
                    ? 'bg-[#FA5A36] text-white shadow-xs shadow-[#FA5A36]/20'
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
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200/80 animate-pulse space-y-4">
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
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 max-w-lg mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-[#FFF5F2] text-[#FA5A36] rounded-2xl flex items-center justify-center mx-auto">
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
              className="text-xs font-bold text-[#FA5A36] hover:underline cursor-pointer"
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
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-[#FFCCC2] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-5 group"
                >
                  <div>
                    {/* Top Row: Avatar & Verified Info */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl p-0.5 bg-[#FFF5F2] border border-[#FFCCC2]">
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
                            <div className="w-full h-full rounded-2xl bg-[#FA5A36] flex items-center justify-center font-bold text-white text-base border-2 border-white">
                              {initials}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 truncate">
                            {instructor.name}
                          </h3>
                          {instructor.isVerified && (
                            <span title="Verified Instructor" className="inline-flex items-center">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-[#FA5A36] truncate mt-0.5">
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
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-lg"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Instructor Courses Taught Preview */}
                    {instructor.courses && instructor.courses.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 space-y-2 mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Popular Courses
                        </span>
                        <div className="space-y-1.5">
                          {instructor.courses.slice(0, 2).map((c) => (
                            <Link
                              key={c.id}
                              to={`/course/${c.slug}`}
                              className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 hover:bg-[#FFF5F2] text-xs font-semibold text-slate-800 hover:text-[#FA5A36] transition-colors group/c"
                            >
                              <span className="truncate">{c.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover/c:text-[#FA5A36] shrink-0" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <BookOpen className="w-3.5 h-3.5 text-[#FA5A36]" />
                        <span>{instructor.courseCount} {instructor.courseCount === 1 ? 'Course' : 'Courses'}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{instructor.studentCount || 0} Students</span>
                      </div>

                      {instructor.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{instructor.rating.toFixed(1)}</span>
                        </div>
                      )}
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
