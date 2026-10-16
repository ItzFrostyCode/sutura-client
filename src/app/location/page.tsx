'use client';

import { Suspense } from 'react';
import { LocateFixed, Map as MapIcon, HelpCircle, MapPin } from 'lucide-react';
import LocationHeader from '@/components/location/LocationHeader';
import LocationRow from '@/components/location/LocationRow';
import HomeLocationCard from '@/components/location/HomeLocationCard';
import RecentLocationsList from '@/components/location/RecentLocationsList';
import SetHomeModal from '@/components/location/SetHomeModal';
import { useLocationPageState } from '@/components/location/hooks/useLocationPageState';

function LocationPageContent() {
  const l = useLocationPageState();
  // The map's Back returns to this screen (with its own returnTo kept); choosing a place there goes on to where this screen was headed.
  const selfHref = `/location${l.returnTo ? `?returnTo=${encodeURIComponent(l.returnTo)}` : ''}`;
  const mapHref = `/map?${l.outgoingQ ? `q=${encodeURIComponent(l.outgoingQ)}&` : ''}select=1&returnTo=${encodeURIComponent(selfHref)}&continueTo=${encodeURIComponent(l.returnTo || '/location')}`;

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas pb-10 text-ink">
      <LocationHeader
        searchInputRef={l.searchInputRef}
        searchQuery={l.searchQuery}
        setSearchQuery={l.setSearchQuery}
        onSearch={l.handleSearch}
        onClearSearch={() => {
          l.setSearchQuery('');
          l.setSearchResults([]);
          l.setSearchError('');
        }}
        backHref={l.returnTo}
      />

      <main className="mx-auto w-full max-w-[640px] flex-1 space-y-8 px-6 pb-12 pt-4 sm:px-10">
        {l.searchResults.length > 0 && (
          <section className="card-soft p-2">
            {l.searchResults.map((res, i) => (
              <LocationRow
                key={`${res.lat}-${res.lng}-${i}`}
                icon={<MapPin size={22} />}
                title={res.display_name.split(',')[0]}
                subtitle={res.display_name}
                onClick={() => l.handleSelectLocation({ lat: res.lat, lng: res.lng, address: res.display_name, district: 'Davao City' })}
              />
            ))}
          </section>
        )}

        {l.searchError && <p className="mobile-body-sm rounded-2xl bg-danger/10 px-4 py-3 text-danger">{l.searchError}</p>}

        <section className="card-soft p-2">
          <LocationRow
            icon={<LocateFixed size={22} className={l.locatingCurrent ? 'animate-pulse' : ''} />}
            title="Current location"
            subtitle={l.locatingCurrent ? 'Detecting GPS…' : l.currentAddressPreview || 'Use device GPS to find the nearest tailors'}
            onClick={l.handleUseCurrentGps}
            disabled={l.locatingCurrent}
          />
          <LocationRow icon={<MapIcon size={22} />} title="Choose on map" subtitle="Pin any exact place on the map" onClick={() => l.router.push(mapHref)} />
        </section>

        <HomeLocationCard
          homeLocation={l.homeLocation}
          onOpenSetHome={() => l.setShowSetHome(true)}
          onSelectLocation={l.handleSelectLocation}
          onRemoveHome={() => {
            l.removeHomeLocation();
            l.setHomeLocation(null);
          }}
          getDistanceLabel={l.getDistanceLabel}
        />

        <RecentLocationsList
          recents={l.recents}
          onClearAll={l.handleClearAllRecents}
          onSelectLocation={l.handleSelectLocation}
          onDeleteRecent={l.handleDeleteRecent}
          getDistanceLabel={l.getDistanceLabel}
        />

        <p className="mobile-body-sm flex items-start gap-3 px-1 text-ink-muted">
          <HelpCircle size={18} className="mt-0.5 shrink-0" />
          Places are saved on this device only. You can find stores near your home address even when you’re far from it — just tap Use.
        </p>
      </main>

      {l.showSetHome && (
        <SetHomeModal
          existing={l.homeLocation}
          onClose={() => l.setShowSetHome(false)}
          onSave={(loc) => {
            l.saveHomeLocation(loc);
            l.setHomeLocation(loc);
            l.setShowSetHome(false);
          }}
        />
      )}
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-taupe border-t-transparent" />
        </div>
      }
    >
      <LocationPageContent />
    </Suspense>
  );
}
