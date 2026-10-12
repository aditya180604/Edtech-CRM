import React, { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Clock,
  Users,
  Layers,
  Award,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../api/catalog';

export const HeroSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [popularKeywords, setPopularKeywords] = useState<string[]>([
    'React',
    'Python',
    'Data Science',
    'AI & ML',
    'Cloud',
    'UI/UX Design',
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    catalogApi
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          const dynamicNames = cats.slice(0, 6).map((c) => c.name);
          setPopularKeywords(dynamicNames);
        }
      })
      .catch((err) => {
        console.warn('Failed to load dynamic categories for hero:', err);
      });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleChipClick = (keyword: string) => {
    navigate(`/courses?category=${encodeURIComponent(keyword)}`);
  };

  return (
    <section className="relative overflow-hidden w-full bg-gradient-to-b from-[#FFF5F1] via-[#FFF9F6] to-[#FFF5F2] pt-6 pb-12 sm:pt-12 sm:pb-16 lg:pt-14 lg:pb-20">
      {/* Soft Ambient Warm Glows */}
      <div className="absolute -top-32 -left-20 w-[450px] h-[450px] rounded-full bg-[#FA5A36]/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-10 right-0 w-[500px] h-[500px] rounded-full bg-[#FA5A36]/8 blur-[110px] pointer-events-none" />

      {/* Main Hero Container */}
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-8 xl:gap-14 items-center">
          
          {/* ========================================================
              LEFT COLUMN: Tag, Main Headlines, Search, Popular Tags
             ======================================================== */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Live Interactive Tag */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/90 border border-[#FFCCC2] shadow-2xs mb-3 sm:mb-5 text-[11px] sm:text-xs font-semibold text-[#FA5A36] backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-[#FA5A36] animate-pulse" />
              <span>Interactive Modular Learning</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[50px] xl:text-[56px] font-extrabold tracking-tight text-slate-900 leading-[1.15] mb-3 sm:mb-4">
              Learn Anything.<br />
              Buy What You Need.<br />
              <span className="text-[#FA5A36]">Learn at Your Own Pace.</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-xs sm:text-base lg:text-lg text-slate-600 max-w-xl mb-5 sm:mb-7 leading-relaxed font-normal">
              Flexible, modular learning for real-world skills. Master bite-sized topics or upgrade to comprehensive certifications with expert instructors.
            </p>

            {/* Search Bar: Clean mobile layout matching Image 3 & Image 4 */}
            <form
              onSubmit={handleSearch}
              className="w-full max-w-xl flex flex-col sm:flex-row gap-2.5 mb-4 sm:mb-5"
            >
              <div className="flex-1 bg-white p-3 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-sm focus-within:border-[#FA5A36] focus-within:ring-2 focus-within:ring-[#FFF5F2] flex items-center gap-2.5 transition-all">
                <Search className="w-5 h-5 text-slate-400 pl-0.5 shrink-0" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="What do you want to learn today?"
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-3 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] text-white font-semibold text-sm sm:text-base rounded-2xl sm:rounded-xl transition-all shadow-md shadow-[#FA5A36]/25 shrink-0 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
              >
                <span>Search</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Popular Category Chips (Dynamic) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-0.5 sm:pt-1">
              <span className="text-xs font-medium text-slate-400 mr-1">Popular:</span>
              {popularKeywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => handleChipClick(keyword)}
                  className="px-3 sm:px-3.5 py-1.5 bg-white hover:bg-[#FFF5F2] hover:text-[#FA5A36] hover:border-[#FFCCC2] border border-slate-200/90 rounded-full text-[11px] sm:text-xs font-medium text-slate-600 transition-all shadow-2xs cursor-pointer hover:scale-105"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================
              RIGHT COLUMN: Girl Image, Organic Glow & Floating Badges
              (On smaller screens: Watch Preview card is REMOVED!)
             ======================================================== */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center pt-6 sm:pt-8 lg:pt-0">
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[500px] flex items-center justify-center mx-auto">
              
              {/* Soft Organic Coral Arc Shape behind the Girl (Matching Image 3) */}
              <div className="absolute -right-6 sm:-right-12 top-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] lg:w-[520px] lg:h-[520px] rounded-full bg-gradient-to-tr from-[#FFD0C0]/75 via-[#FFEAE1]/70 to-[#FFF7F4]/45 pointer-events-none -z-0" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[360px] sm:h-[360px] lg:w-[440px] lg:h-[440px] rounded-full bg-[#FA5A36]/10 blur-3xl pointer-events-none -z-0" />
              <svg className="absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] lg:w-[500px] lg:h-[500px] text-[#FA5A36]/20 pointer-events-none -z-0" viewBox="0 0 400 400" fill="none">
                <circle cx="200" cy="200" r="185" stroke="currentColor" strokeWidth="2" strokeDasharray="6 6" />
              </svg>

              {/* Doodle: "Build. Your Skills Your Way" + 3 Radiant Sparks (Matching Image 3 Font & Style) */}
              <div className="absolute -top-3 sm:-top-1 left-0 sm:left-1 lg:-left-3 z-20 select-none pointer-events-none text-left -rotate-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#FA5A36] mb-0 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="18" x2="2" y2="10" />
                  <line x1="12" y1="16" x2="12" y2="6" />
                  <line x1="19" y1="18" x2="22" y2="10" />
                </svg>
                <p
                  style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
                  className="font-bold text-2xl sm:text-[28px] lg:text-[32px] text-slate-900 leading-[0.95] tracking-tight"
                >
                  Build.<br />
                  <span className="block">Your Skills</span>
                  <span className="block">Your Way</span>
                </p>
              </div>

              {/* Multiple Concentric Orange Curved Arcs to the left of the girl (Matching Image 3) */}
              <svg
                className="absolute -left-6 sm:-left-8 top-[52%] -translate-y-1/2 w-16 h-32 sm:w-20 sm:h-40 text-[#FA5A36] pointer-events-none z-10 select-none"
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

              {/* Decorative Purple Dotted Curved Accent on top right (Matching Image 3) */}
              <svg
                className="absolute top-8 sm:top-12 right-0 sm:-right-4 w-12 h-14 text-purple-400/80 pointer-events-none z-10 select-none"
                viewBox="0 0 50 60"
                fill="none"
              >
                <path
                  d="M 8 48 C 22 42 35 25 28 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  strokeLinecap="round"
                />
                <path
                  d="M 23 12 L 28 8 L 34 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {/* Girl Transparent Cutout Image */}
              <img
                src="/Images/girl.png"
                alt="Student learning with laptop"
                className="relative z-10 w-[240px] sm:w-[320px] lg:w-[400px] xl:w-[440px] h-auto object-contain drop-shadow-2xl select-none mx-auto"
              />

              {/* 3 Separate Floating Subcards on the Left: moved down to girl's leg side, hidden on smaller screens */}
              <div className="hidden lg:flex absolute top-[54%] -translate-y-1/2 -left-6 xl:-left-12 z-30 select-none flex-col gap-2 sm:gap-2.5 items-start">
                {/* Card 1: Learn In-Demand Skills with 3-Bar Chart Icon */}
                <div
                  onClick={() => navigate('/courses')}
                  className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-md shadow-slate-200/50 border border-slate-100/90 flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105 duration-200 cursor-pointer w-fit"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FFF9EB] text-[#F59E0B] border border-[#FEF3C7] flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F59E0B]" viewBox="0 0 20 20" fill="currentColor">
                      <rect x="3" y="10" width="3" height="7" rx="1.5" />
                      <rect x="8.5" y="6" width="3" height="11" rx="1.5" />
                      <rect x="14" y="3" width="3" height="14" rx="1.5" />
                    </svg>
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[9px] sm:text-[10px] font-semibold text-slate-500">Learn</span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-tight">In-Demand Skills</span>
                  </div>
                </div>

                {/* Card 2: Flexible Learning with Soft Blue Clock */}
                <div
                  onClick={() => navigate('/topics')}
                  className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-md shadow-slate-200/50 border border-slate-100/90 flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105 duration-200 cursor-pointer w-fit"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#F0F7FF] text-[#0284C7] border border-[#E0F2FE] flex items-center justify-center shrink-0">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0284C7]" />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-tight">Flexible Learning</span>
                  </div>
                </div>

                {/* Card 3: Expert Instructors with Soft Purple Users */}
                <div
                  onClick={() => navigate('/instructors')}
                  className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-md shadow-slate-200/50 border border-slate-100/90 flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105 duration-200 cursor-pointer w-fit"
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#EDE9FE] flex items-center justify-center shrink-0">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7C3AED]" />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-tight">Expert Instructors</span>
                  </div>
                </div>
              </div>

              {/* Floating Badge 3: Bottom-Right Certificate Pill: hidden on smaller screens */}
              <div className="hidden lg:block absolute bottom-2 sm:bottom-4 right-0 lg:-right-4 z-30 select-none">
                <div
                  className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-2.5 sm:px-3 py-1.5 shadow-md shadow-slate-200/50 border border-slate-100/90 flex items-center gap-2 sm:gap-2.5 transition-transform hover:scale-105 duration-200 cursor-pointer"
                  onClick={() => navigate('/learning-paths')}
                >
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#ECFDF5] text-[#10B981] border border-[#D1FAE5] flex items-center justify-center shrink-0">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#10B981]" />
                  </div>
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">Graduate with a</span>
                    <span className="text-[11px] sm:text-xs font-bold text-slate-900 tracking-tight">Certificate</span>
                  </div>
                </div>
              </div>

              {/* Concentric Orange Arc Swooshes under the girl's feet (Matching Image 3) */}
              <svg
                className="absolute -bottom-1 sm:bottom-0 left-16 sm:left-24 w-20 h-10 text-[#FA5A36] pointer-events-none z-10 select-none"
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
        </div>

        {/* ========================================================
            4 FEATURE HIGHLIGHT CARDS (Matching Image 2)
           ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 pt-8 sm:pt-10">
          <div
            onClick={() => navigate('/instructors')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-[#FFCCC2] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              Learn from Industry Experts
            </span>
          </div>

          <div
            onClick={() => navigate('/topics')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-[#FFCCC2] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              Buy Individual Topics
            </span>
          </div>

          <div
            onClick={() => navigate('/courses')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-[#FFCCC2] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              Upgrade to Full Courses
            </span>
          </div>

          <div
            onClick={() => navigate('/learning-paths')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-[#FFCCC2] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
              Get Recognized Certificates
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
