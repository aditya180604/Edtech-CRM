import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Star,
  Clock,
  Users,
  TrendingUp,
  Layers,
  Award,
  BookOpen,
  Zap,
  Bookmark,
  GraduationCap,
  PlaySquare,
  UserCheck,
  Check,
  UserPlus,
  Video,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { coursesApi, type TopicItem } from '../../api/courses';
import { catalogApi, type CatalogStat, type CatalogInstructor, type CatalogLearningPath } from '../../api/catalog';
import { popularTopicsData } from '../../data/mockData';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useAuthModal } from '../../context/AuthModalContext';
import { SyllabusModal } from '../SyllabusModal';
import type { Course } from '../../types';

export const MobileHomeView: React.FC = () => {
  const navigate = useNavigate();
  const { openSignup } = useAuthModal();

  // Search & chips state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchWarning, setSearchWarning] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchKeywords = ['React', 'Python', 'Data Science', 'AI & ML', 'Cloud', 'UI/UX Design'];

  // Stats State
  const [stats, setStats] = useState<CatalogStat[]>([]);

  // Courses slider state
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [activeCourseIdx, setActiveCourseIdx] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [selectedSyllabusCourse, setSelectedSyllabusCourse] = useState<Course | null>(null);
  const coursesSliderRef = useRef<HTMLDivElement>(null);

  // Topics state
  const [topics, setTopics] = useState<TopicItem[]>([]);

  // Learning Paths state
  const [paths, setPaths] = useState<CatalogLearningPath[]>([]);

  // Instructors slider state
  const [instructors, setInstructors] = useState<CatalogInstructor[]>([]);
  const [instructorsLoading, setInstructorsLoading] = useState(true);
  const [activeInstructorIdx, setActiveInstructorIdx] = useState(0);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const instructorsSliderRef = useRef<HTMLDivElement>(null);

  // Load Data
  useEffect(() => {
    // 1. Stats
    catalogApi.getPublicStats().then((data) => {
      if (data && data.length > 0) setStats(data);
    }).catch(console.warn);

    // 2. Featured Courses
    coursesApi.getFeatured(6).then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setCourses(res.data);
      }
    }).catch(console.warn).finally(() => setCoursesLoading(false));

    // 3. Topics
    coursesApi.getTopics().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        setTopics(res.data.slice(0, 4));
      } else {
        setTopics(
          popularTopicsData.slice(0, 4).map((t) => ({
            id: t.id,
            _id: t.id,
            title: t.title,
            price: t.price,
            duration: 30,
            isFree: false,
            category: t.category,
            courseTitle: `${t.category} Masterclass`,
            courseSlug: t.slug,
            courseId: t.id,
            moduleTitle: 'Core Concepts',
            lessonsCount: 1,
            hasVideo: true,
          }))
        );
      }
    }).catch(console.warn);

    // 4. Learning Paths
    catalogApi.getLearningPaths({ limit: 2 }).then((data) => {
      const safePaths = Array.isArray(data) ? data : (data as any)?.learningPaths || [];
      setPaths(safePaths);
    }).catch(console.warn);

    // 5. Instructors
    catalogApi.getInstructors({ limit: 6 }).then((data) => {
      setInstructors(data);
    }).catch(console.warn).finally(() => setInstructorsLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) {
      setSearchWarning('Course not found or enter a valid field');
      return;
    }

    setIsSearching(true);
    setSearchWarning(null);

    try {
      const matchedCat = searchKeywords.find(
        (k) => k.toLowerCase() === query.toLowerCase()
      );

      const res = await coursesApi.getCatalog({
        category: matchedCat || undefined,
        search: matchedCat ? undefined : query,
        limit: 1,
      });

      if (res.success && res.data?.courses && res.data.courses.length > 0) {
        if (matchedCat) {
          navigate(`/courses?category=${encodeURIComponent(matchedCat)}`);
        } else {
          const courseCat = res.data.courses[0]?.category;
          if (courseCat && courseCat.toLowerCase() === query.toLowerCase()) {
            navigate(`/courses?category=${encodeURIComponent(courseCat)}`);
          } else {
            navigate(`/courses?search=${encodeURIComponent(query)}`);
          }
        }
      } else {
        setSearchWarning('Course not found or enter a valid field');
      }
    } catch (err) {
      console.warn('Mobile hero search error:', err);
      setSearchWarning('Course not found or enter a valid field');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChipClick = (keyword: string) => {
    navigate(`/courses?category=${encodeURIComponent(keyword)}`);
  };

  const toggleBookmark = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleFollow = (id: string) => {
    setFollowingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Scroll to course index
  const scrollCourseTo = (idx: number) => {
    if (coursesSliderRef.current) {
      const container = coursesSliderRef.current;
      const cardWidth = container.offsetWidth * 0.88;
      container.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
      setActiveCourseIdx(idx);
    }
  };

  // Handle course scroll event
  const handleCourseScroll = () => {
    if (coursesSliderRef.current) {
      const container = coursesSliderRef.current;
      const cardWidth = container.offsetWidth * 0.88;
      const currentIdx = Math.round(container.scrollLeft / cardWidth);
      if (currentIdx !== activeCourseIdx && currentIdx >= 0 && currentIdx < courses.length) {
        setActiveCourseIdx(currentIdx);
      }
    }
  };

  // Scroll to instructor index
  const scrollInstructorTo = (idx: number) => {
    if (instructorsSliderRef.current) {
      const container = instructorsSliderRef.current;
      const cardWidth = container.offsetWidth * 0.78;
      container.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
      setActiveInstructorIdx(idx);
    }
  };

  // Handle instructor scroll event
  const handleInstructorScroll = () => {
    if (instructorsSliderRef.current) {
      const container = instructorsSliderRef.current;
      const cardWidth = container.offsetWidth * 0.78;
      const currentIdx = Math.round(container.scrollLeft / cardWidth);
      if (currentIdx !== activeInstructorIdx && currentIdx >= 0 && currentIdx < instructors.length) {
        setActiveInstructorIdx(currentIdx);
      }
    }
  };

  // Map dynamic stats values
  const activeLearnersVal = stats.find((s) => s.label.toLowerCase().includes('learner'))?.value || '6';
  const coursesVal = stats.find((s) => s.label.toLowerCase().includes('course'))?.value || '4';
  const instructorsVal = stats.find((s) => s.label.toLowerCase().includes('instructor'))?.value || '5';
  const ratingVal =
    stats.find((s) => s.label.toLowerCase().includes('satisfaction') || s.label.toLowerCase().includes('rating'))
      ?.value || '4.0/5';

  return (
    <div className="w-full bg-[#FDFBF7] overflow-x-hidden selection:bg-[#FA5A36] selection:text-white">
      {/* =========================================================================
          1. HERO SECTION (Target: Image 3 for Mobile)
         ========================================================================= */}
      <section className="relative overflow-hidden w-full bg-gradient-to-b from-[#FFF5F1] via-[#FFF9F6] to-[#FFF5F2] pt-6 pb-8 px-4 sm:px-6">
        {/* Soft background ambient glow */}
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[#FA5A36]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 border border-[#FFCCC2] shadow-2xs mb-3.5 text-[11px] font-semibold text-[#FA5A36]">
            <span className="w-2 h-2 rounded-full bg-[#FA5A36] animate-pulse" />
            <span>Interactive Modular Learning</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-[1.18] mb-3">
            Learn Anything.<br />
            Buy What You Need.<br />
            <span className="text-[#FA5A36]">Learn at Your Own Pace.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm text-slate-600 mb-5 leading-relaxed max-w-md">
            Flexible, modular learning for real-world skills. Master bite-sized topics or upgrade to comprehensive certifications with expert instructors.
          </p>

          {/* Search Form matching Image 3: Input + Full-width Button below */}
          <form onSubmit={handleSearch} className="w-full space-y-2.5 mb-2.5">
            <div className="w-full bg-white px-3.5 py-3 rounded-2xl border border-slate-200 shadow-xs focus-within:border-[#FA5A36] focus-within:ring-2 focus-within:ring-[#FFF5F2] flex items-center gap-2.5">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (searchWarning) setSearchWarning(null);
                }}
                placeholder="What do you want to learn today?"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3.5 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] disabled:opacity-75 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl transition-all shadow-md shadow-[#FA5A36]/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Warning Message below Search Bar */}
          {searchWarning && (
            <div className="w-full -mt-1 mb-3 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-rose-600 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{searchWarning}</span>
            </div>
          )}

          {/* Popular Categories */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-6">
            <span className="text-xs font-medium text-slate-400 mr-1">Popular:</span>
            {searchKeywords.map((keyword) => (
              <button
                key={keyword}
                type="button"
                onClick={() => handleChipClick(keyword)}
                className="px-3 py-1 bg-white hover:bg-[#FFF5F2] hover:text-[#FA5A36] border border-slate-200 rounded-full text-[11px] font-medium text-slate-600 shadow-2xs cursor-pointer"
              >
                {keyword}
              </button>
            ))}
          </div>

          {/* ========================================================
              Right Content: Girl Cutout + Floating Elements
              (Watch Preview is REMOVED on mobile as requested!)
             ======================================================== */}
          <div className="relative w-full max-w-[320px] sm:max-w-[360px] mx-auto mt-2 flex items-center justify-center">
            {/* Peach Glow Circle */}
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-tr from-[#FFA585]/35 via-[#FFC5B2]/25 to-[#FFEADB]/20 blur-md pointer-events-none" />

            {/* Doodle "Build. Your Skills Your Way" on top left */}
            {/* Doodle "Build. Your Skills Your Way" on top left with Caveat font */}
            <div className="absolute -top-2 left-0 z-20 select-none pointer-events-none text-left -rotate-6">
              <svg className="w-5 h-5 text-[#FA5A36] mb-0 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="18" x2="2" y2="10" />
                <line x1="12" y1="16" x2="12" y2="6" />
                <line x1="19" y1="18" x2="22" y2="10" />
              </svg>
              <p
                style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                className="font-bold text-xl sm:text-2xl text-slate-900 leading-[0.95] tracking-tight"
              >
                Build.<br />
                <span className="block">Your Skills</span>
                <span className="block">Your Way</span>
              </p>
            </div>

            {/* Multiple Concentric Orange Curved Arc Accents to the left of the girl */}
            <svg
              className="absolute -left-3 top-[46%] -translate-y-1/2 w-12 h-24 text-[#FA5A36] pointer-events-none z-10 select-none"
              viewBox="0 0 70 140"
              fill="none"
            >
              <path
                d="M 62 10 C 22 45 18 95 60 130"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 48 24 C 16 52 12 88 46 116"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M 34 38 C 10 58 8 82 32 102"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>

            {/* Girl Cutout Image */}
            <img
              src="/Images/girl.png"
              alt="Student with laptop"
              className="relative z-10 w-[240px] sm:w-[280px] h-auto object-contain drop-shadow-xl select-none mx-auto"
            />

            {/* Note: Floating cards are removed completely on smaller screens as requested */}

            {/* Concentric Orange Arc Swooshes under the girl's feet */}
            <svg
              className="absolute -bottom-1 left-12 w-14 h-7 text-[#FA5A36] pointer-events-none z-10 select-none"
              viewBox="0 0 80 40"
              fill="none"
            >
              <path
                d="M 10 30 C 32 8 48 8 70 30"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 20 34 C 36 18 44 18 60 34"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. FEATURE PILLS (Image 3 Spec)
         ========================================================================= */}
      <section className="px-4 py-4 max-w-lg mx-auto space-y-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800">Learn from Industry Experts</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800">Buy Individual Topics</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800">Upgrade to Full Courses</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-slate-800">Get Recognized Certificates</span>
        </div>
      </section>

      {/* =========================================================================
          3. STATS BAR (Image 1 Fix: Comfortable padding, NO text cut off!)
         ========================================================================= */}
      <section className="px-4 py-3 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 grid grid-cols-2 gap-3.5">
          {/* Active Learners */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] border border-[#FFCCC2] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-[#FA5A36]" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-900 leading-tight">{activeLearnersVal}</p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight truncate">Active Learners</p>
            </div>
          </div>

          {/* Courses & Topics */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <PlaySquare className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-900 leading-tight">{coursesVal}</p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight truncate">Courses & Topics</p>
            </div>
          </div>

          {/* Expert Instructors */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-900 leading-tight">{instructorsVal}</p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight truncate">Expert Instructors</p>
            </div>
          </div>

          {/* Average Rating */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold text-slate-900 leading-tight">{ratingVal}</p>
              <p className="text-[10px] font-medium text-slate-500 leading-tight truncate">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURED COURSES SLIDER (Target: Image 2 & Image 4 Screen 1)
         ========================================================================= */}
      <section className="py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Featured Courses</h2>
            <p className="text-xs text-slate-500 mt-0.5">Top-rated courses handpicked by industry professionals</p>
          </div>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FA5A36] hover:text-[#E04322] shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Swipeable Interactive Carousel */}
        {coursesLoading ? (
          <div className="h-64 rounded-2xl bg-white border border-slate-100 animate-pulse" />
        ) : courses.length > 0 ? (
          <div>
            <div
              ref={coursesSliderRef}
              onScroll={handleCourseScroll}
              className="flex overflow-x-auto gap-3.5 snap-x snap-mandatory scroll-smooth pb-2 no-scrollbar"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {courses.map((course) => {
                const courseId = course.id || course.slug || course._id || '';
                const isBookmarked = bookmarkedIds.includes(courseId);

                return (
                  <div
                    key={courseId}
                    className="w-[84vw] max-w-[310px] shrink-0 snap-center bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 text-[10px] font-medium text-slate-700">
                        <Clock className="w-3 h-3 text-[#FA5A36] shrink-0" />
                        <span className="truncate">{course.schedule || 'Flexible Schedule'}</span>
                      </div>

                      {/* Thumbnail */}
                      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-900">
                        <img
                          src={
                            course.thumbnail ||
                            'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=800&q=80'
                          }
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 bg-slate-900/85 backdrop-blur-md text-white text-[9px] font-medium rounded-md uppercase tracking-wider">
                            {course.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(e, courseId)}
                          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-lg backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
                            isBookmarked ? 'bg-[#FA5A36] text-white shadow-xs' : 'bg-black/40 text-white'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Info Body */}
                      <div className="p-3.5 space-y-2">
                        <Link to={`/course/${course.slug || course._id || course.id}`}>
                          <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                            {course.title}
                          </h3>
                        </Link>

                        {/* Sessions Grid */}
                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-100 text-center">
                          <div className="p-1 rounded bg-slate-50">
                            <span className="text-[8px] text-slate-400 block uppercase">Sessions</span>
                            <span className="text-[10px] font-semibold text-slate-700">{course.totalSessions || 24}</span>
                          </div>
                          <div className="p-1 rounded bg-slate-50">
                            <span className="text-[8px] text-slate-400 block uppercase">Duration</span>
                            <span className="text-[10px] font-semibold text-slate-700">{course.courseIncludes?.videoHours?.split(' ')[0] || '20+ Hrs'}</span>
                          </div>
                          <div className="p-1 rounded bg-slate-50">
                            <span className="text-[8px] text-slate-400 block uppercase">Enrolled</span>
                            <span className="text-[10px] font-semibold text-slate-700">{course.enrolledCount || 'Active'}</span>
                          </div>
                        </div>

                        {/* Instructor & Rating */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-medium text-slate-600 truncate">{course.instructorName}</span>
                          <div className="flex items-center gap-1 text-[11px]">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-bold text-slate-900">{typeof course.rating === 'number' ? course.rating.toFixed(1) : '4.8'}</span>
                            <span className="text-slate-400 text-[10px]">({course.reviewCount || '12K'})</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Price & Action Row (Image 2 Spec) */}
                    <div className="px-3.5 py-2.5 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60">
                      <span className="text-sm font-bold text-slate-900">
                        {course.price === 0 ? 'FREE' : `₹${course.price?.toLocaleString('en-IN')}`}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedSyllabusCourse(course);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-medium text-[10px] rounded-lg shadow-2xs"
                        >
                          Syllabus
                        </button>
                        <Link
                          to={`/course/${course.slug || course._id || course.id}`}
                          className="px-3 py-1 bg-[#FA5A36] text-white font-semibold text-[11px] rounded-lg shadow-2xs flex items-center gap-1"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Dots (Working Interactive Slider Indicator) */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {courses.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollCourseTo(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeCourseIdx === idx ? 'w-5 bg-[#FA5A36]' : 'w-1.5 bg-slate-300'
                  }`}
                  aria-label={`Slide to course ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* =========================================================================
          5. POPULAR TOPICS (Target: Image 4 Screen 1)
         ========================================================================= */}
      <section className="py-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Popular Topics</h2>
            <p className="text-xs text-slate-500 mt-0.5">Learn specific skills. Buy only what you need.</p>
          </div>
          <Link
            to="/topics"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FA5A36] hover:text-[#E04322] shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {topics.map((topic, idx) => {
            const topicColors = [
              { bg: 'bg-cyan-500', text: 'text-cyan-600' },
              { bg: 'bg-amber-500', text: 'text-amber-600' },
              { bg: 'bg-purple-600', text: 'text-purple-600' },
              { bg: 'bg-rose-500', text: 'text-rose-600' },
            ];
            const color = topicColors[idx % topicColors.length];

            return (
              <Link
                key={topic.id || topic._id || idx}
                to={`/topics?search=${encodeURIComponent(topic.title)}`}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center text-white shrink-0 shadow-xs`}>
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-[#FA5A36] tracking-wider block truncate">
                      {topic.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight truncate">
                      {topic.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {topic.duration}m • {topic.lessonsCount || 1} Lessons
                    </span>
                  </div>
                </div>

                <div className="text-right pl-2 shrink-0">
                  <span className="text-xs font-bold text-slate-900 block">
                    {topic.isFree || topic.price === 0 ? 'FREE' : `₹${topic.price?.toLocaleString('en-IN')}`}
                  </span>
                  <span className="text-[10px] font-semibold text-[#FA5A36] bg-[#FFF5F2] px-2 py-0.5 rounded-md border border-[#FFCCC2] inline-block mt-0.5">
                    Buy Topic
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          6. LEARNING PATHS (Target: Smaller Screens)
         ========================================================================= */}
      <section className="py-5 px-4">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-[#FA5A36] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Layers className="w-3 h-3" />
              <span>Career Tracks</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Learning Paths</h2>
            <p className="text-xs text-slate-500 mt-0.5">Step-by-step career curriculum from beginner to pro</p>
          </div>
          <Link
            to="/learning-paths"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FA5A36] hover:text-[#E04322] shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Horizontal Swipeable Cards for Smooth Touch Interaction */}
        <div className="flex overflow-x-auto gap-3.5 snap-x snap-mandatory scroll-smooth pb-2 no-scrollbar -mx-4 px-4">
          {(Array.isArray(paths) && paths.length > 0 ? paths : []).map((path, idx) => {
            const gradients = [
              'from-slate-900 via-indigo-950 to-slate-900',
              'from-slate-900 via-slate-800 to-indigo-950',
              'from-slate-950 via-blue-950 to-slate-900',
            ];
            const gradient = gradients[idx % gradients.length];
            const courseNum = path.coursesCount || (path as any).domainsCount || '3';
            const durationText = (path as any).estimatedDuration || path.duration || 'Self-paced';

            return (
              <Link
                key={path.id || idx}
                to={path.slug ? `/learning-paths/${path.slug}` : `/learning-paths`}
                className="w-[82vw] max-w-[310px] shrink-0 snap-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Career Track Banner */}
                  <div className={`bg-gradient-to-r ${gradient} p-4 text-white relative`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400">
                        Career Track
                      </span>
                      <span className="px-2 py-0.5 bg-white/15 backdrop-blur-md text-white text-[9px] font-bold rounded-md uppercase tracking-wider">
                        {(path.level || 'Beginner').replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">
                      {path.career || path.title}
                    </h3>
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {path.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {path.description || 'Structured step-by-step curriculum to take you to job readiness.'}
                    </p>

                    {/* Skills pills if available */}
                    {Array.isArray(path.skills) && path.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {path.skills.slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer with Metadata & CTA */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Layers className="w-3.5 h-3.5 text-[#FA5A36]" />
                      <span>{courseNum.toString().includes('Course') ? courseNum : `${courseNum} Courses`}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{durationText}</span>
                    </span>
                  </div>

                  <span className="text-[#FA5A36] font-bold text-[11px] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Explore Track</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          7. TOP INSTRUCTORS SLIDER (Target: Image 4 Screen 2)
         ========================================================================= */}
      <section className="py-5 px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Top Instructors</h2>
            <p className="text-xs text-slate-500 mt-0.5">Learn from industry leaders working at premier technology organizations</p>
          </div>
          <Link
            to="/instructors"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#FA5A36] hover:text-[#E04322] shrink-0"
          >
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {instructorsLoading ? (
          <div className="h-44 rounded-2xl bg-white border border-slate-100 animate-pulse" />
        ) : instructors.length > 0 ? (
          <div>
            <div
              ref={instructorsSliderRef}
              onScroll={handleInstructorScroll}
              className="flex overflow-x-auto gap-3.5 snap-x snap-mandatory scroll-smooth pb-2 no-scrollbar"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {instructors.map((instructor) => {
                const isFollowing = followingIds.includes(instructor.id);
                const avatarUrl = normalizeImageUrl(instructor.avatar);

                return (
                  <div
                    key={instructor.id}
                    className="w-[72vw] max-w-[240px] shrink-0 snap-center bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col items-center text-center justify-between"
                  >
                    <div className="flex flex-col items-center w-full">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#FA5A36] via-[#FF8A65] to-[#FFAB91] mb-2.5">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={instructor.name}
                            className="w-full h-full rounded-full object-cover border-2 border-white"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-purple-100 flex items-center justify-center font-bold text-xs text-purple-700 border-2 border-white">
                            {instructor.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Name & Title */}
                      <h3 className="text-xs font-bold text-slate-900 leading-tight mb-0.5 truncate w-full">
                        {instructor.name}
                      </h3>
                      <p className="text-[10px] text-slate-500 leading-tight mb-2 truncate w-full">
                        {instructor.title || 'Senior Instructor'}
                      </p>

                      {/* Stats */}
                      <div className="text-[10px] font-medium text-slate-600 mb-1.5">
                        <span>{instructor.courseCount || 8}+ Courses</span>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1 text-[11px] mb-2.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-900">{instructor.rating > 0 ? instructor.rating.toFixed(1) : '4.8'}</span>
                        <span className="text-slate-400 text-[10px]">({instructor.studentCount || '2.1K'})</span>
                      </div>

                      {/* Verified Badge */}
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-semibold mb-3 border border-blue-100">
                        <UserCheck className="w-3 h-3 text-blue-500" />
                        <span>Verified Instructor</span>
                      </div>
                    </div>

                    {/* Follow Action */}
                    <button
                      type="button"
                      onClick={() => toggleFollow(instructor.id)}
                      className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isFollowing
                          ? 'bg-slate-100 text-slate-700'
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

            {/* Pagination Dots */}
            <div className="flex items-center justify-center gap-1.5 pt-3">
              {instructors.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollInstructorTo(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeInstructorIdx === idx ? 'w-5 bg-[#FA5A36]' : 'w-1.5 bg-slate-300'
                  }`}
                  aria-label={`Slide to instructor ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* =========================================================================
          8. CTA BANNER (Target: Image 4 Screen 2)
         ========================================================================= */}
      <section className="py-6 px-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0A0E1A] text-white p-5 shadow-xl border border-slate-800">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-tight">
                Ready to Start Your <br />
                <span className="text-[#FF8A65]">Learning Journey?</span>
              </h2>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FA5A36] shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <p className="text-slate-300 text-xs mb-4 leading-relaxed">
            Join thousands of learners and gain the industry skills you need to build a better future.
          </p>

          <button
            type="button"
            onClick={openSignup}
            className="w-full py-3 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#FA5A36]/30 flex items-center justify-center gap-2 cursor-pointer mb-4"
          >
            <span>Create Your Free Account</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* 3 Benefit Pills */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">100% Online Learning</p>
                <p className="text-[10px] text-slate-300">Learn from anywhere, anytime</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Flexible Learning</p>
                <p className="text-[10px] text-slate-300">Study at your own pace & schedule</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-2.5 rounded-xl border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Verified Certificate</p>
                <p className="text-[10px] text-slate-300">Showcase your skills to future employers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Syllabus Modal */}
      {selectedSyllabusCourse && (
        <SyllabusModal
          course={selectedSyllabusCourse}
          onClose={() => setSelectedSyllabusCourse(null)}
        />
      )}
    </div>
  );
};
