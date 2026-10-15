import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Rocket, 
  Target, 
  Eye, 
  Users2, 
  Award, 
  HeartHandshake, 
  Compass, 
  ArrowRight,
  Globe2,
  CheckCircle2,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { catalogApi, type CatalogStat } from '../api/catalog';

const VALUES = [
  {
    title: 'Production Realism Over Toy Projects',
    desc: 'We never teach hello-world abstractions in a vacuum. Every curriculum is built around real architectural trade-offs, CI/CD pipelines, and enterprise-grade patterns.',
    icon: Target
  },
  {
    title: 'Atomic Mastery & Active Learning',
    desc: 'Deep comprehension is forged through deliberate coding practice, interactive sandboxes, and immediate unit-tested feedback loops.',
    icon: Rocket
  },
  {
    title: 'Relentless Mentorship & Guidance',
    desc: 'Behind every course is a dedicated instructor and cohort mentor ready to unblock errors, review pull requests, and explain tricky concepts.',
    icon: HeartHandshake
  },
  {
    title: 'Global Inclusivity & Equal Access',
    desc: 'Engineering talent is distributed equally worldwide. We provide accessible, world-class education with transparent pricing and flexible learning hours.',
    icon: Globe2
  }
];

export const AboutUsPage: React.FC = () => {
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
        console.error('Failed to load stats:', err);
      });
  }, []);

  // Real platform statistics
  const activeLearners = stats.find((s) => s.label.toLowerCase().includes('learner'))?.value || '6';
  const totalCourses = stats.find((s) => s.label.toLowerCase().includes('course'))?.value || '4';
  const expertInstructors = stats.find((s) => s.label.toLowerCase().includes('instructor'))?.value || '5';
  const satisfactionScore = stats.find((s) => s.label.toLowerCase().includes('score') || s.label.toLowerCase().includes('rating'))?.value || '4.8/5';

  const realStats = [
    { value: activeLearners, label: 'Active Enrolled Students' },
    { value: totalCourses, label: 'Production Courses' },
    { value: expertInstructors, label: 'Verified Instructors' },
    { value: satisfactionScore, label: 'Student Satisfaction' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-16 sm:py-20 lg:py-24">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>About VStudyOnline</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Democratizing <span className="text-[#FA5A36]">Real-World Engineering</span> Excellence
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                VStudyOnline was founded on a simple conviction: conventional education is too slow for modern engineering, while generic bootcamps skip foundational craft. We bridge that gap with production-grade instruction.
              </p>
            </div>

            {/* Real Stats Bar */}
            <div className="mt-14 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              {realStats.map((stat, i) => (
                <div key={i}>
                  <div className="text-2xl sm:text-4xl font-black text-slate-900">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 sm:py-20">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Our Mission</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  To equip ambitious software engineers, designers, and tech leaders worldwide with atomic, production-tested competencies that immediately translate to high-impact career progression.
                </p>
              </div>

              <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Eye className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Our Vision</h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                  To build the global benchmark platform where continuous professional learning is engaging, verified, socially supported, and recognized by every modern technology employer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 sm:py-20 bg-white border-y border-slate-200/80">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Our Guiding Principles
              </h2>
              <p className="text-sm sm:text-base text-slate-600 mt-2">
                The core philosophy that guides every curriculum update, mentor interaction, and platform feature.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map((val, idx) => {
                const IconComponent = val.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-[#FFF5F2]/40 hover:border-[#FFCCC2] transition-all space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">{val.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {val.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-16 sm:py-20">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-14 text-center space-y-6">
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Ready to Upgrade Your Engineering Trajectory?
              </h3>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
                Join our next cohort, master real-world systems, and earn certified credentials recognized by top tech companies.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link
                  to="/courses"
                  className="px-6 py-3 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] font-semibold text-sm text-white transition-colors shadow-sm flex items-center gap-2"
                >
                  Explore All Courses
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/choose-role"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-semibold text-sm text-white border border-white/20 transition-colors"
                >
                  Teach on VStudyOnline
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
