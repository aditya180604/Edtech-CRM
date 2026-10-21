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
import { MobileHomeView } from '../components/mobile/MobileHomeView';
import { useIsMobile } from '../hooks/useIsMobile';

export const HomePage: React.FC = () => {
  const isMobile = useIsMobile(1023);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-[#FA5A36] selection:text-white">
      <Navbar />

      <main className="flex-1">
        {isMobile ? (
          <MobileHomeView />
        ) : (
          <div>
            <HeroSection />
            <StatsBar />
            <CategorySection />
            <FeaturedCourses />
            <PopularTopics />
            <LearningPathsSection />
            <LiveWebinarsSection />
            <TopInstructorsSection />
            <CtaBanner />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};
