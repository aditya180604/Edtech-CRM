import React from 'react';

export interface EduCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'white' | 'slate' | 'dark' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'xl' | '2xl' | '3xl';
}

export const EduCard: React.FC<EduCardProps> = ({
  children,
  variant = 'white',
  padding = 'md',
  rounded = '2xl',
  className = '',
  ...props
}) => {
  const roundedClasses = {
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    white: 'bg-white border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)]',
    slate: 'bg-slate-50 border border-slate-200/80',
    dark: 'bg-[#0B1120] text-white border border-slate-800 shadow-xl',
    interactive:
      'bg-white border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] transition-all duration-200 cursor-pointer',
  };

  return (
    <div
      className={`${roundedClasses[rounded]} ${paddingClasses[padding]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
