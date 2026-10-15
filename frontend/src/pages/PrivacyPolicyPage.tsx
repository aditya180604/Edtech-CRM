import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Shield, 
  Lock, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Mail, 
  Database, 
  UserCheck, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink,
  Cookie,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    id: 'collection',
    num: '01',
    title: 'Information We Collect',
    icon: Database,
    desc: 'We collect information you explicitly provide when creating an account, enrolling in coursework, or interacting with mentors.',
    points: [
      {
        heading: 'Account & Identity Data',
        detail: 'Name, email address, avatar photo, headline, bio, professional social profiles (GitHub, LinkedIn, personal website).'
      },
      {
        heading: 'Learning & Progress Records',
        detail: 'Lesson completion status, topic test scores, watch durations, assignment submissions, code repositories, and earned certificates.'
      },
      {
        heading: 'Secure Billing Information',
        detail: 'Payment tokens and transaction IDs processed strictly via PCI-DSS compliant payment gateways (Stripe/PayPal). VStudyOnline never stores raw credit card numbers or banking secrets.'
      },
      {
        heading: 'Technical Telemetry',
        detail: 'IP addresses, browser client fingerprints, and video player network metrics strictly used for anti-piracy verification and streaming quality adaptation.'
      }
    ]
  },
  {
    id: 'usage',
    num: '02',
    title: 'How We Utilize Your Data',
    icon: Eye,
    desc: 'Your information is utilized solely to deliver and optimize high-quality learning experiences.',
    points: [
      {
        heading: 'Curriculum Delivery & Progress Sync',
        detail: 'Synchronizing resume states, bookmarks, and quiz submissions across multiple web and mobile sessions.'
      },
      {
        heading: 'Direct Instructor & Peer Mentorship',
        detail: 'Connecting enrolled students with assigned course instructors for Q&A forums, code reviews, and live webinar lounges.'
      },
      {
        heading: 'Cryptographically Verified Certificates',
        detail: 'Generating tamper-proof skill credentials verifiable by potential employers through unique certificate tokens.'
      },
      {
        heading: 'Platform Integrity & Security',
        detail: 'Monitoring for abnormal concurrent account streams, unauthorized credential sharing, and abusive scraping.'
      }
    ]
  },
  {
    id: 'security',
    num: '03',
    title: 'Data Security & Storage Protocols',
    icon: Lock,
    desc: 'We enforce defense-in-depth infrastructure to ensure your data remains confidential and tamper-resistant.',
    highlight: 'All network traffic is encrypted using TLS 1.3 in transit. Data at rest is secured via AES-256 encryption with automated key rotation across ISO 27001 certified cloud datacenters.',
    points: [
      {
        heading: 'Zero-Knowledge Credential Hashing',
        detail: 'User passwords are encrypted with salted bcrypt hashing and never stored in cleartext anywhere on our servers.'
      },
      {
        heading: 'Continuous Automated Backups',
        detail: 'Database snapshots are geographically isolated and protected by strict multi-factor role-based access control (RBAC).'
      }
    ]
  },
  {
    id: 'sharing',
    num: '04',
    title: 'No Data Sale & Minimal Third-Party Disclosures',
    icon: Shield,
    desc: 'VStudyOnline does not sell, rent, or monetize your personal data to ad networks or third-party data brokers.',
    highlight: 'We only transmit minimal operational data to strictly audited service providers necessary to operate the platform (e.g., AWS for hosting, Stripe for payments, and transactional email infrastructure).',
    points: [
      {
        heading: 'Zero Advertising Trackers',
        detail: 'We do not integrate surveillance ad pixels or behavior trackers from third-party advertising companies.'
      },
      {
        heading: 'Strict Data Processing Agreements',
        detail: 'All infrastructure vendors are bound by contractual confidentiality and strict GDPR compliant processing terms.'
      }
    ]
  },
  {
    id: 'rights',
    num: '05',
    title: 'Your Privacy Rights (GDPR & CCPA)',
    icon: UserCheck,
    desc: 'Regardless of your country of residence, we afford universal data sovereignty to all registered learners.',
    points: [
      {
        heading: 'Right to Access & Portability',
        detail: 'You may request an export of your profile, purchase records, and learning activities at any time.'
      },
      {
        heading: 'Right to Rectification',
        detail: 'You can update your personal information, name, headline, bio, and social links instantly via your Student Profile dashboard.'
      },
      {
        heading: 'Right to Erasure ("Right to Be Forgotten")',
        detail: 'You may request complete account deletion and anonymization of your historical activity by contacting our privacy team.'
      }
    ]
  },
  {
    id: 'cookies',
    num: '06',
    title: 'Cookies & Local Storage',
    icon: Cookie,
    desc: 'We use cookies and localStorage exclusively for core platform features and preferences.',
    points: [
      {
        heading: 'Authentication Tokens',
        detail: 'Maintaining persistent authenticated login sessions across browser tabs.'
      },
      {
        heading: 'UI Preferences',
        detail: 'Remembering volume preferences, video playback speeds, and accordion states.'
      }
    ]
  }
];

export const PrivacyPolicyPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('collection');
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
                <Shield className="w-3.5 h-3.5" />
                <span>VStudyOnline Governance & Trust</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Privacy Policy
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
                We believe your learning records and personal identity belong to you. This policy outlines our commitment to transparency, end-to-end data security, and zero data monetization.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FA5A36]" />
                  Last Updated: October 2026
                </span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                  Version 3.2 (Active)
                </span>
                <span>•</span>
                <span>Universal GDPR & CCPA Compliance</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Jump Category Pills */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-xs">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {SECTIONS.map((sec) => (
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
                07. Contact Desk
              </a>
            </div>
          </div>
        </div>

        {/* Policy Content Sections */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
            {SECTIONS.map((sec) => {
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

            {/* Redesigned Clean Contact Card - with toppix851@gmail.com and NO address */}
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
                    Contact Our Privacy Officer
                  </h2>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                For inquiries regarding personal data processing, data deletion requests, or compliance inquiries, please contact our Data Protection Desk directly:
              </p>

              <div className="p-5 sm:p-6 rounded-2xl bg-[#FFF5F2]/50 border border-[#FFCCC2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Direct Privacy Inquiries
                  </p>
                  <p className="text-base sm:text-lg font-black text-slate-900">
                    toppix851@gmail.com
                  </p>
                  <p className="text-xs text-slate-500">
                    Response time SLA: Typically within 24 to 48 business hours.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="mailto:toppix851@gmail.com"
                    className="px-4 py-2.5 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
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
