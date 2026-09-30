import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Heart, Globe, MessageCircle, Share2, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-100">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Edu<span className="text-indigo-600">Tech</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
              Empowering global learners with atomic skills, complete courses, and career paths designed by industry leaders.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Community"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Social Share"
              >
                <Share2 className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Contact"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Platform
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Courses
                </Link>
              </li>
              <li>
                <Link to="/topics" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Topics
                </Link>
              </li>
              <li>
                <Link to="/learning-paths" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Learning Paths
                </Link>
              </li>
              <li>
                <Link to="/instructors" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Instructors
                </Link>
              </li>
              <li>
                <Link to="/webinars" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Webinars
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Community
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Career Support
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Company Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-slate-500 hover:text-indigo-600 transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Newsletter */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Subscribe
            </h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Get updates on new courses, topics & upcoming webinars.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
              >
                {subscribed ? 'Subscribed! 🎉' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} EduTech. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for learners worldwide
          </p>
        </div>
      </div>
    </footer>
  );
};
