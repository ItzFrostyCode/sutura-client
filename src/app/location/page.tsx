'use client';

import { Suspense } from 'react';
import { LocateFixed, Map as MapIcon, ChevronRight, HelpCircle, MapPin } from 'lucide-react';
import LocationHeader from '@/components/location/LocationHeader';
import HomeLocationCard from '@/components/location/HomeLocationCard';
import RecentLocationsList from '@/components/location/RecentLocationsList';
import SuggestedLocationsList from '@/components/location/SuggestedLocationsList';
import SetHomeModal from '@/components/location/SetHomeModal';
import { useLocationPageState } from '@/components/location/hooks/useLocationPageState';

function LocationPageContent() {
  const l = useLocationPageState();

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-10 relative">
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
        activeTab={l.activeTab}
        setActiveTab={l.setActiveTab}
      />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 space-y-4">
        {/* Search Results */}
        {l.searchResults.length > 0 && (
          <div className="bg-surface border border-line rounded-2xl p-3 shadow-xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint px-2 pb-1">
              Search Results
            </p>
            {l.searchResults.map((res, i) => (
              <button
                key={`${res.lat}-${res.lng}-${i}`}
                type="button"
                onClick={() =>
                  l.handleSelectLocation({
                    lat: res.lat,
                    lng: res.lng,
                    address: res.display_name,
                    district: res.display_name.split(',')[1]?.trim() || 'Davao City',
                  })
                }
                className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-sunken text-left transition-colors cursor-pointer"
              >
                <MapPin size={17} className="text-taupe shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink line-clamp-1">
                    {res.display_name.split(',')[0]}
                  </p>
                  <p className="text-xs text-ink-muted line-clamp-1">{res.display_name}</p>
                </div>
                <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
              </button>
            ))}
          </div>
        )}

        {l.searchError && (
          <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-medium">
            {l.searchError}
          </div>
        )}

        {/* Location Selection Options */}
        <section className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={l.handleUseCurrentGps}
            disabled={l.locatingCurrent}
            className="w-full flex items-start gap-3.5 p-3.5 text-left hover:bg-sunken active:bg-sunken transition-colors cursor-pointer disabled:opacity-50"
          >
            <div className="w-9 h-9 rounded-full bg-taupe/10 text-taupe flex items-center justify-center shrink-0 mt-0.5">
              <LocateFixed size={19} className={l.locatingCurrent ? 'animate-pulse' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-ink">Current location</span>
                {l.locatingCurrent && (
                  <span className="text-[10px] text-taupe font-semibold animate-pulse">
                    Detecting GPS…
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                {l.currentAddressPreview || 'Use device GPS to find nearest tailors'}
              </p>
            </div>
            <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
          </button>

          <button
            type="button"
            onClick={() =>
              l.router.push(
                l.outgoingQ
                  ? `/map?q=${encodeURIComponent(l.outgoingQ)}&select=1&returnTo=/location&continueTo=/location`
                  : '/map?select=1&returnTo=/location&continueTo=/location'
              )
            }
            className="w-full flex items-start gap-3.5 p-3.5 text-left hover:bg-sunken active:bg-sunken transition-colors cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-taupe/10 text-taupe flex items-center justify-center shrink-0 mt-0.5">
              <MapIcon size={19} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-ink">Choose on Map</span>
              <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                Pin any exact location on SUTURA Interactive Map
              </p>
            </div>
            <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
          </button>
        </section>

        {/* Home Address Section */}
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

        {/* Recent Locations Tab */}
        {l.activeTab === 'recent' && (
          <RecentLocationsList
            recents={l.recents}
            onClearAll={l.handleClearAllRecents}
            onSelectLocation={l.handleSelectLocation}
            onDeleteRecent={l.handleDeleteRecent}
            getDistanceLabel={l.getDistanceLabel}
          />
        )}

        {/* Suggested Locations Tab */}
        {l.activeTab === 'suggested' && (
          <SuggestedLocationsList
            dynamicSuggested={l.dynamicSuggested}
            loadingStores={l.loadingStores}
            hubCategory={l.hubCategory}
            setHubCategory={l.setHubCategory}
            onSelectLocation={l.handleSelectLocation}
            getDistanceLabel={l.getDistanceLabel}
          />
        )}

        {/* Need Help Section */}
        <section className="space-y-2 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint px-1">Need help?</p>
          <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
            <div className="flex items-start gap-3 p-3.5">
              <HelpCircle size={16} className="text-ink-muted shrink-0 mt-0.5" />
              <p className="text-xs text-ink-muted leading-relaxed">
                Locations are saved locally to your device. You can find stores near your{' '}
                <strong>home address</strong> even when you&apos;re far from it — just tap <em>Use</em>.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Set Home Modal */}
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
        <div className="min-h-screen bg-canvas flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-taupe border-t-transparent animate-spin" />
        </div>
      }
    >
      <LocationPageContent />
    </Suspense>
  );
}
