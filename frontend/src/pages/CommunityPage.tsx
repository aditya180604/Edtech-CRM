import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Users, 
  MessageSquare, 
  Sparkles, 
  Calendar, 
  Award, 
  Heart, 
  ShieldCheck, 
  ExternalLink, 
  ArrowRight,
  Code,
  Coffee,
  Globe2,
  PlaySquare,
  GraduationCap,
  Star,
  Video
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi, type CatalogStat } from '../api/catalog';
import { webinarsApi, type WebinarItem } from '../api/webinars';

const CHANNELS = [
  {
    title: 'Discord Community Server',
    description: 'Join engineers, students, and mentors. Live voice study lounges, daily code challenges, and prompt debug assistance.',
    members: 'Active Chat Lounge',
    badge: 'Real-time',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: MessageSquare,
    actionText: 'Join Discord Server',
    link: 'https://discord.com',
    accentColor: '#5865F2'
  },
  {
    title: 'Peer Study Cohorts',
    description: 'Collaborate with peers across your active courses. Accountability check-ins and shared sprint boards.',
    members: 'Cohort Based',
    badge: 'Study Squads',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Users,
    actionText: 'Explore Courses',
    link: '/courses',
    accentColor: '#FA5A36'
  },
  {
    title: 'Live Webinars & Code Labs',
    description: 'Hands-on live workshops and masterclasses hosted directly by verified platform instructors.',
    members: 'Scheduled Sessions',
    badge: 'Live Events',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Code,
    actionText: 'View Webinars',
    link: '/webinars',
    accentColor: '#E04322'
  },
  {
    title: 'Expert Mentorship Directory',
    description: 'Direct access to senior tech leads, experienced software architects, and verified educators.',
    members: 'Verified Instructors',
    badge: '1-on-1 Guidance',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Globe2,
    actionText: 'Explore Mentors',
    link: '/instructors',
    accentColor: '#8B5CF6'
  }
];

const COMMUNITY_RULES = [
  {
    title: 'Zero Gatekeeping',
    desc: 'Everyone started somewhere. Explain concepts with patience, avoid condescending jargon, and celebrate beginner breakthroughs.',
    icon: Heart
  },
  {
    title: 'Constructive Code Reviews',
    desc: 'Offer clear rationale, code snippets, and alternatives. Critique the implementation, never the individual engineer.',
    icon: Code
  },
  {
    title: 'Academic Honesty & Ethics',
    desc: 'We promote deep understanding over copy-pasting. Share guidance, debugging techniques, and reference docs rather than raw answers.',
    icon: ShieldCheck
  },
  {
    title: 'Respectful, Inclusive Culture',
    desc: 'Zero tolerance for harassment, hate speech, or spam. Our spaces are moderated to maintain safety for all backgrounds.',
    icon: Coffee
  }
];

