import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { 
  Mail, 
  Clock, 
  CheckCircle2, 
  Send, 
  HelpCircle, 
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  Headphones,
  LifeBuoy
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_134wh5r';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_efh7c85';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'AgLVpp87HBVoyuM3_';
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'connect@sririshikriyansolutions.com';

const INQUIRY_TYPES = [
  'General Support',
  'Course Enrollment',
  'Billing & Refunds',
  'Instructor Queries',
  'Technical Issue'
];

const QUICK_FAQS = [
  {
    q: 'How do I access course videos after purchasing?',
    a: 'Your courses are unlocked immediately in your Student Dashboard under "Enrolled Courses". You can stream them on any browser or mobile device.'
  },
  {
    q: 'What is your refund policy?',
    a: 'We offer a 30-day money-back guarantee for all courses, provided you have watched less than 30% of the lectures and haven\'t claimed a final certificate.'
  },
  {
    q: 'How can I download invoices for company expense reimbursement?',
    a: 'Go to Student Dashboard → Invoices & Receipts. Every payment generates a downloadable PDF tax invoice with your name and payment reference.'
  },
  {
    q: 'Can I switch my course cohort or batch?',
    a: 'Yes, reach out via this contact form or email connect@sririshikriyansolutions.com within the first 14 days of cohort commencement to switch cohorts free of charge.'
  }
];

export const ContactUsPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState('General Support');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    urgency: 'Medium'
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    const generated = `EDU-${Math.floor(100000 + Math.random() * 900000)}`;

    const templateParams = {
      name: form.name,
      from_name: form.name,
      user_name: form.name,
      email: form.email,
      from_email: form.email,
      user_email: form.email,
      reply_to: form.email,
      subject: form.subject,
      urgency: form.urgency,
      department: selectedType,
      inquiry_department: selectedType,
      message: form.message,
      ticket_id: generated,
      ticketId: generated,
      to_email: CONTACT_EMAIL,
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      setTicketId(generated);
    } catch (err: any) {
      console.error('Failed to send email via EmailJS:', err);
      setSubmitError(
        err?.text || err?.message || 'Failed to dispatch email. Please try again or reach out to us directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setTicketId(null);
    setSubmitError(null);
    setForm({
      name: '',
      email: '',
      subject: '',
      message: '',
      urgency: 'Medium'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar />

      <main className="flex-1">
        {/* Modern Header Banner */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200/80 py-12 sm:py-16">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF5F2] border border-[#FFCCC2] text-[#FA5A36] text-xs font-bold tracking-wide">
              <Headphones className="w-3.5 h-3.5" />
              <span>VStudyOnline Help & Support</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              How Can We Assist You Today?
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Select an inquiry topic below or drop us a message. Our dedicated team reviews inquiries around the clock.
            </p>

            {/* Dynamic Topic Selector Chips */}
            <div className="pt-4 flex items-center justify-center gap-2 flex-wrap">
              {INQUIRY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedType === type
                      ? 'bg-[#FA5A36] text-white shadow-xs shadow-[#FA5A36]/30'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Split Section: Quick FAQs & Direct Form */}
        <section className="py-12 sm:py-16">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              
              {/* Left Column: Direct Action & Interactive FAQs */}
              <div className="lg:col-span-5 space-y-6">
                {/* Contact Card */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] flex items-center justify-center font-bold">
                        <LifeBuoy className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">Direct Email Channel</h3>
                        <p className="text-[11px] text-slate-400">Response SLA: &lt; 2 hours</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Online
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">{CONTACT_EMAIL}</span>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#FA5A36] text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Instant Solutions Accordion */}
                <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#FA5A36]" />
                      Instant Answers
                    </h3>
                    <Link to="/help" className="text-[11px] font-bold text-[#FA5A36] hover:underline">
                      View all FAQs
                    </Link>
                  </div>

                  <div className="space-y-2 pt-1">
                    {QUICK_FAQS.map((faq, i) => (
                      <div
                        key={i}
                        className="rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaq(openFaq === i ? null : i)}
                          className="w-full p-3.5 text-left text-xs font-bold text-slate-800 flex items-center justify-between gap-2 cursor-pointer hover:text-[#FA5A36] transition-colors"
                        >
                          <span>{faq.q}</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                              openFaq === i ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {openFaq === i && (
                          <div className="px-3.5 pb-3.5 text-[11px] text-slate-600 font-normal leading-relaxed border-t border-slate-100/80 pt-2">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Clean Interactive Ticket Form */}
              <div className="lg:col-span-7">
                <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
                  {ticketId ? (
                    <div className="py-8 text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#FFF5F2] text-[#FA5A36] border border-[#FFCCC2] flex items-center justify-center mx-auto shadow-xs">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div className="space-y-1.5">
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold tracking-wide font-mono">
                          Reference: {ticketId}
                        </span>
                        <h3 className="text-2xl font-black text-slate-900">Your Message Was Submitted!</h3>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto pt-1 font-normal leading-relaxed">
                          Thank you for reaching out. We have received your inquiry regarding <strong className="text-slate-800">{selectedType}</strong>. Our team will review your message and get back to you shortly.
                        </p>
                      </div>

                      <div className="pt-4 flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="px-5 py-2.5 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          Submit Another Inquiry
                        </button>
                        <Link
                          to="/courses"
                          className="px-5 py-2.5 rounded-xl bg-white hover:bg-orange-50/70 border border-slate-200 hover:border-[#FA5A36] text-slate-700 hover:text-[#FA5A36] text-xs font-bold transition-all cursor-pointer"
                        >
                          Back to Courses
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-700">Inquiry Department</label>
                          <span className="text-[11px] font-bold text-[#FA5A36]">{selectedType}</span>
                        </div>
                        <input
                          type="text"
                          readOnly
                          value={selectedType}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 cursor-default"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. Sarah Jenkins"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="sarah@example.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                          <input
                            type="text"
                            required
                            value={form.subject}
                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                            placeholder="Brief summary of your inquiry"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Urgency</label>
                          <select
                            value={form.urgency}
                            onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-[#FA5A36]"
                          >
                            <option>Normal</option>
                            <option>Medium</option>
                            <option>High</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Message *</label>
                        <textarea
                          required
                          rows={4}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder="How can our technical team assist you?"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#FA5A36] focus:ring-1 focus:ring-[#FA5A36]/20 resize-none"
                        />
                      </div>

                      {submitError && (
                        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                          {submitError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl bg-[#FA5A36] hover:bg-[#E04322] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Sending Ticket...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Ticket to Support Team</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
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
