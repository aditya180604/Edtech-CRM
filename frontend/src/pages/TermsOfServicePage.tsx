import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Scale, 
  ShieldCheck, 
  FileText, 
  CreditCard, 
  AlertCircle, 
  Mail, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  BookOpen, 
  Award,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TERMS_SECTIONS = [
  {
    id: 'acceptance',
    num: '01',
    title: 'Acceptance & Eligibility',
    icon: Scale,
    desc: 'By accessing EduTech, creating an account, or purchasing curriculum access, you confirm that you agree to these Terms of Service.',
    points: [
      {
        heading: 'Age Requirement',
        detail: 'You must be at least 16 years of age (or the minimum legal age required in your jurisdiction) to create an account and purchase courses.'
      },
      {
        heading: 'Corporate Authorization',
        detail: 'If you register on behalf of a business, university, or legal entity, you confirm that you possess lawful authority to bind that entity to these Terms.'
      }
    ]
  },
  {
    id: 'accounts',
    num: '02',
    title: 'Account Security & Responsibilities',
    icon: ShieldCheck,
    desc: 'You are responsible for maintaining the confidentiality of your account credentials and all activities occurring under your profile.',
    points: [
      {
        heading: 'Individual Single-User License',
        detail: 'Each student account is for individual personal use only. Sharing passwords, accounts, or session tokens across multiple users is strictly prohibited.'
      },
      {
        heading: 'Concurrent Stream Limits',
        detail: 'EduTech employs telemetry safeguards to detect simultaneous playback across geographically distant IP addresses and may suspend accounts suspected of credential sharing.'
      }
    ]
  },
  {
    id: 'intellectual',
    num: '03',
    title: 'Course Content & Intellectual Property',
    icon: BookOpen,
    desc: 'All course videos, architectural blueprints, quizzes, interactive sandboxes, and articles remain the intellectual property of EduTech and its verified instructors.',
    highlight: 'Upon purchasing a course or learning path, EduTech grants you a personal, non-exclusive, non-transferable, revocable license for personal, non-commercial educational purposes.',
    points: [
      {
        heading: 'Forbidden Redistribution',
        detail: 'You may not record, scrape, re-upload, distribute, or mirror course lectures to third-party streaming sites or torrent repositories.'
      },
      {
        heading: 'Code Samples & Capstones',
        detail: 'Source code provided within starter templates may be adapted for your personal portfolio projects, but entire repository templates may not be monetized as standalone course products.'
      }
    ]
  },
  {
    id: 'payments',
    num: '04',
    title: 'Payments, Subscriptions & 30-Day Refund Guarantee',
    icon: CreditCard,
    desc: 'Pricing is listed clearly in USD or local currency equivalents, with secure payment processing handled via Stripe or PayPal.',
    highlight: '30-Day Money-Back Guarantee: If you are not satisfied with an individual course, you may request a 100% full refund within 30 calendar days of purchase, provided you have completed less than 30% of the lessons and have not claimed a completion certificate.',
    points: [
      {
        heading: 'Transparent Pricing & Taxes',
        detail: 'Any applicable regional sales taxes or VAT are itemized clearly on checkout receipts.'
      },
      {
        heading: 'Chargeback Protocols',
        detail: 'We encourage students to contact our billing team first to resolve payment discrepancies quickly before initiating banking disputes.'
      }
    ]
  },
  {
    id: 'conduct',
    num: '05',
    title: 'Student & Instructor Code of Conduct',
    icon: Users,
    desc: 'Our community thrives on intellectual curiosity, mutual professional respect, and academic integrity.',
    points: [
      {
        heading: 'Academic Honesty',
        detail: 'All capstone submissions must represent your own authentic work. Plagiarizing capstones or submitting uncredited work voids certificate issuance.'
      },
      {
        heading: 'Respectful Discussion Lounges',
        detail: 'Zero tolerance for harassment, discrimination, hate speech, or unsolicited commercial spam in course Q&A forums and community chat.'
      }
    ]
  },
  {
    id: 'liability',
    num: '06',
    title: 'Disclaimers & Limitation of Liability',
    icon: AlertCircle,
    desc: 'EduTech educational content is provided on an "as is" and "as available" basis without express or implied warranties.',
    points: [
      {
        heading: 'No Employment Guarantees',
        detail: 'While our curricula are designed to reflect real-world engineering standards, EduTech does not guarantee specific job offers, compensation levels, or promotions.'
      },
      {
        heading: 'Limitation of Liability',
        detail: 'To the maximum extent permitted by applicable law, EduTech shall not be held liable for indirect, incidental, or consequential damages resulting from platform usage.'
      }
    ]
  }
];

export const TermsOfServicePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('acceptance');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('toppix851@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-[#FA5A36] selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* Header Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-14 sm:py-18">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-bold tracking-wide">
                <Scale className="w-3.5 h-3.5" />
                <span>EduTech Legal Agreement</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Terms of Service
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
                These terms govern your access to EduTech's platform, courses, live workshops, mentorship forums, and APIs. Please review them carefully.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FA5A36]" />
                  Last Updated: October 2026
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  Global Terms of Use
                </span>
                <span>•</span>
                <span>30-Day Money-Back Guarantee Included</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Jump Category Pills */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-xs">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {TERMS_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={() => setActiveTab(sec.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === sec.id
                      ? 'bg-[#FA5A36] text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {sec.num}. {sec.title}
                </a>
              ))}
              <a
                href="#contact"
                onClick={() => setActiveTab('contact')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === 'contact'
                    ? 'bg-[#FA5A36] text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                07. Legal Notices
              </a>
            </div>
          </div>
        </div>

        {/* Terms Content Sections */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {TERMS_SECTIONS.map((sec) => {
              const IconComp = sec.icon;
              return (
                <div
                  key={sec.id}
                  id={sec.id}
                  className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-6 scroll-mt-20 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#FA5A36]">
                          Section {sec.num}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                          {sec.title}
                        </h2>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
                    {sec.desc}
                  </p>

                  {sec.highlight && (
                    <div className="p-4 rounded-2xl bg-[#FFF5F2] border border-[#FFCCC2] text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                      {sec.highlight}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {sec.points.map((pt, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {pt.heading}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-6 font-normal">
                          {pt.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Redesigned Clean Legal Contact Card - with toppix851@gmail.com and NO address */}
            <div
              id="contact"
              className="p-6 sm:p-10 rounded-3xl bg-white border border-[#FFCCC2] shadow-sm space-y-6 scroll-mt-20 relative overflow-hidden"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#FA5A36]">
                    Section 07
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    Governing Law & Legal Inquiries
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                For questions regarding these Terms of Service, licensing agreements, or official legal notices, please reach out directly:
              </p>

              <div className="p-5 sm:p-6 rounded-2xl bg-[#FFF5F2]/50 border border-[#FFCCC2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    EduTech Legal Counsel Desk
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    toppix851@gmail.com
                  </p>
                  <p className="text-xs text-slate-500">
                    Governing jurisdiction: Standard international commercial terms.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="mailto:toppix851@gmail.com"
                    className="px-4 py-2.5 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Notice</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#FA5A36] text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
