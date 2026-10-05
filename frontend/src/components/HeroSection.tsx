import React, { useState } from 'react';
import { Search, Sparkles, UserCheck, Video, Award, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const searchKeywords = ['React', 'Python', 'Data Science', 'AI & ML', 'Cloud', 'UI/UX Design'];

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
    <section className="relative overflow-hidden pt-4 pb-8 lg:pt-6 lg:pb-12 bg-white">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Card Container */}
        <div className="relative rounded-[28px] lg:rounded-[36px] overflow-hidden shadow-xl shadow-slate-200/50 border border-slate-100 min-h-[520px] lg:min-h-[580px] flex items-center bg-slate-900">
          {/* Panoramic Banner Image */}
          <img
            src="/Images/Banner.png"
            alt="EduTech Hero Landscape"
            className="absolute inset-0 w-full h-full object-cover object-right md:object-center pointer-events-none select-none z-0"
          />

          {/* Left subtle soft light overlay so text is crisp on any screen */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-transparent lg:from-white/90 lg:via-white/30 lg:to-transparent z-1 pointer-events-none" />

          {/* Hero Content Grid */}
          <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-10 lg:p-12">
            {/* Left Column: Heading, Search & Chips */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Tag Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-indigo-100 shadow-xs mb-4 text-xs font-bold text-indigo-700">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Learn • Grow • Build Your Future</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tight text-slate-900 leading-[1.12] mb-4">
                Learn Skills <br />
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Without Limits
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-700 max-w-lg mb-6 leading-relaxed font-medium">
                Explore expert-led courses, hands-on learning paths and live webinars to achieve your goals.
              </p>

              {/* Large Search Input */}
              <form
                onSubmit={handleSearch}
                className="w-full max-w-lg bg-white p-1.5 sm:p-2 rounded-2xl border border-slate-200 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/15 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 transition-all flex items-center gap-2 mb-4"
              >
                <div className="pl-3.5 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="What do you want to learn today?"
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 sm:py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-md shadow-indigo-600/30 shrink-0 flex items-center justify-center cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Quick Keyword Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold text-slate-500 mr-1">Popular:</span>
                {searchKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => handleChipClick(keyword)}
                    className="px-3.5 py-1.5 bg-white/95 hover:bg-indigo-600 hover:text-white border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 transition-all shadow-xs cursor-pointer"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Floating Badges nicely framing around the girl (FACE UNCOVERED!) */}
            <div className="lg:col-span-5 relative h-[360px] lg:h-[480px] w-full pointer-events-auto hidden sm:block">
              {/* Badge 1: 1000+ Expert Instructors (Top Right Sky - well above her head) */}
              <div className="absolute top-2 right-2 lg:right-6 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/80 flex items-center gap-2.5 transform hover:scale-105 transition-transform duration-200 z-20">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">1000+</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Expert Instructors</p>
                </div>
              </div>

              {/* Badge 2: Live Interactive Webinars (Middle Left - over cityscape) */}
              <div className="absolute top-24 left-0 lg:-left-4 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/80 flex items-center gap-2.5 transform hover:scale-105 transition-transform duration-200 z-20">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">Live</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Interactive Webinars</p>
                </div>
              </div>

              {/* Badge 3: Structured Learning Paths (Lower Middle Left) */}
              <div className="absolute bottom-28 left-2 lg:-left-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/80 flex items-center gap-2.5 transform hover:scale-105 transition-transform duration-200 z-20">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">Structured</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Learning Paths</p>
                </div>
              </div>

              {/* Badge 4: Industry Recognized Certificates (Bottom Left near terrace) */}
              <div className="absolute bottom-6 left-0 lg:left-2 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-xl border border-white/80 flex items-center gap-2.5 transform hover:scale-105 transition-transform duration-200 z-20">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 leading-tight">Industry</p>
                  <p className="text-[10px] text-slate-500 font-semibold">Recognized Certificates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
