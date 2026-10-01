import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { LiveWebinarsSection } from '../components/LiveWebinarsSection';
import { webinarsApi } from '../api/webinars';

export const WebinarsPage: React.FC = () => {
  const [checking, setChecking] = useState(true);
  const [hasUpcoming, setHasUpcoming] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const verifyWebinars = async () => {
      try {
        const res = await webinarsApi.getUpcomingWebinars();
        if (isMounted) {
          setHasUpcoming(!!res.data?.hasUpcoming);
        }
      } catch (err) {
        if (isMounted) setHasUpcoming(false);
      } finally {
        if (isMounted) setChecking(false);
      }
    };

    verifyWebinars();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex justify-center items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
        </main>
        <Footer />
      </div>
    );
  }

  // If no scheduled webinars, page is inaccessible as specified in Requirement 3
  if (!hasUpcoming) {
    return <Navigate to="/courses" replace />;
  }

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
        <LiveWebinarsSection showIfEmpty={true} />
      </main>
      <Footer />
    </div>
  );
};
