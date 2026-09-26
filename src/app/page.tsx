'use client';

import PublicNav from '@/components/shared/PublicNav';
import { useHomeData } from '@/components/home/useHomeData';
import HomeHero from '@/components/home/HomeHero';
import HomeFeaturedSpotlight from '@/components/home/HomeFeaturedSpotlight';
import HomeQuickHub from '@/components/home/HomeQuickHub';
import HomeCategoryGrid from '@/components/home/HomeCategoryGrid';
import HomeShowroomCarousel from '@/components/home/HomeShowroomCarousel';
import HomeHowItWorks from '@/components/home/HomeHowItWorks';
import HomeStoresGrid from '@/components/home/HomeStoresGrid';
import HomeMapBanner from '@/components/home/HomeMapBanner';
import HomeSublimationBanner from '@/components/home/HomeSublimationBanner';
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
      <PublicNav />

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
        <HomeSublimationBanner />
      </main>

      <HomeAboutSection />
      <HomeFooter />
    </div>
  );
}
