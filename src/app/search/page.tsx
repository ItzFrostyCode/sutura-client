'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { X, SlidersHorizontal, MapPin, RotateCcw, Search, Loader2 } from 'lucide-react';
import PublicNav from '@/components/shared/PublicNav';
import SearchStoresTab from '@/components/search/SearchStoresTab';
import SearchServicesTab from '@/components/search/SearchServicesTab';
import SearchShowroomTab from '@/components/search/SearchShowroomTab';
import SearchFilterDrawer from '@/components/search/SearchFilterDrawer';
import SearchWebFilterSidebar from '@/components/search/SearchWebFilterSidebar';
import { useSearchData } from '@/components/search/hooks/useSearchData';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

function SearchPageContent() {
  const s = useSearchData();
  const { scrollDirection, scrollY } = useScrollDirection();
  const isHiddenOnMobile = scrollDirection === 'down' && scrollY > 60;

  return (
    <div className="min-h-full flex flex-col bg-canvas animate-fade-page">
      {/* Facebook-style Unified Sticky Header: PublicNav + Location + Search + Tabs */}
      <div
        className={`sticky top-0 z-40 w-full transition-transform duration-300 ease-in-out will-change-transform ${
          isHiddenOnMobile
            ? 'max-sm:-translate-y-full max-sm:pointer-events-none'
            : 'max-sm:translate-y-0'
        } sm:translate-y-0`}
      >
        <PublicNav isSticky={false} />

        {/* Sticky Controls Bar: Location + Search + Tabs (Stores, Services, Catalog) */}
        <div className="w-full bg-canvas/95 backdrop-blur-md border-b border-line shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-2.5 pb-0">
            {/* Location row — Exact address on top, District on bottom + Box [Change] */}
            <div className="flex items-center justify-between gap-2 mb-2 min-h-[38px]">
              <button
                type="button"
                onClick={() => s.router.push(`/location${s.effectiveQ ? `?q=${encodeURIComponent(s.effectiveQ)}` : ''}`)}
                className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer group py-1"
                aria-label="Current location, tap to change"
              >
                <MapPin size={13} className="text-taupe shrink-0" />
                <div className="min-w-0 flex-1 flex flex-col">
                  <span className="text-xs font-semibold text-ink truncate group-hover:text-taupe transition-colors">
                    {s.savedLocation?.address || s.savedLocation?.district || s.district || 'Davao City'}
                  </span>
                  {s.savedLocation?.address && (s.savedLocation?.district || s.district) && (
                    <span className="text-[10px] text-ink-muted truncate">
                      {s.savedLocation?.district || s.district} District
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1.5 shrink-0">
                {s.oldLocation && (
                  <button
                    type="button"
                    onClick={s.handleToggleOldLocation}
                    title={`Switch back to old place: ${s.oldLocation.address}`}
                    aria-label="Switch back to old location"
                    className="p-1.5 text-ink-muted hover:text-ink shrink-0 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xs hover:bg-sunken transition-colors"
                  >
                    <RotateCcw size={13} />
                  </button>
                )}

                {/* Box [Change] button — sleek visual box (+2px up/down), 44px thumb touch target */}
                <button
                  type="button"
                  onClick={() => s.router.push(`/location${s.effectiveQ ? `?q=${encodeURIComponent(s.effectiveQ)}` : ''}`)}
                  aria-label="Change location"
                  className="relative inline-flex items-center justify-center shrink-0 cursor-pointer touch-manipulation group/change focus:outline-hidden"
                >
                  {/* Invisible thumb-friendly hit area: guarantees 44px touch target physics */}
                  <span className="absolute -inset-y-2 -inset-x-1.5" aria-hidden="true" />

                  {/* Visual Box: +2px up/down padding, smaller than 44px filter button, crisp borders */}
                  <span className="relative z-10 px-2.5 py-[5px] border border-line bg-surface group-hover/change:bg-sunken group-hover/change:border-ink/50 group-active/change:scale-95 text-[11px] sm:text-xs font-semibold tracking-wide text-ink transition-all flex items-center gap-1 shadow-2xs">
                    Change
                  </span>
                </button>
              </div>
            </div>

          {/* Search + Filter row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 flex items-center gap-2 h-11 px-3.5 border border-line bg-surface">
              <Search size={18} className="text-taupe shrink-0" />
              {/* Falls back to categoryLabel (e.g. "All Suits") when q is
                  empty, so arriving via a nav category link shows what
                  was clicked instead of the generic placeholder — typing
                  anything immediately overrides it since q becomes
                  non-empty. categoryLabel is purely for this display; it
                  never becomes a real filter value (see useSearchData). */}
              <input
                ref={s.searchInputRef}
                type="text"
                value={s.q || s.categoryLabel}
                onChange={(e) => s.setQ(e.target.value)}
                placeholder="Search Barong, Chiffon & tulle, Sublimation, Repair..."
                className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
              />
              {(s.q || s.categoryLabel) && (
                <button
                  type="button"
                  onClick={() => {
                    s.setQ('');
                    s.setCategoryLabel('');
                    s.searchInputRef.current?.focus();
                  }}
                  aria-label="Clear"
                  className="w-7 h-7 flex items-center justify-center shrink-0 text-ink-faint hover:text-ink cursor-pointer"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Mobile-only filter button */}
            <button
              type="button"
              onClick={s.openFilterPanel}
              className={`sm:hidden h-11 px-3.5 border transition-all shrink-0 flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                s.activeFilterCount > 0
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface text-ink-body border-line hover:bg-sunken'
              }`}
              aria-label="Open filter options"
              title="Filters"
            >
              <SlidersHorizontal size={16} />
              <span>Filter</span>
              {s.activeFilterCount > 0 && (
                <span className="w-5 h-5 bg-white/20 text-white text-[10px] font-bold flex items-center justify-center">
                  {s.activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Segmented Tabs: Stores, Services, Catalog (NO ALL) */}
          <div className="flex items-center justify-around sm:justify-start sm:gap-6 max-w-md sm:max-w-none mx-auto sm:mx-0">
            {(['store', 'services', 'showroom'] as const).map((tab) => {
              const isSelected = s.activeTab === tab;
              const label =
                tab === 'store' ? 'Stores' : tab === 'services' ? 'Services' : 'Catalog';
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => s.handleTabChange(tab)}
                  className={`min-h-[40px] py-1.5 text-sm font-semibold transition-all border-b-2 -mb-px px-3 sm:px-4 flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'border-ink text-ink font-bold'
                      : 'border-transparent text-ink-muted hover:text-ink font-normal'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-5 sm:py-6">
        <div className="flex items-start gap-8">
          {/* Results Stage */}
          <div className="flex-1 min-w-0">
            {/* Stores Section (Stores) */}
            {s.activeTab === 'store' && (
              <SearchStoresTab
                stores={s.stores}
                storesLoading={s.storesLoading}
                activeTab={s.activeTab}
                setActiveTab={s.setActiveTab}
                effectiveQ={s.effectiveQ}
                items={s.items}
                total={s.total}
                gate={s.gate}
                showFabric={s.showFabric}
                setShowFabric={s.setShowFabric}
                userCoords={s.userCoords}
              />
            )}

            {/* Services Section (Services) */}
            {s.activeTab === 'services' && (
              <SearchServicesTab
                services={s.services}
                servicesLoading={s.servicesLoading}
                servicesTotal={s.servicesTotal}
                stores={s.stores}
                activeTab={s.activeTab}
                effectiveQ={s.effectiveQ}
                gate={s.gate}
              />
            )}

            {/* Showroom / Catalog Section (Catalog) */}
            {s.activeTab === 'showroom' && (
              <SearchShowroomTab
                activeTab={s.activeTab}
                total={s.total}
                sortBy={s.sortBy}
                setSortBy={s.setSortBy}
                loading={s.loading}
                showFabric={s.showFabric}
                setShowFabric={s.setShowFabric}
                items={s.items}
                page={s.page}
                setPage={s.setPage}
                lastPage={s.lastPage}
                userCoords={s.userCoords}
              />
            )}
          </div>

          {/* Web Persistent Filter Sidebar (hidden on mobile, visible on sm+) — right side */}
          <div className="hidden sm:block">
            <SearchWebFilterSidebar
              specialization={s.specialization}
              setSpecialization={s.setSpecialization}
              department={s.department}
              color={s.color}
              setColor={s.setColor}
              onSelectQuery={(q) => s.setQ(q)}
              openNow={s.openNow}
              setOpenNow={s.setOpenNow}
              minPrice={s.minPrice}
              setMinPrice={s.setMinPrice}
              maxPrice={s.maxPrice}
              setMaxPrice={s.setMaxPrice}
              sortBy={s.sortBy}
              setSortBy={s.setSortBy}
              minRating={s.minRating}
              setMinRating={s.setMinRating}
              district={s.district}
              setDistrict={s.setDistrict}
              onReset={s.resetFilterPanel}
              activeFilterCount={s.activeFilterCount}
              activeTab={s.activeTab}
            />
          </div>
        </div>
      </main>

      {/* Filter Drawer Dropdown */}
      <SearchFilterDrawer
        isOpen={s.filterPanelOpen}
        onClose={() => s.setFilterPanelOpen(false)}
        activeFilterTab={s.activeFilterTab}
        setActiveFilterTab={s.setActiveFilterTab}
        draftSpecialization={s.draftSpecialization}
        setDraftSpecialization={s.setDraftSpecialization}
        department={s.department}
        draftColor={s.draftColor}
        setDraftColor={s.setDraftColor}
        draftOpenNow={s.draftOpenNow}
        setDraftOpenNow={s.setDraftOpenNow}
        draftMinPrice={s.draftMinPrice}
        setDraftMinPrice={s.setDraftMinPrice}
        draftMaxPrice={s.draftMaxPrice}
        setDraftMaxPrice={s.setDraftMaxPrice}
        draftMinRating={s.draftMinRating}
        setDraftMinRating={s.setDraftMinRating}
        draftDistrict={s.draftDistrict}
        setDraftDistrict={s.setDraftDistrict}
        sortBy={s.sortBy}
        setSortBy={s.setSortBy}
        onReset={s.resetFilterPanel}
        onApply={s.applyFilterPanel}
        activeTab={s.activeTab}
      />

      {/* Location Picker Full-screen Map Modal */}
      {s.locationPickerOpen && (
        <LocationPicker
          initial={s.savedLocation}
          onClose={() => s.setLocationPickerOpen(false)}
          onConfirm={(loc) => {
            s.saveLocation(loc);
            s.setSavedLocation(loc);
            s.setLocationPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-white">
          <Loader2 size={28} className="animate-spin text-ink-faint" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
