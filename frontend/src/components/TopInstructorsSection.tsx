import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, UserPlus, Check, AlertCircle, UserCheck } from 'lucide-react';
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
  },
  {
    id: 'inst-4',
    name: 'Marcus Vance',
    title: 'Principal Security & Systems Architect',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop&crop=faces',
    bio: 'Cybersecurity consultant and architect helping startups and Fortune 500s harden enterprise infrastructure.',
    specialization: 'Cybersecurity',
    expertise: ['Network Security', 'Ethical Hacking', 'Cloud Security'],
    rating: 4.92,
    studentCount: '11.8k',
    courseCount: 4,
    isVerified: true
  },
  {
    id: 'inst-5',
    name: 'Elena Rostova',
    title: 'Staff Machine Learning Engineer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=300&fit=crop&crop=faces',
    bio: 'Deep learning practitioner with publications in computer vision and LLM optimization.',
    specialization: 'AI & Machine Learning',
    expertise: ['PyTorch', 'Computer Vision', 'Deep Learning', 'LLMs'],
    rating: 4.96,
    studentCount: '29.3k',
    courseCount: 6,
    isVerified: true
  }
];

export const TopInstructorsSection: React.FC = () => {
  const [instructors, setInstructors] = useState<CatalogInstructor[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    catalogApi
      .getInstructors({ limit: 5 })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInstructors(data);
        } else {
          setInstructors(FALLBACK_INSTRUCTORS);
        }
      })
      .catch((err) => {
        console.warn('Failed to load instructors, using fallback:', err);
        setInstructors(FALLBACK_INSTRUCTORS);
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

  const topInstructors = instructors.slice(0, 5);
  const gridColsClass = topInstructors.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5';

  return (
    <section className="py-10 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Top Instructors
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Learn from industry leaders working at premier technology organizations
          </p>
        </div>
        <Link
          to="/instructors"
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FA5A36] hover:text-[#E04322] transition-colors"
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
      {!isLoading && !error && topInstructors.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2">
          <UserCheck className="w-8 h-8 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-900">No instructors listed</h3>
          <p className="text-xs text-slate-500">Instructor profiles are currently being onboarded.</p>
        </div>
      )}

      {/* Instructors Grid / Mobile Carousel - Strictly top 4-5 dynamic profiles in 1 row */}
      {!isLoading && !error && topInstructors.length > 0 && (
        <>
          <div className={`flex overflow-x-auto sm:grid sm:grid-cols-2 ${gridColsClass} gap-4 sm:gap-5 pb-3 sm:pb-0 snap-x snap-mandatory scroll-smooth no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0`}>
            {topInstructors.map((instructor) => {
              const isFollowing = followingIds.includes(instructor.id);
              const avatarUrl = normalizeImageUrl(instructor.avatar);
              const studentNum = typeof instructor.studentCount === 'number' 
                ? instructor.studentCount 
                : parseInt(instructor.studentCount || '0', 10) || 0;
              const formattedStudents = studentNum >= 1000 
                ? `${(studentNum / 1000).toFixed(1).replace(/\.0$/, '')}K` 
                : `${studentNum}`;

              return (
                <div
                  key={instructor.id}
                  className="w-[72vw] max-w-[240px] sm:w-auto shrink-0 snap-center bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-[#FA5A36]/10 hover:-translate-y-1 transition-all duration-150 flex flex-col items-center text-center justify-between"
                >
                  <div className="flex flex-col items-center w-full">
                    {/* Avatar with gradient ring */}
                    <div className="relative mb-3">
                      <div className="w-18 h-18 rounded-full p-0.5 bg-gradient-to-tr from-[#FA5A36] via-[#FF8A65] to-[#FFAB91]">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={instructor.name}
                            className="w-full h-full rounded-full object-cover border-2 border-white"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center font-bold text-sm text-purple-700 border-2 border-white">
                            {instructor.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Name */}
                    <h3 className="text-sm font-semibold text-slate-900 leading-snug mb-0.5 truncate w-full">
                      {instructor.name}
                    </h3>

                    {/* Role & Company */}
                    <p className="text-xs text-slate-500 leading-tight mb-2 truncate w-full">
                      {instructor.title || 'Senior Instructor'}
                    </p>

                    {/* Course & Specialization */}
                    <div className="text-[11px] font-medium text-slate-600 mb-2">
                      <span>{instructor.courseCount > 0 ? `${instructor.courseCount} ${instructor.courseCount === 1 ? 'Course' : 'Courses'}` : '0 Courses'}</span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 mb-2.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-slate-900">
                        {instructor.rating > 0 ? instructor.rating.toFixed(1) : '5.0'}
                      </span>
                      <span className="text-slate-400">
                        ({formattedStudents})
                      </span>
                    </div>

                    {/* Verified Badge - Displayed for Super-Admin verified instructors */}
                    {instructor.isVerified && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-semibold mb-3 border border-blue-100">
                        <UserCheck className="w-3 h-3 text-blue-500" />
                        <span>Verified Instructor</span>
                      </div>
                    )}
                  </div>

                  {/* Follow Button */}
                  <button
                    type="button"
                    onClick={() => toggleFollow(instructor.id)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer ${
                      isFollowing
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-[#FFF5F2] hover:bg-[#FA5A36] text-[#FA5A36] hover:text-white border border-[#FFCCC2]'
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

          {/* Mobile Carousel Indicator Dots - Matching Image 2 */}
          <div className="sm:hidden flex items-center justify-center gap-1.5 pt-3">
            {[0, 1, 2, 3].map((dot) => (
              <span
                key={dot}
                className={`h-1.5 rounded-full transition-all ${
                  dot === 0 ? 'w-5 bg-[#FA5A36]' : 'w-1.5 bg-slate-300'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};
