import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import {
  Search,
  Calendar,
  Clock,
  DollarSign,
  Sparkles,
  ShieldCheck,
  Star,
  CheckCircle2,
  Users,
  Briefcase,
  ChevronRight,
  Filter,
  Compass,
  MessageSquare,
  HelpCircle,
  Zap,
} from 'lucide-react';
import { consultationsApi, type ConsultationMentor } from '../../api/consultations';
import { ConsultationBookingModal } from '../../components/consultations/ConsultationBookingModal';
import { connectRealtimeSocket } from '../../realtime/socket';
import { useAuth } from '../../context/AuthContext';

const EXPERTISE_TAGS = [
  'All',
  'System Design',
  'Full Stack',
  'React',
  'Node.js',
  'Python',
  'Cloud & DevOps',
  'AI & Machine Learning',
  'Data Structures & Algorithms',
  'Career & Interview Prep',
];

export const MentorshipDirectoryPage: React.FC = () => {
  const { accessToken } = useAuth();
  const [mentors, setMentors] = useState<ConsultationMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  // Booking Modal State
  const [activeMentor, setActiveMentor] = useState<ConsultationMentor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    consultationsApi
      .getMentors({ search: searchQuery, expertise: selectedTag === 'All' ? '' : selectedTag })
      .then((data) => {
        if (isMounted) setMentors(data || []);
      })
      .catch((err) => {
        console.error('Failed to load mentors:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedTag]);

  useEffect(() => {
    const socket = connectRealtimeSocket(accessToken);
    const subscribe = () => socket.emit('mentorship:subscribe');
    const handleRatingUpdate = (rating: {
      userId: string;
      averageRating: number;
      reviewCount: number;
    }) => {
      setMentors((current) =>
        current.map((mentor) =>
          mentor.userId === rating.userId
            ? { ...mentor, averageRating: rating.averageRating, reviewCount: rating.reviewCount }
            : mentor
        )
      );
    };

    socket.on('connect', subscribe);
    socket.on('consultation:rating-updated', handleRatingUpdate);
    if (socket.connected) subscribe();

    return () => {
      socket.off('connect', subscribe);
      socket.off('consultation:rating-updated', handleRatingUpdate);
    };
  }, [accessToken]);

  const handleBookMentor = (mentor: ConsultationMentor) => {
    setActiveMentor(mentor);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-indigo-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#FA5A36_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="max-w-5xl mx-auto text-center space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-orange-300 text-xs font-bold backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              1-on-1 Mentorship & Career Advisory
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Learn Directly from Working <span className="text-[#FA5A36]">IT Professionals</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Book private 1-on-1 consultation sessions with seasoned software engineers, architects, and technical leaders who teach part-time alongside their careers.
            </p>

            {/* Search Input Box */}
            <div className="max-w-2xl mx-auto pt-4">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mentors by name, company, system design, react, etc..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder-slate-400 font-semibold text-xs sm:text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-[#FA5A36]"
                />
              </div>
            </div>

            {/* Quick Skills Filter Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {EXPERTISE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-[#FA5A36] text-white shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            WHAT IS 1-ON-1 MENTORSHIP & WHY YOU NEED IT
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2]">
              <HelpCircle className="w-3.5 h-3.5" />
              1-on-1 Mentorship Explained
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Personalized Guidance that Recorded Videos Cannot Give You
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Self-paced courses build your fundamentals, but real career breakthroughs happen when you talk directly to someone who has done it. 1-on-1 mentorship connects you privately with working IT leaders to solve your exact doubts and supercharge your career.
            </p>
          </div>

          {/* WHAT IT IS & WHY WE ADDED IT CALLOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs">
            <div className="space-y-2.5 border-b md:border-b-0 md:border-r border-slate-100 pb-5 md:pb-0 md:pr-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] text-xs font-black tracking-wide uppercase">
                What is 1-on-1 Mentorship?
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                It is a private, dedicated 1-to-1 video consultation where a verified industry specialist works exclusively with you. Unlike pre-recorded courses, the session is tailored strictly to your specific blockers, code reviews, and personal goals.
              </p>
            </div>

            <div className="space-y-2.5 pt-3 md:pt-0 md:pl-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black tracking-wide uppercase">
                Why We Added It & Why It is Needed
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                Over 70% of online learners experience "tutorial hell" or get stuck on complex bugs and career uncertainties. VStudyOnline introduced 1-on-1 mentorship so you never learn in isolation—giving you direct, on-demand access to senior engineers who clear your blockers fast.
              </p>
            </div>
          </div>

          {/* TWO PRIMARY BENEFIT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
            {/* Card 1: Career Guidance */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-[#FA5A36]/10 transition-all space-y-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FA5A36] flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Career Guidance & Strategic Growth
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tailored career roadmaps, technical interview mock preparation, and resume reviews directly from engineers who hire at leading tech companies.
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Resume & Portfolio Teardown:</strong> Optimize your GitHub, projects, and CV to stand out to recruiters and hiring managers.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Mock Interviews & System Design:</strong> Practice realistic coding and architectural questions with actionable critique.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Domain Switching & Promotion Roadmaps:</strong> Clear, step-by-step guidance on transitioning into Cloud, Full Stack, or AI.</span>
                </div>
              </div>
            </div>

            {/* Card 2: Doubts Resolution & Course Explanation */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 transition-all space-y-4 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  Live 1-on-1 Interaction & Course Walkthroughs
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Never stay blocked on a stubborn bug, architectural problem, or difficult topic. Get direct screen-share help and customized explanations.
                </p>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-slate-100">
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Instant Bug & Architecture Walkthrough:</strong> Pair program on a private live call to debug errors and adopt industry patterns.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Customized Concept Breakdown:</strong> Complex frameworks, databases, and async architecture explained at your own pace.</span>
                </div>
                <div className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Capstone Project Code Reviews:</strong> Receive deep, line-by-line feedback before presenting or deploying your code.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mentors Grid Directory */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-slate-900">Available Mentors</h2>
              <p className="text-xs text-slate-500 font-medium">
                {mentors.length} active mentors offering scheduled 1-on-1 consultations
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#FA5A36] border-t-transparent" />
              <p className="text-xs font-bold text-slate-500">Discovering verified mentors...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-100 p-8">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-[#FA5A36] flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Mentors Matching Your Query</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
                Try searching for a different skill or clear your search query to see all available mentors.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-3xl border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    {/* Header: Photo & Name */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FA5A36] to-[#FF8A65] text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 shadow-xs">
                        {mentor.profilePhoto ? (
                          <img
                            src={mentor.profilePhoto}
                            alt={mentor.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          mentor.name[0] || 'M'
                        )}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 truncate">{mentor.name}</h3>
                          <span title="Verified Mentor">
                            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {mentor.headline}
                        </p>
                        {mentor.reviewCount > 0 && (
                          <div
                            className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-slate-600"
                            aria-label={`${mentor.averageRating.toFixed(1)} out of 5, ${mentor.reviewCount} reviews`}
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{mentor.averageRating.toFixed(1)}</span>
                            <span className="text-slate-400">
                              ({mentor.reviewCount} {mentor.reviewCount === 1 ? 'review' : 'reviews'})
                            </span>
                          </div>
                        )}
                        {mentor.currentOrganization && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-semibold mt-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            <span>{mentor.currentOrganization}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio Snippet */}
                    {mentor.bio && (
                      <p className="text-xs text-slate-600 font-normal line-clamp-2 leading-relaxed">
                        {mentor.bio}
                      </p>
                    )}

                    {/* Skills Tags */}
                    {mentor.skills && mentor.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {mentor.skills.slice(0, 4).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-700"
                          >
                            {s}
                          </span>
                        ))}
                        {mentor.skills.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{mentor.skills.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer: Price, Duration & Book CTA */}
                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {mentor.consultationDuration || 45} Min Call
                      </div>
                      <div className="text-base font-black text-slate-900">
                        {mentor.consultationFee === 0 ? 'FREE' : `₹${mentor.consultationFee}`}
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookMentor(mentor)}
                      className="px-4 py-2 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Book 1-on-1</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Booking Modal */}
      {activeMentor && (
        <ConsultationBookingModal
          mentor={activeMentor}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};
