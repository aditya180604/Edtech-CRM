import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionHref) {
      navigate(actionHref);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50/80 text-indigo-600 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">{description}</p>
      {actionText && (
        <button
          onClick={handleAction}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
