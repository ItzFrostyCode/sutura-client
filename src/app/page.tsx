'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeHero from '@/components/home/HomeHero';
import HomeFilterBar from '@/components/home/HomeFilterBar';
import HomeStepsStrip from '@/components/home/HomeStepsStrip';
import HomeShopOwnerCta from '@/components/home/HomeShopOwnerCta';
import HomeTrackStrip from '@/components/home/HomeTrackStrip';
import HomeMapDistricts from '@/components/home/HomeMapDistricts';
import { HOME_COLUMN } from '@/components/home/homeLayout';
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
import { addRecentSearch } from '@/lib/recentSearches';

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
    if (query.trim()) { params.set('q', query.trim()); addRecentSearch(query); } // also shows in the Map's recent searches
    if (filters.radiusKm !== null) params.set('radius_km', String(filters.radiusKm));
    if (filters.status !== 'all') params.set('open', filters.status);
    if (filters.minPrice) params.set('min_price', filters.minPrice);
    if (filters.maxPrice) params.set('max_price', filters.maxPrice);
    if (filters.minRating) params.set('min_rating', filters.minRating);
    if (filters.district) { params.set('district', filters.district); params.set('tab', 'store'); }
    if (filters.sortBy) params.set('sort_by', filters.sortBy);
    // A search from Discover opens the LIST of results straight away (the Map's List view), not the map.
    params.set('view', 'list');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-1 flex-col bg-canvas">

      {gate.phase !== 'done' ? (
        <LocationGate phase={gate.phase} denied={gate.denied} farKm={gate.farKm} onRetry={gate.retry} onEnter={gate.enter} />
      ) : (
        <>
          {/* Each section serves a thesis objective: search by garment (hero), order tracking, garments, featured
              (Premium placement), near shops (availability), map by area; then how it works and the shop subscription. */}
          <main className={`${HOME_COLUMN} animate-rise flex-1 space-y-8 pb-6 pt-6 sm:space-y-10 sm:pb-10 lg:pt-8`}>
            <HomeHero query={query} onQueryChange={setQuery} onSubmit={handleSearch} onOpenFilter={() => setFilterOpen(true)} activeFilterCount={countAllFilters(filters)} />
            <HomeTrackStrip />
            <HomeCategories />
            {/* Only shops whose plan gives them top placement; a placeholder while loading, absent when there are none. */}
            {data.featuredLoading ? (
              <FeaturedSkeleton />
            ) : (
              data.featured.length > 0 && <HomeFeaturedSpotlight stores={data.featured} trendingItems={data.trending} />
            )}
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
            <HomeMapDistricts />
            <HomeStepsStrip />
            <HomeShopOwnerCta />
          </main>

          <HomeFooter />
        </>
      )}

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} showMore onApply={setFilters} />
    </div>
  );
}
