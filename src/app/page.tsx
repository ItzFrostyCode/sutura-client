'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNav from '@/components/shared/PublicNav';
import UpcomingAppointmentBar from '@/components/home/UpcomingAppointmentBar';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
import LocationBar from '@/components/home/LocationBar';
import HomeHero from '@/components/home/HomeHero';
import HomeFilterBar from '@/components/home/HomeFilterBar';
import HomeHowItWorks from '@/components/home/HomeHowItWorks';
import HomeMapCta from '@/components/home/HomeMapCta';
import HomeFilterSheet from '@/components/home/HomeFilterSheet';
import HomeFeaturedSpotlight from '@/components/home/HomeFeaturedSpotlight';
import { FeaturedSkeleton } from '@/components/home/HomeSkeletons';
import HomeCategories from '@/components/home/HomeCategories';
import HomeNearShops from '@/components/home/HomeNearShops';
import HomeFooter from '@/components/home/HomeFooter';
import { useHomeLocation } from '@/components/home/useHomeLocation';
import { useDiscoverData } from '@/components/home/useDiscoverData';
import LocationGate from '@/components/home/gate/LocationGate';
import { useLocationGate } from '@/components/home/gate/useLocationGate';
import { DEFAULT_ALL_FILTERS, countAllFilters, type AllFilters } from '@/components/home/homeFilters';

export default function HomePage() {
  const router = useRouter();
  const place = useHomeLocation();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<AllFilters>(DEFAULT_ALL_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const data = useDiscoverData(place.location, filters);
  // Opening sequence (pinpoint → find shops → page). The sections keep loading behind it.
  const gate = useLocationGate(place);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    // A specialty narrows the shops on the map: the search page reads a category key from garment_type.
    if (filters.category) { params.set('garment_type', filters.category); params.set('tab', 'store'); }
    if (query.trim()) params.set('q', query.trim());
    if (filters.radiusKm !== null) params.set('radius_km', String(filters.radiusKm));
    if (filters.status !== 'all') params.set('open', filters.status);
    if (filters.minPrice) params.set('min_price', filters.minPrice);
    if (filters.maxPrice) params.set('max_price', filters.maxPrice);
    if (filters.minRating) params.set('min_rating', filters.minRating);
    if (filters.sortBy) params.set('sort_by', filters.sortBy);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {/* Both stacked inside one sticky wrapper so the reminder bar and the header pin together. */}
      <div className="sticky top-0 z-50">
        {gate.phase === 'done' && <LocationBar location={place.location} changeHref="/location?returnTo=/" />}
        <UpcomingAppointmentBar />
        <PublicNav isSticky={false} />
      </div>

      {gate.phase !== 'done' ? (
        <LocationGate phase={gate.phase} denied={gate.denied} farKm={gate.farKm} onRetry={gate.retry} onEnter={gate.enter} />
      ) : (
        <>
          <main className="mx-auto w-full max-w-[960px] flex-1 space-y-7 px-6 pb-6 pt-4 sm:space-y-9 sm:px-12 sm:pb-10 lg:px-0">
            <div>
              <PageBrandRow />
              <div className="mt-4">
                <HomeHero query={query} onQueryChange={setQuery} onSubmit={handleSearch} onOpenFilter={() => setFilterOpen(true)} activeFilterCount={countAllFilters(filters)} />
              </div>
            </div>
            {/* Only shops whose plan gives them top placement; a placeholder while loading, absent when there are none. */}
            <div className="-mt-1 sm:-mt-2">
              {data.featuredLoading ? (
                <FeaturedSkeleton />
              ) : (
                data.featured.length > 0 && <HomeFeaturedSpotlight stores={data.featured} trendingItems={data.trending} />
              )}
            </div>
            <HomeCategories />
            <HomeNearShops
              location={place.location}
              denied={place.denied}
              locating={place.locating}
              stores={data.near}
              loading={data.nearLoading}
              filters={filters}
              onRequestLocation={place.request}
              onResetDistance={() => setFilters({ ...filters, radiusKm: null })}
              onResetStatus={() => setFilters({ ...filters, status: 'all' })}
              filterBar={<HomeFilterBar value={filters} onChange={setFilters} />}
            />
            <HomeHowItWorks embedded />
            <HomeMapCta />
          </main>

          <HomeFooter narrow />
        </>
      )}

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} showMore onApply={setFilters} />
    </div>
  );
}
