import React from 'react';
import type { StudentDashboardProfile } from '../../types/studentDashboard';
import { UserCheck, AlertCircle, Edit3, CheckCircle2 } from 'lucide-react';

interface ProfileCompletionWidgetProps {
  profile: StudentDashboardProfile;
  onOpenUpdateModal?: () => void;
}

export const ProfileCompletionWidget: React.FC<ProfileCompletionWidgetProps> = ({
  profile,
  onOpenUpdateModal,
}) => {
  const isComplete = profile.completionPercentage >= 100;

  const fieldLabels: Record<string, string> = {
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone Number',
    profilePhoto: 'Profile Photo',
    country: 'Country',
    timezone: 'Timezone',
    preferredLanguage: 'Language',
    learningPreferences: 'Learning Preferences',
    skills: 'Skills',
    interests: 'Interests',
    'qualification/institution': 'Education Info',
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <UserCheck className={`w-5 h-5 ${isComplete ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <h3 className="text-sm font-bold text-slate-900">Student Profile</h3>
          </div>
          <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
            isComplete
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'text-indigo-600 bg-indigo-50'
          }`}>
            {profile.completionPercentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
            style={{ width: `${profile.completionPercentage}%` }}
          />
        </div>

        {/* State description */}
        {isComplete ? (
          <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-2 text-[11px] text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>Profile is 100% complete! Courses are personalized to your skills and interests.</span>
          </div>
        ) : (
          profile.missingFields.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Complete your profile to unlock personalized recommendations:</span>
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {profile.missingFields.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-semibold"
                  >
                    +{fieldLabels[f] || f}
                  </span>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      <button
        onClick={onOpenUpdateModal}
        className={`w-full py-2.5 font-bold text-xs rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
          isComplete
            ? 'bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-transparent'
            : 'bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white'
        }`}
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>{isComplete ? 'Edit Profile' : 'Complete Profile'}</span>
      </button>
    </div>
  );
};

