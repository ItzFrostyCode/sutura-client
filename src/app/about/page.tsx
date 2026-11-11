import type { Metadata } from 'next';
import AboutContent from '@/components/about/AboutContent';
import HomeHowItWorks from '@/components/home/HomeHowItWorks';
import HomeFooter from '@/components/home/HomeFooter';

export const metadata: Metadata = {
  title: 'About SUTURA',
  description: 'SUTURA is a web-based tailoring store tracker for Davao City: find verified tailoring shops by garment and location, and follow your order from placement to pickup.',
};

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <main className="flex-1">
        <AboutContent />
        <div className="pb-12 sm:pb-14">
          <HomeHowItWorks />
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
