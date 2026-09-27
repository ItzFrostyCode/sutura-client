'use client';

import PublicNav from '@/components/shared/PublicNav';
import UpcomingAppointmentBar from '@/components/home/UpcomingAppointmentBar';
import { useHomeData } from '@/components/home/useHomeData';
import HomeHero from '@/components/home/HomeHero';
import HomeFeaturedSpotlight from '@/components/home/HomeFeaturedSpotlight';
import HomeQuickHub from '@/components/home/HomeQuickHub';
import HomeCategoryGrid from '@/components/home/HomeCategoryGrid';
import HomeShowroomCarousel from '@/components/home/HomeShowroomCarousel';
import HomeHowItWorks from '@/components/home/HomeHowItWorks';
import HomeStoresGrid from '@/components/home/HomeStoresGrid';
import HomeMapBanner from '@/components/home/HomeMapBanner';
import HomeAboutSection from '@/components/home/HomeAboutSection';
import HomeFooter from '@/components/home/HomeFooter';
export default function HomePage() {
  const {
    items,
    loading,
    stores,
    storesLoading,
    trendingItems,
    trendingLoading,
    heroSearch,
    setHeroSearch,
    handleHeroSearch,
  } = useHomeData();

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      {/* Both stacked inside one sticky wrapper — UpcomingAppointmentBar is
          not sticky on its own, so the two pin together as a single unit
          instead of each fighting over its own independent `top: 0`. */}
      <div className="sticky top-0 z-50">
        <UpcomingAppointmentBar />
        <PublicNav isSticky={false} />
      </div>

      <HomeHero
        heroSearch={heroSearch}
        onSearchChange={setHeroSearch}
        onSubmit={handleHeroSearch}
      />

      <main className="flex-1 w-full">
        <HomeFeaturedSpotlight
          stores={stores}
          trendingItems={trendingItems}
          loading={storesLoading || trendingLoading}
        />
        <HomeQuickHub />
        <HomeCategoryGrid items={items} />
        <HomeShowroomCarousel items={items} loading={loading} />
        <HomeHowItWorks />
        <HomeStoresGrid stores={stores} storesLoading={storesLoading} />
        <HomeMapBanner />
      </main>

      <HomeAboutSection />
      <HomeFooter />
    </div>
  );
}
