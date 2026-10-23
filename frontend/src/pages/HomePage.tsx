import React from 'react';
import { Navbar } from '../components/Navbar';
import { SEOHead } from '../components/SEOHead';
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

const homeSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://vstudyonline.srrsolutions.io/#website',
      url: 'https://vstudyonline.srrsolutions.io',
      name: 'VStudyOnline',
      alternateName: ['V Study Online', 'VStudyOnline by SRR Solutions'],
      description:
        'The premier learning ecosystem empowering learners and educators with career-defining courses, live masterclasses, and verifiable skills.',
      publisher: {
        '@id': 'https://srrsolutions.io/#organization',
      },
    },
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://srrsolutions.io/#organization',
      name: 'SRR Solutions',
      url: 'https://srrsolutions.io',
      logo: 'https://vstudyonline.srrsolutions.io/Images/logo.png',
      sameAs: [
        'https://www.linkedin.com/company/srrsolutions',
        'https://github.com/srrsolutions',
        'https://www.crunchbase.com/organization/srr-solutions',
      ],
    },
  ],
};

export const HomePage: React.FC = () => {
  const isMobile = useIsMobile(1023);

  return (
    <>
      <SEOHead
        title="VStudyOnline — Learn Without Limits, Shape Your Future | SRR Solutions"
        description="VStudyOnline by SRR Solutions is the premier online learning ecosystem offering career-defining courses, live interactive masterclasses, CRM-backed mentorship, and verifiable industry skills."
        schema={homeSchema}
      />
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
    </>
  );
};
