import React from 'react';

export interface EduInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  label?: string;
  error?: string;
}

export const EduInput = React.forwardRef<HTMLInputElement, EduInputProps>(
  ({ icon, iconRight, label, error, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 border rounded-xl transition-all outline-none font-medium ${
              icon ? 'pl-10' : 'pl-3.5'
            } ${iconRight ? 'pr-10' : 'pr-3.5'} ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                : 'border-slate-200 focus:border-[#FA5A36] focus:ring-2 focus:ring-[#FFF5F2]'
            } ${className}`}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3.5 text-slate-400 flex items-center">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
      </div>
    );
  }
);

EduInput.displayName = 'EduInput';
