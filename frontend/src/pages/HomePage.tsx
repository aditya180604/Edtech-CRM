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

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-between selection:bg-[#FA5A36] selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* =========================================================================
            DESKTOP VIEW (Screens >= 1024px / lg)
            Matches Reference Image 3 for larger screens
           ========================================================================= */}
        <div className="hidden lg:block">
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

        {/* =========================================================================
            DEDICATED MOBILE & TABLET VIEW (Screens < 1024px)
            Matches Reference Images 3 & 4 with dedicated touch sliders & clean layout
           ========================================================================= */}
        <div className="block lg:hidden">
          <MobileHomeView />
        </div>
      </main>

      <Footer />
    </div>
  );
};
