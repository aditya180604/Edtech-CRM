import React from 'react';
import { ArrowRight, Video, Clock, Award, GraduationCap } from 'lucide-react';
import { useAuthModal } from '../context/AuthModalContext';

export const CtaBanner: React.FC = () => {
  const { openSignup } = useAuthModal();

  return (
    <section className="py-10 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0A0E1A] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-800">
        {/* Background glow graphics */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#FA5A36]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left copy & CTA */}
          <div className="lg:col-span-7">
            <div className="flex items-start justify-between gap-4 mb-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Ready to Start Your <br />
                <span className="text-[#FF8A65]">Learning Journey?</span>
              </h2>
              {/* Graduation Cap Illustration on top right (Image 2 Spec) */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FA5A36] shrink-0 shadow-lg">
                <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm mb-6 max-w-lg leading-relaxed">
              Join thousands of learners and gain the industry skills you need to build a better future.
            </p>

            <button
              type="button"
              onClick={openSignup}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#FA5A36]/30 transition-all duration-150 group cursor-pointer hover:scale-[1.02]"
            >
              <span>Create Your Free Account</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right 3 Benefit Pillars - Image 2 Spec */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-3 pt-2 lg:pt-0">
            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">100% Online Learning</p>
                <p className="text-[11px] text-slate-300">Learn from anywhere, anytime</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">Flexible Learning</p>
                <p className="text-[11px] text-slate-300">Study at your own pace & schedule</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">Verified Certificate</p>
                <p className="text-[11px] text-slate-300">Showcase your skills to future employers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
