import React from 'react';
import { Link } from 'react-router-dom';

interface EduLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export const EduLogo: React.FC<EduLogoProps> = ({ className = '', size = 'md', to = '/', showText = true, variant = 'light' }) => {
  const iconSizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className={`flex items-center gap-2.5 group shrink-0 ${className}`}>
      {/* Coral Sphere Emblem from Reference Image */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-[#FA5A36] via-[#FF6E4A] to-[#FF8A65] flex items-center justify-center text-white shadow-sm shadow-[#FA5A36]/30 transition-transform group-hover:scale-105`}
      >
        <svg
          className="w-5 h-5 fill-none stroke-white"
          viewBox="0 0 24 24"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
          <path d="M12 6a6 6 0 1 0 6 6" />
          <circle cx="12" cy="12" r="2" fill="white" />
        </svg>
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-semibold tracking-tight ${variant === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          Edu<span className="text-[#FA5A36]">Tech</span>
        </span>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center no-underline">
        {content}
      </Link>
    );
  }

  return content;
};
