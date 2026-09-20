'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { LocateFixed, X, MapPin, Search, SlidersHorizontal, ArrowLeft, Check, Navigation } from 'lucide-react';
import type { Map as LeafletMap } from 'leaflet';
import api from '@/lib/axios';
import { getMediaUrl } from '@/lib/media';
import { useGuestGatedHref } from '@/hooks/useGuestGatedHref';
import { getSavedLocation, saveLocationWithHistory, type SavedLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import { isShopOpen, type OperatingHours } from '@/lib/shopStatus';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';

const DISTRICTS = ['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'];
const DAVAO_CENTER: [number, number] = [7.0731, 125.6128];

// Leaflet touches `window` — must be client-only
const DiscoveryMap = dynamic(() => import('@/components/discovery/DiscoveryMap'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
      Loading map…
    </div>
  ),
});

interface ShopApiBranch {
  id: number;
  name: string;
  is_main: boolean;
  address: string | null;
  city: string | null;
  landmark: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
}

interface ShopApiResult {
  slug: string;
  name: string;
  logo_path: string | null;
  operating_hours?: OperatingHours | string | null;
  branches: ShopApiBranch[];
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-sm text-ink-muted">Loading map…</div>}>
      <MapPageContent />
    </Suspense>
  );
}

function MapPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gate = useGuestGatedHref();
  const mapRef = useRef<LeafletMap | null>(null);

  // Mode: "select" (from Choose on Map) vs "browse" (default map view)
  const isSelectMode = searchParams.get('select') === '1' || searchParams.get('mode') === 'select' || searchParams.get('mode') === 'map';
  const returnTo = searchParams.get('returnTo') || null;
  const continueTo = searchParams.get('continueTo') || null;

  // Sequential backward navigation: always step back in history if available
  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    if (returnTo) {
      router.replace(returnTo);
    } else {
      router.replace('/');
    }
  }

  const [selectedBranch, setSelectedBranch] = useState<DiscoveryMapBranch | null>(null);
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [branches, setBranches] = useState<DiscoveryMapBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Center coordinate and reverse-geocoded address for selectable mode
  const [pickerCoords, setPickerCoords] = useState<[number, number]>(DAVAO_CENTER);
  const [pickedAddress, setPickedAddress] = useState<string>('');
  const [pickedDistrict, setPickedDistrict] = useState<string>('');
  const [reverseLoading, setReverseLoading] = useState(false);
  const geocodeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize saved location if present
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved?.lat && saved?.lng) {
      setUserLocation({ lat: saved.lat, lng: saved.lng });
      setPickerCoords([saved.lat, saved.lng]);
      setPickedAddress(saved.address || '');
      setPickedDistrict(saved.district || '');
    }
  }, []);

  // Sync if URL search params change
  useEffect(() => {
    const incomingQ = searchParams.get('q');
    if (incomingQ !== null) setQ(incomingQ);
    const incomingDistrict = searchParams.get('district');
    if (incomingDistrict !== null) setDistrict(incomingDistrict);
  }, [searchParams]);

  // Reverse geocoding on map move in selectable mode
  const handleMapMoveEnd = useCallback((lat: number, lng: number) => {
    if (!isSelectMode) return;

    setPickerCoords((prev) => {
      if (prev && Math.abs(prev[0] - lat) < 0.0001 && Math.abs(prev[1] - lng) < 0.0001) {
        return prev;
      }
      return [lat, lng];
    });

    if (geocodeTimeout.current) clearTimeout(geocodeTimeout.current);
    geocodeTimeout.current = setTimeout(async () => {
      setReverseLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        setPickedAddress(data?.display_name ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        const d = data?.address?.suburb || data?.address?.neighbourhood || data?.address?.city_district || '';
        if (d) setPickedDistrict(d);
      } catch {
        setPickedAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } finally {
        setReverseLoading(false);
      }
    }, 350);
  }, [isSelectMode]);

  // Geocode address search or fly to search query
  async function handleSearchSubmit() {
    const text = q.trim();
    if (!text) return;

    // Check for pasted Maps link coordinates
    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      mapRef.current?.setView([parsed.lat, parsed.lng], 16);
      handleMapMoveEnd(parsed.lat, parsed.lng);
      return;
    }

    // Attempt Nominatim forward geocoding
    try {
      const cleaned = cleanLocationQuery(text);
      const queryText = cleaned.toLowerCase().includes('davao') ? cleaned : `${cleaned}, Davao City`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(queryText)}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=3&countrycodes=ph`
      );
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current?.setView([lat, lng], 16);
        handleMapMoveEnd(lat, lng);
        setPickedAddress(data[0].display_name);
      }
    } catch {
      // Keep store filter query
    }
  }

  function handleNearMe() {
    if (userLocation && !isSelectMode) {
      setUserLocation(null);
      return;
    }
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        mapRef.current?.setView([latitude, longitude], 15);
        handleMapMoveEnd(latitude, longitude);
        setLocating(false);
      },
      () => {
        setLocationError('Could not get your location. Check browser location permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Confirm picked location
  function handleConfirmPickedLocation(customLoc?: SavedLocation) {
    const loc: SavedLocation = customLoc || {
      lat: pickerCoords[0],
      lng: pickerCoords[1],
      address: pickedAddress || `${pickerCoords[0].toFixed(4)}, ${pickerCoords[1].toFixed(4)}`,
      district: pickedDistrict || district || 'Davao City',
    };
    saveLocationWithHistory(loc);

    // Destination after location confirmation
    const dest = continueTo || (returnTo && returnTo !== '/' ? returnTo : '/search');
    const query = q.trim();
    if (query && !dest.includes('q=')) {
      const sep = dest.includes('?') ? '&' : '?';
      router.push(`${dest}${sep}q=${encodeURIComponent(query)}`);
    } else {
      router.push(dest);
    }
  }

  // Fetch stores from API
  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = { per_page: '50' };
      if (q.trim()) params.q = q.trim();
      if (district && district !== 'all') params.district = district;
      if (userLocation) {
        params.lat = String(userLocation.lat);
        params.lng = String(userLocation.lng);
        params.sort_by = 'distance';
      }

      api.get('/public/shops', { params })
        .then((res) => {
          const shops: ShopApiResult[] = res.data.data ?? [];
          const pins: DiscoveryMapBranch[] = shops.flatMap((shop) => {
            const open = isShopOpen(shop.operating_hours);
            return (shop.branches ?? [])
              .filter((b) => b.latitude != null && b.longitude != null && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude)))
              .map((b) => ({
                shopSlug: shop.slug,
                shopName: shop.name,
                shopLogoPath: shop.logo_path,
                branchId: b.id,
                branchName: b.name,
                isMain: !!b.is_main,
                address: b.address,
                city: b.city,
                landmark: b.landmark,
                latitude: Number(b.latitude),
                longitude: Number(b.longitude),
                isOpen: open,
              }));
          });
          setBranches(pins);
        })
        .catch(() => setBranches([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(handle);
  }, [q, district, userLocation]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (statusFilter === 'online' && !b.isOpen) return false;
      if (statusFilter === 'offline' && b.isOpen) return false;
      return true;
    });
  }, [branches, statusFilter]);

  const hasActiveFilters = Boolean((district && district !== 'all') || statusFilter !== 'all' || userLocation);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-canvas relative">
      {/* Header bar — with high z-index strictly above Leaflet panes */}
      <div className="relative z-[1100] flex items-center gap-2 px-3 h-14 border-b border-line shrink-0 bg-canvas">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="p-1.5 text-ink-muted hover:text-ink shrink-0 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 relative min-w-0">
          <button
            type="button"
            onClick={() => void handleSearchSubmit()}
            aria-label="Search"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink cursor-pointer"
          >
            <Search size={15} />
          </button>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleSearchSubmit(); }}
            placeholder={isSelectMode ? "Search address, store, or Maps link" : "Search stores, garment type…"}
            className="w-full bg-sunken border border-line rounded-full pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter button on right side — high z-index and click-ready */}
        <button
          type="button"
          onClick={() => setShowFilterDropdown((prev) => !prev)}
          aria-label="Filter stores and districts"
          className={`relative z-[1100] p-2 rounded-full border transition-colors shrink-0 cursor-pointer ${
            hasActiveFilters
              ? 'bg-taupe text-white border-taupe shadow-xs'
              : 'bg-surface text-ink-muted border-line hover:border-taupe'
          }`}
        >
          <SlidersHorizontal size={15} />
          {hasActiveFilters && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-canvas" />
          )}
        </button>
      </div>

      {/* Filter Dropdown — positioned with z-[1200] directly above all Leaflet layers */}
      {showFilterDropdown && (
        <>
          <div
            className="fixed inset-0 z-[1150]"
            onClick={() => setShowFilterDropdown(false)}
          />
          <div className="absolute left-2.5 right-2.5 top-[60px] z-[1200] bg-surface border border-line rounded-2xl p-3.5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-line/70">
              <span className="text-xs font-bold text-ink">Filter Stores & Districts</span>
              <button
                type="button"
                onClick={() => setShowFilterDropdown(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-full hover:bg-sunken cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* District selector */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint block mb-1">
                District
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-taupe"
              >
                <option value="">All Districts</option>
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Store status: All / Online (Open) / Offline (Closed) with green & red indicator dots */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint block mb-1.5">
                Store Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-ink text-white border-ink font-semibold'
                      : 'bg-canvas text-ink-body border-line hover:border-taupe'
                  }`}
                >
                  All Stores
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('online')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    statusFilter === 'online'
                      ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs'
                      : 'bg-canvas text-ink-body border-line hover:border-emerald-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block shrink-0 shadow-xs" />
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('offline')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    statusFilter === 'offline'
                      ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
                      : 'bg-canvas text-ink-body border-line hover:border-rose-600'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#ef4444] inline-block shrink-0 shadow-xs" />
                  Closed
                </button>
              </div>
            </div>

            {/* Near Me sort button */}
            <button
              type="button"
              onClick={handleNearMe}
              disabled={locating}
              className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-60 cursor-pointer ${
                userLocation ? 'bg-taupe border-taupe text-white' : 'bg-canvas border-line text-ink'
              }`}
            >
              <LocateFixed size={14} />
              {locating ? 'Locating…' : userLocation ? 'Near Me: On (sorted by distance)' : 'Sort by Near Me'}
            </button>

            {/* Footer with Reset button when filters are active */}
            {hasActiveFilters && (
              <div className="flex items-center justify-end pt-1 text-[10px] text-ink-muted border-t border-line/60">
                <button
                  type="button"
                  onClick={() => {
                    setDistrict('');
                    setStatusFilter('all');
                    setUserLocation(null);
                  }}
                  className="text-taupe font-bold hover:underline cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Main Map Canvas */}
      <div className="flex-1 relative overflow-hidden z-0">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-muted">
            Loading stores…
          </div>
        ) : (
          <DiscoveryMap
            fullScreen
            branches={filteredBranches}
            userLocation={userLocation}
            onSelectBranch={setSelectedBranch}
            selectable={isSelectMode}
            onMoveEnd={isSelectMode ? handleMapMoveEnd : undefined}
            mapRef={mapRef}
            disableFitBounds={isSelectMode}
          />
        )}

        {/* GPS Quick Button on bottom-right of map */}
        <button
          type="button"
          onClick={handleNearMe}
          disabled={locating}
          className="absolute bottom-3 right-3 z-[400] w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-taupe shadow-md hover:bg-sunken disabled:opacity-60 cursor-pointer"
          aria-label="Use my current location"
        >
          <LocateFixed size={18} className={locating ? 'animate-pulse' : ''} />
        </button>

        {locationError && (
          <div className="absolute top-2 left-2 right-2 z-[1000] flex items-start gap-2 text-xs text-danger bg-surface shadow-lg rounded-xl px-3 py-2 border border-danger/20">
            <span className="flex-1">{locationError}</span>
            <button type="button" onClick={() => setLocationError('')} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Selected Branch Detail Bottom Sheet / Card */}
      {selectedBranch && (
        <div
          className="fixed bottom-0 left-0 right-0 max-w-[320px] mx-auto z-[1200] bg-surface border-t border-line rounded-t-2xl shadow-lg p-3 space-y-2.5 animate-in slide-in-from-bottom-5 duration-150"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex items-center gap-2.5">
            <Link
              href={gate(`/shop/${selectedBranch.shopSlug}`)}
              className="relative w-10 h-10 rounded-full overflow-hidden border border-line shrink-0 bg-sunken transition-transform active:scale-95 block"
              title="View Store"
            >
              {selectedBranch.shopLogoPath ? (
                <Image src={getMediaUrl(selectedBranch.shopLogoPath)} alt={selectedBranch.shopName} fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-ink-muted">
                  {selectedBranch.shopName.charAt(0)}
                </div>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Link
                  href={gate(`/shop/${selectedBranch.shopSlug}`)}
                  className="font-semibold text-xs text-ink truncate block hover:text-taupe transition-colors leading-tight"
                >
                  {selectedBranch.shopName}
                </Link>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold shrink-0 ${
                  selectedBranch.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${selectedBranch.isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                  {selectedBranch.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              <p className="flex items-center gap-1 text-[10px] text-ink-muted leading-tight mt-0.5 truncate">
                <MapPin size={10} className="text-taupe shrink-0" />
                <span className="truncate">{selectedBranch.isMain ? 'Main Branch' : selectedBranch.branchName}{selectedBranch.address ? ` • ${selectedBranch.address}` : ''}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBranch(null)}
              aria-label="Close"
              className="shrink-0 text-ink-faint hover:text-ink p-1 -mr-1 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Action buttons */}
          {isSelectMode ? (
            <button
              type="button"
              onClick={() => handleConfirmPickedLocation({
                lat: selectedBranch.latitude,
                lng: selectedBranch.longitude,
                address: `${selectedBranch.shopName} - ${selectedBranch.address || selectedBranch.city || 'Davao City'}`,
                district: selectedBranch.city || 'Davao City',
              })}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-taupe text-white text-xs font-semibold hover:bg-taupe-hover transition-colors shadow-xs cursor-pointer"
            >
              <Check size={15} /> Choose this Store Location
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href={gate(`/shop/${selectedBranch.shopSlug}/book`)}
                className="flex-1 bg-ink hover:bg-taupe text-white font-medium h-8 transition-colors flex items-center justify-center rounded-lg text-xs"
              >
                Book Now
              </Link>
              <a
                href={`https://www.google.com/maps/dir/?api=1&${userLocation ? `origin=${userLocation.lat},${userLocation.lng}&` : ''}destination=${selectedBranch.latitude},${selectedBranch.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-line-strong hover:border-ink text-ink-body font-medium h-8 transition-colors flex items-center justify-center rounded-lg text-xs"
              >
                Direction
              </a>
              <button
                type="button"
                onClick={() => handleConfirmPickedLocation({
                  lat: selectedBranch.latitude,
                  lng: selectedBranch.longitude,
                  address: `${selectedBranch.shopName} - ${selectedBranch.address || selectedBranch.city || 'Davao City'}`,
                  district: selectedBranch.city || 'Davao City',
                })}
                title="Set as My Location"
                className="px-2.5 h-8 border border-line hover:border-taupe text-taupe font-medium rounded-lg text-xs flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <Navigation size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Select Mode Footer: Confirm custom picked location when no branch is actively selected */}
      {isSelectMode && !selectedBranch && (
        <div
          className="shrink-0 border-t border-line p-3 space-y-2.5 bg-canvas z-10"
          style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-0.5">Address</p>
            <p className="text-xs text-ink font-medium leading-snug line-clamp-2">
              {reverseLoading ? 'Locating address…' : (pickedAddress || 'Move the map or tap a store to choose a spot')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleConfirmPickedLocation()}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-taupe text-white text-xs font-semibold hover:bg-taupe-hover transition-colors shadow-xs cursor-pointer"
          >
            <Check size={15} /> Choose this Location
          </button>
        </div>
      )}
    </div>
  );
}
