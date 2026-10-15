import React from 'react';
import { Link } from 'react-router-dom';

export interface EduLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export type BrandLogoProps = EduLogoProps;

export const EduLogo: React.FC<EduLogoProps> = ({
  className = '',
  size = 'md',
  to = '/',
  showText = true,
  variant = 'light',
}) => {
  // Sizing optimized: compact on mobile/smaller screens, full size on sm/md/lg
  const iconSizes = {
    sm: 'w-5 h-5 sm:w-6 sm:h-6',
    md: 'w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9',
    lg: 'w-7 h-7 sm:w-10 sm:h-10 md:w-11 md:h-11',
  };

  const textSizes = {
    sm: 'text-[11px] sm:text-sm md:text-base',
    md: 'text-xs sm:text-lg md:text-xl',
    lg: 'text-sm sm:text-xl md:text-2xl',
  };

  const content = (
    <div className={`flex items-center gap-1.5 sm:gap-2.5 group shrink-0 ${className}`}>
      {/* VStudyOnline Official Brand Logo Emblem */}
      <div className={`${iconSizes[size]} flex items-center justify-center shrink-0`}>
        <img
          src="/Images/logo.png"
          alt="VStudyOnline Logo"
          className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
        />
      </div>
      {showText && (
        <span
          className={`${textSizes[size]} font-extrabold tracking-tight select-none leading-none`}
        >
          {/* Multi-color styling: V in distinct Royal Blue (#2563EB), Study in Dark Slate/White, Online in Coral (#FA5A36) */}
          <span className={variant === 'dark' ? 'text-white' : 'text-[#0F172A]'}>VStudy</span>
          <span className="text-[#FA5A36]">Online</span>
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

export const BrandLogo = EduLogo;
export default EduLogo;
