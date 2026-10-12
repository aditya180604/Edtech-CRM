import React from 'react';

export interface EduBadgeProps {
  children: React.ReactNode;
  variant?: 'coral' | 'indigo' | 'emerald' | 'amber' | 'slate' | 'blue';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const EduBadge: React.FC<EduBadgeProps> = ({
  children,
  variant = 'coral',
  size = 'sm',
  icon,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-3 py-1 text-xs gap-1.5',
  };

  const variantClasses = {
    coral: 'bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2]',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200',
    slate: 'bg-slate-100 text-slate-700 border border-slate-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100',
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-lg shrink-0 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
