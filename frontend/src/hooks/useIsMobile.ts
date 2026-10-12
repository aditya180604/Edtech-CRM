import { useState, useEffect } from 'react';

/**
 * Custom hook to detect whether the current screen viewport width is below or equal to a given breakpoint (default 500px).
 * Dynamically re-renders on window resize.
 * @param breakpoint Max width in pixels to consider as mobile (default: 500)
 */
export function useIsMobile(breakpoint: number = 500): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
