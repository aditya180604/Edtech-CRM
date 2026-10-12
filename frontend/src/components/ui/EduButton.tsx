import React from 'react';

export interface EduButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'coralOutline' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const EduButton: React.FC<EduButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-bold transition-all duration-150 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 select-none';

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#FA5A36] hover:bg-[#E04322] active:bg-[#C23315] text-white shadow-sm shadow-[#FA5A36]/25',
    secondary:
      'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800',
    dark:
      'bg-[#0B1120] hover:bg-slate-800 active:bg-slate-900 text-white shadow-sm',
    outline:
      'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs',
    coralOutline:
      'bg-white border border-[#FA5A36] hover:bg-[#FFF5F2] text-[#FA5A36]',
    ghost:
      'bg-transparent hover:bg-slate-100/70 text-slate-700',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
