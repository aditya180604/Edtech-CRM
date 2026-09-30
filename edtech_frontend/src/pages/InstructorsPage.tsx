import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { TopInstructorsSection } from '../components/TopInstructorsSection';

export const InstructorsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="mb-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Our Instructors
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Learn directly from senior industry leaders and top educators.
          </p>
        </div>
        <TopInstructorsSection />
      </main>
      <Footer />
    </div>
  );
};
