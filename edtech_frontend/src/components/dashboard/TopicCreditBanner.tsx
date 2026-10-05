import React from 'react';
import type { CourseUpgradeOpportunity } from '../../types/studentDashboard';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopicCreditBannerProps {
  upgrades: CourseUpgradeOpportunity[];
}

export const TopicCreditBanner: React.FC<TopicCreditBannerProps> = ({ upgrades }) => {
  const navigate = useNavigate();

  if (!upgrades || upgrades.length === 0) {
    return null;
  }

  // Display primary upgrade opportunity
  const primaryUpgrade = upgrades[0];
  const currencySymbol = primaryUpgrade.currency === 'INR' ? '₹' : '$';

  return (
    <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Atomic Credit Opportunity</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
          You have {currencySymbol}{primaryUpgrade.accumulatedCredit} in Topic Credits!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
          Upgrade to the complete <strong>{primaryUpgrade.courseTitle}</strong> anytime for only{' '}
          <span className="text-emerald-400 font-extrabold">{currencySymbol}{primaryUpgrade.upgradePrice}</span> (regularly {currencySymbol}{primaryUpgrade.fullCoursePrice}).
          Your historical topic purchases are fully credited!
        </p>
      </div>

      <button
        onClick={() => navigate(`/course/${primaryUpgrade.courseSlug}`)}
        className="px-6 py-3 bg-white text-slate-950 hover:bg-indigo-50 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 cursor-pointer"
      >
        <span>Upgrade for {currencySymbol}{primaryUpgrade.upgradePrice}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
