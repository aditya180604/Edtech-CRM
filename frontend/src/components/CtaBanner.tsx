import React from 'react';
import { ArrowRight, CheckCircle2, Clock, Award } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';

export const CtaBanner: React.FC = () => {
  const { openSignup } = useAuthModal();

  return (
    <section className="py-8 max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 sm:p-10 lg:p-12 shadow-xl shadow-indigo-950/20">
        {/* Background glow graphics */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left copy & CTA */}
          <div className="lg:col-span-7">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mb-3 leading-tight">
              Ready to Start Your <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Learning Journey?
              </span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-lg leading-relaxed">
              Join thousands of learners and gain the industry skills you need to build a better future.
            </p>
            <button
              type="button"
              onClick={openSignup}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-950 hover:bg-indigo-50 active:bg-indigo-100 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all duration-150 group cursor-pointer"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right 3 Benefit Pillars */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 pt-2 lg:pt-0">
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% Online Learning</p>
                <p className="text-[11px] text-slate-300">Learn from anywhere, anytime</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Flexible Learning</p>
                <p className="text-[11px] text-slate-300">Study at your own pace & schedule</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-300 flex items-center justify-center shrink-0">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Verified Certificate</p>
                <p className="text-[11px] text-slate-300">Shareable on LinkedIn & Resumes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
