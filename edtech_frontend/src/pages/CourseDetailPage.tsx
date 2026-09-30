import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { featuredCoursesData } from '../data/mockData';
import { Star, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const course =
    featuredCoursesData.find((c) => c.slug === slug) || featuredCoursesData[0];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Course Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 mb-10 relative overflow-hidden">
          <div className="max-w-3xl relative z-10">
            <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-xs font-bold rounded-lg uppercase tracking-wider mb-4 inline-block">
              {course.category}
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              {course.title}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mb-6">
              Learn from industry experts with hands-on projects, real-world assignments, and verifiable certificates.
            </p>
            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold text-white">{course.rating}</span>
                <span>({course.reviewCount} reviews)</span>
              </div>
              <div>Created by <span className="font-semibold text-white">{course.instructorName}</span></div>
              <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-indigo-400" /> {course.duration}</div>
            </div>
          </div>
        </div>

        {/* Content & Pricing Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left info */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[
                  'Build complete, production-ready applications',
                  'Master core modern concepts and best practices',
                  'Atomic topic-by-topic learning with credit upgrades',
                  'Earn industry-recognized verifiable certificates',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sticky pricing card */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 sticky top-24 space-y-5">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  ₹{course.price.toLocaleString('en-IN')}
                </span>
                {course.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{course.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div className="space-y-2.5">
                <Link
                  to="/cart"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>Enroll in Full Course</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/topics"
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center"
                >
                  Buy Individual Topics (from ₹199)
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Full lifetime access</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Access on mobile and TV</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" /> Certificate of completion</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};
