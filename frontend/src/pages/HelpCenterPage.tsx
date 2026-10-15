import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Search, HelpCircle, ChevronDown, BookOpen, CreditCard, ShieldCheck, Video, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQ {
  question: string;
  answer: string;
  category: 'account' | 'payments' | 'certificates' | 'courses';
}

const FAQS: FAQ[] = [
  {
    question: 'How do I access my enrolled courses and lessons?',
    answer: 'Once enrolled in a course or individual topic, navigate to your Student Dashboard and click on "My Learning". All your active modules, video lectures, and code downloads are instantly unlocked and available 24/7.',
    category: 'courses',
  },
  {
    question: 'What is the Verified Skill Passport and how is it verified?',
    answer: 'Your Verified Skill Passport is a public, verifiable credential showcasing your completed modules, verified skills, and assessments. Each passport has a unique tamper-proof URL (e.g. /passport/your-name) that employers and recruiters can verify in real-time.',
    category: 'certificates',
  },
  {
    question: 'Can I purchase single topics without buying the full course?',
    answer: 'Yes! VStudyOnline operates on an atomic learning model. You can purchase specific modules or topics you need. If you later decide to upgrade to the full course, 100% of the money you spent on those topics is automatically credited toward the course price.',
    category: 'payments',
  },
  {
    question: 'How do 1-on-1 consultations and live webinars work?',
    answer: 'Instructors host live webinar workshops and private 1-on-1 mentorship slots. You can book a session from the Mentorship Directory or Webinar tab. You will receive real-time email reminders and enter the live interactive WebRTC room directly from your dashboard.',
    category: 'courses',
  },
  {
    question: 'What payment methods are supported on VStudyOnline?',
    answer: 'We support all major payment options via Razorpay and Stripe including UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards (Visa, Mastercard, RuPay), Net Banking, and international payment cards with instant invoice generation.',
    category: 'payments',
  },
  {
    question: 'How do I earn and download my course certificate?',
    answer: 'Complete all lessons in the course curriculum and pass the required module assessments with a score of 70% or higher. Your signed, authenticated PDF certificate will be generated automatically and linked to your Skill Passport.',
    category: 'certificates',
  },
  {
    question: 'How do I update my profile details and portfolio links?',
    answer: 'Go to your Student Dashboard and click on "Profile & Settings". Under Personal Details, you can upload your photo, add your headline, bio, city, state, LinkedIn, and GitHub links. Click "Save Profile Changes" to update your passport.',
    category: 'account',
  },
];

export const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col justify-between text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-black uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>VStudyOnline Help Center</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            How can we help you learn?
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium">
            Find instant answers to common questions about course enrollments, topic credits, certifications, verified skill passports, and mentor bookings.
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search help articles, refunds, certificate verification..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 shadow-xs transition"
              />
            </div>
          </div>
        </div>

        {/* Quick Category Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'all', label: 'All FAQs', icon: BookOpen },
            { id: 'courses', label: 'Courses & Topics', icon: Video },
            { id: 'payments', label: 'Billing & Upgrades', icon: CreditCard },
            { id: 'certificates', label: 'Skill Passport', icon: ShieldCheck },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#FFF5F2] border-[#FA5A36] text-[#FA5A36] shadow-xs'
                    : 'bg-white border-slate-200/80 text-slate-700 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-[#FA5A36]' : 'text-slate-400'}`} />
                <span className="text-xs font-black">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* FAQs Accordion */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xs space-y-4">
          <h2 className="text-lg font-black text-slate-900 pb-2 border-b border-slate-100">
            Frequently Asked Questions ({filteredFaqs.length})
          </h2>

          <div className="divide-y divide-slate-100">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-4">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#FA5A36] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#FA5A36]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support CTA Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-xl sm:text-2xl font-black text-white">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Our academic advisory and support team is ready to help you with course advice, instructor queries, and technical assistance.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#FA5A36] hover:bg-[#E04322] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span>Contact Support</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