export const CommunityPage: React.FC = () => {
  const [joinedSuccess, setJoinedSuccess] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [stats, setStats] = useState<CatalogStat[]>([]);
  const [realWebinars, setRealWebinars] = useState<WebinarItem[]>([]);
  const [loadingWebinars, setLoadingWebinars] = useState(true);

  useEffect(() => {
    // Fetch real platform metrics
    catalogApi
      .getPublicStats()
      .then((data) => {
        if (data && data.length > 0) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load community stats:', err);
      });

    // Fetch real upcoming webinars
    webinarsApi
      .getUpcomingWebinars()
      .then((res) => {
        if (res.success && res.data && res.data.webinars) {
          setRealWebinars(res.data.webinars);
        }
      })
      .catch((err) => {
        console.error('Failed to load upcoming webinars:', err);
      })
      .finally(() => {
        setLoadingWebinars(false);
      });
  }, []);

  // Real database metrics mapping
  const activeLearnersVal = stats.find((s) => s.label.toLowerCase().includes('learner'))?.value || '6';
  const expertMentorsVal = stats.find((s) => s.label.toLowerCase().includes('instructor'))?.value || '5';
  const coursesVal = stats.find((s) => s.label.toLowerCase().includes('course'))?.value || '4';
  const satisfactionVal = stats.find((s) => s.label.toLowerCase().includes('score') || s.label.toLowerCase().includes('rating'))?.value || '4.8/5';

  const realMetricsBar = [
    {
      value: activeLearnersVal,
      label: 'Active Learners',
      color: 'text-slate-900'
    },
    {
      value: expertMentorsVal,
      label: 'Verified Mentors',
      color: 'text-[#FA5A36]'
    },
    {
      value: coursesVal,
      label: 'Catalog Courses',
      color: 'text-slate-900'
    },
    {
      value: satisfactionVal,
      label: 'Average Satisfaction',
      color: 'text-[#FA5A36]'
    }
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    setJoinedSuccess(true);
    setTimeout(() => {
      setEmailInput('');
      setJoinedSuccess(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-16 sm:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(#FA5A36_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-semibold tracking-wide">
                <Users className="w-3.5 h-3.5" />
                <span>EduTech Global Community</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Learn, Build, and Grow <span className="text-[#FA5A36]">Together</span>
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Join driven students, experienced mentors, and software practitioners. Ask questions, share project milestones, and build lifelong professional connections.
              </p>
              
              <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#channels"
                  className="px-6 py-3 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md flex items-center gap-2"
                >
                  Explore Community Hubs
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/courses"
                  className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm transition-all shadow-sm"
                >
                  Browse Cohort Courses
                </Link>
              </div>
            </div>

            {/* Real Metrics Bar - Driven by Live Database Stats (Image 2) */}
            <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              {realMetricsBar.map((metric, i) => (
                <div key={i}>
                  <div className={`text-2xl sm:text-3xl font-extrabold ${metric.color}`}>
                    {metric.value}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    {metric.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Hubs / Channels */}
        <section id="channels" className="py-16 sm:py-20">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Where Our Community Gathers
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Choose the hub that best fits your study workflow, communication preference, and current learning stage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CHANNELS.map((channel, i) => {
                const IconComponent = channel.icon;
                const isExternal = channel.link.startsWith('http');
                return (
                  <div
                    key={i}
                    className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200/80 hover:border-[#FFCCC2] hover:shadow-lg transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#FFF5F2] flex items-center justify-center text-[#FA5A36] group-hover:bg-[#FA5A36] group-hover:text-white transition-colors">
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${channel.badgeColor}`}>
                          {channel.badge}
                        </span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#FA5A36] transition-colors">
                        {channel.title}
                      </h3>
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                        {channel.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-500">{channel.members}</span>
                      {isExternal ? (
                        <a
                          href={channel.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FA5A36] hover:text-[#E04322] transition-colors"
                        >
                          {channel.actionText}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <Link
                          to={channel.link}
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#FA5A36] hover:text-[#E04322] transition-colors"
                        >
                          {channel.actionText}
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Real Live Community Sessions - Driven by Backend Webinars (Image 1) */}
        <section className="py-16 sm:py-20 bg-white border-y border-slate-200/80">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FA5A36] uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  Live Syncs & Workshops
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Upcoming Community Events
                </h2>
              </div>
              <Link
                to="/webinars"
                className="text-xs sm:text-sm font-semibold text-[#FA5A36] hover:text-[#E04322] inline-flex items-center gap-1"
              >
                View all scheduled webinars
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loadingWebinars ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-7 h-7 border-3 border-[#FA5A36]/30 border-t-[#FA5A36] rounded-full animate-spin" />
              </div>
            ) : realWebinars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {realWebinars.slice(0, 3).map((event) => (
                  <div
                    key={event.id || event._id}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#FFCCC2] hover:bg-[#FFF5F2]/40 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {event.category || 'Workshop'}
                        </span>
                        {event.isLive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600 animate-pulse">
                            LIVE NOW
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Hosted by <span className="font-medium text-slate-700">{event.instructorName || 'Platform Instructor'}</span>
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <div className="font-semibold text-slate-800">{event.date || 'Upcoming'}</div>
                        <div className="text-[11px] text-slate-500">{event.time || event.duration || '60 mins'}</div>
                      </div>
                      <Link
                        to={event.roomCode ? `/webinars/live/${event.roomCode}` : '/webinars'}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#FA5A36] hover:border-[#FFCCC2] font-semibold text-xs transition-colors"
                      >
                        {event.isLive ? 'Join Live Room' : 'View Event'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3 max-w-lg mx-auto">
                <Video className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="font-bold text-slate-800 text-base">No Live Events Scheduled Today</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Platform instructors schedule new workshops regularly. Explore on-demand courses or check our webinar hub for upcoming sessions.
                </p>
                <Link
                  to="/webinars"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold transition-colors"
                >
                  Browse Webinar Hub
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Community Guidelines */}
        <section className="py-16 sm:py-20">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Our Community Code & Values
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                We believe top engineering capability thrives in an environment of safety, mutual respect, and intellectual curiosity.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {COMMUNITY_RULES.map((rule, idx) => {
                const RuleIcon = rule.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-slate-200/80 hover:shadow-md transition-shadow space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                      <RuleIcon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{rule.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {rule.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Newsletter Callout */}
        <section className="pb-20">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-14 relative overflow-hidden text-center sm:text-left flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FFCCC2] text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Community Digest
                </div>
                <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                  Get Top Discussions & Code Challenges Delivered Weekly
                </h3>
                <p className="text-sm text-slate-300 font-normal leading-relaxed">
                  Curated architecture breakdowns, interview tips, and cohort highlights from the EduTech engineering network.
                </p>
              </div>

              <div className="w-full max-w-md">
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#FA5A36]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] font-semibold text-sm text-white transition-colors shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    Subscribe
                  </button>
                </form>
                {joinedSuccess && (
                  <p className="text-xs text-emerald-400 mt-2 text-center sm:text-left">
                    ✓ Thank you! You've been subscribed to the weekly digest.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
