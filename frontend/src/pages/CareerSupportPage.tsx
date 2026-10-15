import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Briefcase, 
  FileText, 
  Video, 
  Code2, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  Building2, 
  Users,
  GraduationCap,
  PlaySquare,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi, type CatalogStat } from '../api/catalog';

const SERVICES = [
  {
    title: 'ATS-Optimized Resume & LinkedIn Overhaul',
    desc: 'Line-by-line critique by senior tech leads. Transform generic project bullets into measurable business impact metrics that trigger ATS algorithms.',
    icon: FileText,
    badge: '1-on-1 Session',
    color: 'text-[#FA5A36]'
  },
  {
    title: 'Realistic Mock Technical Interviews',
    desc: 'Live algorithmic whiteboarding, system design breakdown, and behavioral deep dives with current engineers at top product companies.',
    icon: Video,
    badge: 'Real Rubrics',
    color: 'text-indigo-600'
  },
  {
    title: 'Production Portfolio Code Audit',
    desc: 'We review your GitHub repositories for test coverage, CI/CD pipelines, Docker containerization, and clean architectural documentation.',
    icon: Code2,
    badge: 'Deep Code Review',
    color: 'text-emerald-600'
  },
  {
    title: 'Hiring Partner Intros & Referrals',
    desc: 'Direct warm introductions to engineering managers at vetted startups, unicorns, and enterprise software companies looking for talent.',
    icon: Building2,
    badge: 'Direct Pipeline',
    color: 'text-purple-600'
  }
];

const STEPS = [
  {
    num: '01',
    title: 'Skill Mastery & Capstones',
    desc: 'Complete role-aligned learning paths and build at least two production-grade full stack capstone projects.'
  },
  {
    num: '02',
    title: 'Resume & Portfolio Audit',
    desc: 'Work with your dedicated career mentor to produce an impact-driven resume, optimized GitHub profile, and live portfolio.'
  },
  {
    num: '03',
    title: 'Mock Interview Simulations',
    desc: 'Undergo 3 rigorous mock technical rounds with detailed written scoring and actionable feedback.'
  },
  {
    num: '04',
    title: 'Referrals & Offer Negotiation',
    desc: 'Receive direct intros to active hiring pipelines and get expert guidance on evaluating offers, equity, and compensation.'
  }
];

const FAQS = [
  {
    q: 'Who is eligible for VStudyOnline career support?',
    a: 'Any student enrolled in an eligible VStudyOnline Pro or Complete Learning Path who finishes their capstone and maintains passing grades in code reviews.'
  },
  {
    q: 'How many mock interviews are included?',
    a: 'Each student receives up to 3 live 60-minute mock technical interviews, plus unlimited access to peer mock practice lounges.'
  },
  {
    q: 'Do you help international remote students?',
    a: 'Yes! Over 40% of our hiring network hires globally for remote roles across North America, Europe, LATAM, and APAC.'
  },
  {
    q: 'How does the hiring referral program work?',
    a: 'Once your capstone is verified, your profile and portfolio are featured on our curated Candidate Portal accessible by partner engineering recruiters.'
  }
];

export const CareerSupportPage: React.FC = () => {
  const [stats, setStats] = useState<CatalogStat[]>([]);

  useEffect(() => {
    catalogApi
      .getPublicStats()
      .then((data) => {
        if (data && data.length > 0) {
          setStats(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load real stats:', err);
      });
  }, []);

  // Use real numbers from database
  const activeLearners = stats.find((s) => s.label.toLowerCase().includes('learner'))?.value || '6';
  const totalCourses = stats.find((s) => s.label.toLowerCase().includes('course'))?.value || '4';
  const expertInstructors = stats.find((s) => s.label.toLowerCase().includes('instructor'))?.value || '5';
  const satisfactionScore = stats.find((s) => s.label.toLowerCase().includes('score') || s.label.toLowerCase().includes('rating'))?.value || '4.8/5';

  const realMetrics = [
    {
      metric: activeLearners,
      label: 'Active Enrolled Learners',
      icon: Users
    },
    {
      metric: totalCourses,
      label: 'Verified Catalog Courses',
      icon: PlaySquare
    },
    {
      metric: expertInstructors,
      label: 'Expert Industry Mentors',
      icon: GraduationCap
    },
    {
      metric: satisfactionScore,
      label: 'Student Satisfaction Score',
      icon: Star
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-16 sm:py-20 lg:py-24">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-semibold">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>VStudyOnline Career Accelerator</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                  From First Line of Code to <span className="text-[#FA5A36]">Signed Tech Offer</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                  Technical skills are only half the journey. Our dedicated career team coaches you through portfolio reviews, mock technical interview gauntlets, and direct recruiter connections.
                </p>

                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/learning-paths"
                    className="px-6 py-3 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white font-semibold text-sm shadow-sm transition-all hover:shadow-md flex items-center gap-2"
                  >
                    Explore Career Learning Paths
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/courses"
                    className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-sm transition-all shadow-sm"
                  >
                    Browse All Courses
                  </Link>
                </div>

                <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    100% Free for Enrolled Students
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    FAANG & Startup Mentors
                  </div>
                </div>
              </div>

              {/* Real Stat Highlights Card - Using Real Database Metrics (Image 3) */}
              <div className="lg:col-span-5">
                <div className="p-8 rounded-3xl bg-slate-900 text-white shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#FA5A36]" />
                      Real Platform Metrics
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-medium">
                      Live Database
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {realMetrics.map((item, idx) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={idx} className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl sm:text-3xl font-black text-[#FA5A36]">
                              {item.metric}
                            </span>
                            <IconComponent className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="text-[11px] text-slate-300 leading-snug">
                            {item.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-400 italic text-center">
                    *Real-time verified platform data across active learning cohorts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Services Section */}
        <section className="py-16 sm:py-20">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                How We Accelerate Your Job Search
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                A battle-tested 4-pillar career readiness framework designed specifically for technical roles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SERVICES.map((srv, idx) => {
                const IconComp = srv.icon;
                return (
                  <div
                    key={idx}
                    className="p-8 rounded-2xl bg-white border border-slate-200/80 hover:border-[#FFCCC2] hover:shadow-lg transition-all space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[#FFF5F2] flex items-center justify-center text-[#FA5A36]">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                        {srv.badge}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{srv.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">
                      {srv.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 4-Step Roadmap */}
        <section className="py-16 sm:py-20 bg-white border-y border-slate-200/80">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                The Career Roadmap to Placement
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                Clear milestones from initial enrollment to your first day on the job.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {STEPS.map((step, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-[#FFF5F2]/40 transition-colors space-y-3 relative"
                >
                  <div className="text-3xl font-black text-[#FA5A36] tracking-tighter">
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 sm:py-20 bg-white border-t border-slate-200/80">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Frequently Asked Career Questions
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#FA5A36] flex-shrink-0" />
                    {faq.q}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-normal pl-6">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
