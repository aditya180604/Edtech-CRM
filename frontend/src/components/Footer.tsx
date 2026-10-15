import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { EduLogo } from './ui/EduLogo';

export const Footer: React.FC = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const toggleAccordion = (section: string) => {
    setOpenAccordion((prev) => (prev === section ? null : section));
  };

  return (
    <footer className="bg-white border-t border-slate-200/80 pt-10 sm:pt-14 pb-8 sm:pb-10">
      <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 pb-8 sm:pb-10 border-b border-slate-100">
          {/* Col 1: Brand Info & Social Icons - Image 2 Spec */}
          <div className="lg:col-span-5 space-y-4">
            <EduLogo size="lg" />
            <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed font-normal">
              Empowering global learners with atomic skills. Full range learning courses and career paths designed by industry leaders. Learn on your own schedule with verified credentials.
            </p>

            {/* Social Icons matching modern branding */}
            <div className="flex items-center gap-2 pt-1">
             
              {/* Twitter / X */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#FFF5F2] border border-slate-200/80 text-slate-600 hover:text-[#FA5A36] hover:border-[#FFCCC2] flex items-center justify-center transition-colors"
                aria-label="Twitter / X"
              >
                <svg className="w-3.5 h-3.5 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#FFF5F2] border border-slate-200/80 text-slate-600 hover:text-[#FA5A36] hover:border-[#FFCCC2] flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#FFF5F2] border border-slate-200/80 text-slate-600 hover:text-[#FA5A36] hover:border-[#FFCCC2] flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-[#FFF5F2] border border-slate-200/80 text-slate-600 hover:text-[#FA5A36] hover:border-[#FFCCC2] flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-3.5 h-3.5 fill-currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Platform Links (Mobile Accordion / Desktop Column) */}
          <div className="lg:col-span-2 lg:col-start-7 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
            <button
              type="button"
              onClick={() => toggleAccordion('platform')}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 md:mb-4 cursor-pointer"
            >
              <span>Platform</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                  openAccordion === 'platform' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2.5 text-xs sm:text-sm ${
                openAccordion === 'platform' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link to="/courses" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/topics" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Topics
                </Link>
              </li>
              <li>
                <Link to="/learning-paths" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link to="/instructors" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Instructors
                </Link>
              </li>
              <li>
                <Link to="/webinars" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Webinars
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources Links (Mobile Accordion / Desktop Column) */}
          <div className="lg:col-span-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
            <button
              type="button"
              onClick={() => toggleAccordion('resources')}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 md:mb-4 cursor-pointer"
            >
              <span>Resources</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                  openAccordion === 'resources' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2.5 text-xs sm:text-sm ${
                openAccordion === 'resources' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link to="/blog" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/community" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Community
                </Link>
              </li>
              <li>
                <Link to="/career-support" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Career Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Company Links (Mobile Accordion / Desktop Column) */}
          <div className="lg:col-span-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
            <button
              type="button"
              onClick={() => toggleAccordion('company')}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2 md:mb-4 cursor-pointer"
            >
              <span>Company</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 md:hidden transition-transform duration-200 ${
                  openAccordion === 'company' ? 'rotate-180' : ''
                }`}
              />
            </button>
            <ul
              className={`space-y-2.5 text-xs sm:text-sm ${
                openAccordion === 'company' ? 'block' : 'hidden md:block'
              }`}
            >
              <li>
                <Link to="/about" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-500 hover:text-[#FA5A36] font-medium transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Centered Copyrights - Matching Image 2 */}
        <div className="pt-6 sm:pt-8 flex flex-col items-center justify-center text-center space-y-1 text-xs">
          <p className="font-medium text-slate-400 text-[11px] sm:text-xs">
            © 2026–2027 VStudyOnline. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
