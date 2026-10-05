import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Globe, MessageCircle, Share2, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-10 border-b border-slate-100">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-slate-900">
                Edu<span className="text-indigo-600">Tech</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-md leading-relaxed">
              Empowering global learners with atomic skills, full engineering courses, and career paths designed by industry leaders. Learn on your own schedule with verified credentials.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 flex items-center justify-center transition-all shadow-2xs"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 flex items-center justify-center transition-all shadow-2xs"
                aria-label="Community"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 flex items-center justify-center transition-all shadow-2xs"
                aria-label="Social Share"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 flex items-center justify-center transition-all shadow-2xs"
                aria-label="Contact"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="lg:col-span-2 lg:col-start-7">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/courses" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/topics" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Topics
                </Link>
              </li>
              <li>
                <Link to="/learning-paths" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link to="/instructors" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Instructors
                </Link>
              </li>
              <li>
                <Link to="/webinars" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Webinars
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources Links */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Career Support
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Company Links */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 font-medium transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Centered Copyrights (Completely removed 'Made with...' and removed Subscribe section) */}
        <div className="pt-8 flex flex-col items-center justify-center text-center space-y-1 text-xs">
         
          <p className="font-medium text-slate-500">© 2026 SRR solutions . All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
