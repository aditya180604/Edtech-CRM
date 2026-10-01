import React from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { StatsBar } from '../components/StatsBar';
import { CategorySection } from '../components/CategorySection';
import { FeaturedCourses } from '../components/FeaturedCourses';
import { PopularTopics } from '../components/PopularTopics';
import { LearningPathsSection } from '../components/LearningPathsSection';
import { LiveWebinarsSection } from '../components/LiveWebinarsSection';
import { TopInstructorsSection } from '../components/TopInstructorsSection';
import { CtaBanner } from '../components/CtaBanner';
import { Footer } from '../components/Footer';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBar />
        <CategorySection />
        <FeaturedCourses />
        <PopularTopics />
        <LearningPathsSection />
        <LiveWebinarsSection />
        <TopInstructorsSection />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
};
