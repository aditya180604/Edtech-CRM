import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LiveWebinarsSection } from '../components/LiveWebinarsSection';

export const WebinarsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Live Webinars & Workshops
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Join live hands-on sessions with industry practitioners.
          </p>
        </div>
        <LiveWebinarsSection />
      </main>
      <Footer />
    </div>
  );
};
