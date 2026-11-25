'use client';

import PublicNav from '@/components/shared/PublicNav';
import UpcomingAppointmentBar from '@/components/home/UpcomingAppointmentBar';
import { useHomeData } from '@/components/home/useHomeData';
import HomeHero from '@/components/home/HomeHero';
import HomeFeaturedSpotlight from '@/components/home/HomeFeaturedSpotlight';
import HomeHowItWorks from '@/components/home/HomeHowItWorks';
import HomeStoresGrid from '@/components/home/HomeStoresGrid';
import HomeMapBanner from '@/components/home/HomeMapBanner';
import HomeAboutSection from '@/components/home/HomeAboutSection';
import HomeFooter from '@/components/home/HomeFooter';
import HomeShopCta from '@/components/home/HomeShopCta';
import LocationSplash from '@/components/home/LocationSplash';
import HomeLocationStatus from '@/components/home/HomeLocationStatus';

export default function HomePage() {
  const {
    location,
    locationStatus,
    stores,
    storesLoading,
    heroSearch,
    setHeroSearch,
    applyLocation,
  } = useHomeData();

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <LocationSplash onResolved={applyLocation} />
      {/* Both stacked inside one sticky wrapper — UpcomingAppointmentBar is
          not sticky on its own, so the two pin together as a single unit
          instead of each fighting over its own independent `top: 0`. */}
      <div className="sticky top-0 z-50">
        <UpcomingAppointmentBar />
        <PublicNav
          isSticky={false}
          featureNav
          start={<HomeLocationStatus status={locationStatus} location={location} />}
          mobileBar={<HomeLocationStatus variant="bar" status={locationStatus} location={location} />}
        />
      </div>

      <HomeHero
        heroSearch={heroSearch}
        onSearchChange={setHeroSearch}
      />

      <main className="flex-1 w-full">
        <HomeFeaturedSpotlight
          stores={stores}
          loading={storesLoading}
        />
        <HomeStoresGrid location={location} />
        <HomeHowItWorks />
        <HomeMapBanner />
      </main>

      <HomeAboutSection />
      <HomeShopCta />
      <HomeFooter />
    </div>
  );
}
