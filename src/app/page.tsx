'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PublicNav from '@/components/shared/PublicNav';
import UpcomingAppointmentBar from '@/components/home/UpcomingAppointmentBar';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
import LocationLine from '@/components/home/LocationLine';
import SearchPill from '@/components/home/SearchPill';
import HomeFilterSheet from '@/components/home/HomeFilterSheet';
import HomeFeaturedSpotlight from '@/components/home/HomeFeaturedSpotlight';
import { FeaturedSkeleton } from '@/components/home/HomeSkeletons';
import HomeCategories from '@/components/home/HomeCategories';
import HomeNearShops from '@/components/home/HomeNearShops';
import HomeServices from '@/components/home/HomeServices';
import HomeFooter from '@/components/home/HomeFooter';
import { useHomeLocation } from '@/components/home/useHomeLocation';
import { useDiscoverData } from '@/components/home/useDiscoverData';
import LocationGate from '@/components/home/gate/LocationGate';
import { useLocationGate } from '@/components/home/gate/useLocationGate';
import { DEFAULT_NEAR_FILTERS, activeFilterCount, type NearFilters } from '@/components/home/homeFilters';

export default function HomePage() {
  const router = useRouter();
  const place = useHomeLocation();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<NearFilters>(DEFAULT_NEAR_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const data = useDiscoverData(place.location, filters);
  // Opening sequence (pinpoint → find shops → page). The sections keep loading behind it.
  const gate = useLocationGate(place);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (filters.radiusKm !== null) params.set('radius_km', String(filters.radiusKm));
    if (filters.status !== 'all') params.set('open', filters.status);
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : '/search');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {/* Both stacked inside one sticky wrapper so the reminder bar and the header pin together. */}
      <div className="sticky top-0 z-50">
        <UpcomingAppointmentBar />
        <PublicNav isSticky={false} />
      </div>

      {gate.phase !== 'done' ? (
        <LocationGate
          phase={gate.phase}
          denied={gate.denied}
          unavailable={gate.unavailable}
          farKm={gate.farKm}
          onRetry={gate.retry}
          onEnter={gate.enter}
          onUseDefault={gate.useDefault}
        />
      ) : (
        <>
          <main className="mx-auto w-full max-w-[960px] flex-1 space-y-12 px-6 pb-6 pt-1 sm:space-y-16 sm:px-12 sm:pb-10 sm:pt-3 lg:px-0">
            <h1 className="sr-only">Find a tailor in Davao City</h1>
            <div>
              <PageBrandRow />
              <LocationLine location={place.location} changeHref="/location?returnTo=/" />
              <div className="mt-4">
                <SearchPill
                  large
                  value={query}
                  onChange={setQuery}
                  onSubmit={handleSearch}
                  onOpenFilter={() => setFilterOpen(true)}
                  activeFilterCount={activeFilterCount(filters)}
                />
              </div>
            </div>
            {/* Only shops whose plan gives them top placement; a placeholder while loading, absent when there are none. */}
            {data.featuredLoading ? (
              <FeaturedSkeleton />
            ) : (
              data.featured.length > 0 && <HomeFeaturedSpotlight stores={data.featured} trendingItems={data.trending} />
            )}
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
            />
            <HomeServices services={data.services} loading={data.servicesLoading} />
          </main>

          <HomeFooter narrow />
        </>
      )}

      <HomeFilterSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} value={filters} onApply={(f) => setFilters({ radiusKm: f.radiusKm, status: f.status })} />
    </div>
  );
}
