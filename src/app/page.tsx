'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import HomeFilterSheet from '@/components/home/HomeFilterSheet';
import { DEFAULT_ALL_FILTERS, DEFAULT_MORE_FILTERS, countAllFilters, type AllFilters } from '@/components/home/homeFilters';
import { addRecentSearch } from '@/lib/recentSearches';
import { getSavedLocation, requestCurrentLocation } from '@/lib/customerLocation';

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
  const router = useRouter();
  const [filters, setFilters] = useState<AllFilters>(DEFAULT_ALL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  // The hero search opens the Map (/search) with the text and every filter picked in the sheet.
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!getSavedLocation()) requestCurrentLocation();
    const params = new URLSearchParams();
    const query = heroSearch.trim();
    // A specialty narrows the shops on the map: the search page reads a category key from garment_type.
    if (filters.category) { params.set('garment_type', filters.category); params.set('tab', 'store'); }
    if (query) { params.set('q', query); addRecentSearch(query); } // also shows in the Map's recent searches
    if (filters.radiusKm !== null) params.set('radius_km', String(filters.radiusKm));
    if (filters.status !== 'all') params.set('open', filters.status);
    if (filters.minPrice) params.set('min_price', filters.minPrice);
    if (filters.maxPrice) params.set('max_price', filters.maxPrice);
    if (filters.minRating) params.set('min_rating', filters.minRating);
    if (filters.province) { params.set('province', filters.province); params.set('tab', 'store'); }
    if (filters.city) params.set('city', filters.city);
    if (filters.district) { params.set('district', filters.district); params.set('tab', 'store'); }
    // Low to High is the default order, so only a changed order is sent.
    if (filters.sortBy && filters.sortBy !== DEFAULT_MORE_FILTERS.sortBy) params.set('sort_by', filters.sortBy);
    // From the landing the results open as a list (the Map's List view), not the map.
    params.set('view', 'list');
    router.push(`/search?${params.toString()}`);
  };

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
        onSubmit={handleSearch}
        onOpenFilter={() => setFilterOpen(true)}
        activeFilterCount={countAllFilters(filters)}
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

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} showMore onApply={setFilters} />
    </div>
  );
}
