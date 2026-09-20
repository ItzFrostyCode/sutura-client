'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Search as SearchIcon,
  X,
  LocateFixed,
  Clock,
  MapPin,
  Map as MapIcon,
  HelpCircle,
  ChevronRight,
  Home,
  MoreVertical,
  Trash2,
  Navigation,
  Plus,
  CheckCircle2,
  Scissors,
  ShoppingBag,
} from 'lucide-react';
import api from '@/lib/axios';
import type { SavedLocation, RecentLocation, HomeLocation } from '@/lib/customerLocation';
import {
  getSavedLocation,
  saveLocationWithHistory,
  getRecentLocations,
  removeRecentLocation,
  clearRecentLocations,
  getHomeLocation,
  saveHomeLocation,
  removeHomeLocation,
  haversineKm,
} from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';

const LocationPicker = dynamic(() => import('@/components/discovery/LocationPicker'), { ssr: false });

export interface SuggestedHub extends SavedLocation {
  name: string;
  type: 'tailor_shop' | 'mall' | 'district' | 'landmark';
}

// Bounded within Davao City only (lat 6.85-7.40, lng 125.30-125.80)
const DAVAO_LANDMARKS: SuggestedHub[] = [
  // Commercial Malls & Tailoring Centers
  { name: 'Abreeza Ayala Mall', address: 'Abreeza Mall, J.P. Laurel Avenue, Bajada, Davao City', district: 'Bajada', lat: 7.0917, lng: 125.6105, type: 'mall' },
  { name: 'SM City Davao (Ecoland)', address: 'SM City Davao, Quimpo Boulevard, Ecoland, Matina, Davao City', district: 'Matina', lat: 7.0494, lng: 125.5908, type: 'mall' },
  { name: 'SM Lanang Premier', address: 'SM Lanang Premier, J.P. Laurel Ave, Lanang, Davao City', district: 'Lanang', lat: 7.0988, lng: 125.6322, type: 'mall' },
  { name: 'Gaisano Mall of Davao', address: 'Gaisano Mall, J.P. Laurel Ave, Bajada, Poblacion, Davao City', district: 'Poblacion', lat: 7.0776, lng: 125.6141, type: 'mall' },
  { name: 'NCCC Mall Buhangin', address: 'NCCC Mall Buhangin, Km 6, Buhangin, Davao City', district: 'Buhangin', lat: 7.1106, lng: 125.6119, type: 'mall' },
  { name: 'Victoria Plaza (NCCC VP)', address: 'Victoria Plaza Commercial Center, J.P. Laurel Ave, Bajada, Davao City', district: 'Bajada', lat: 7.0825, lng: 125.6146, type: 'mall' },
  { name: 'Gaisano Grand Mall Toril', address: 'Gaisano Grand Toril, MacArthur Highway, Toril, Davao City', district: 'Toril', lat: 7.0125, lng: 125.4909, type: 'mall' },

  // Key Davao Landmarks & Commercial Hubs
  { name: 'Ateneo de Davao University', address: 'Ateneo de Davao University, E. Jacinto St, Poblacion, Davao City', district: 'Poblacion', lat: 7.0718, lng: 125.6133, type: 'landmark' },
  { name: 'San Pedro Street / City Hall', address: 'San Pedro Street, Poblacion District, Davao City', district: 'Poblacion', lat: 7.0645, lng: 125.6083, type: 'landmark' },
  { name: 'Agdao Public Market', address: 'Agdao Public Market, Lapu-Lapu St, Agdao, Davao City', district: 'Agdao', lat: 7.0822, lng: 125.6268, type: 'landmark' },
  { name: 'Damosa Gateway Lanang', address: 'Damosa Gateway, Mamay Rd, Lanang, Davao City', district: 'Lanang', lat: 7.1042, lng: 125.6375, type: 'landmark' },
  { name: 'Matina Crossing / Center', address: 'Matina Crossing, MacArthur Highway, Matina, Davao City', district: 'Matina', lat: 7.0583, lng: 125.5861, type: 'district' },
  { name: 'Bangkal Junction', address: 'Bangkal, MacArthur Highway, Talomo, Davao City', district: 'Talomo', lat: 7.0425, lng: 125.5614, type: 'district' },
  { name: 'Mintal UP Junction', address: 'Mintal Proper, Tugbok District, Davao City', district: 'Tugbok', lat: 7.0875, lng: 125.5089, type: 'district' },
  { name: 'Calinan Public Market', address: 'Calinan Public Market, Calinan District, Davao City', district: 'Calinan', lat: 7.1856, lng: 125.4578, type: 'district' },
  { name: 'Sasa Wharf / Terminal', address: 'Sasa Wharf, R. Castillo St, Sasa, Davao City', district: 'Buhangin', lat: 7.1264, lng: 125.6569, type: 'landmark' },
];

// ─── 3-dot dropdown for recent items ─────────────────────────────────────────
function RecentItemMenu({
  onUse,
  onDelete,
}: {
  onUse: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 self-center">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label="More options"
        className="w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-sunken active:opacity-60 transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-line rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            onClick={() => { setOpen(false); onUse(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-ink hover:bg-sunken transition-colors"
          >
            <Navigation size={14} className="text-taupe" /> Use this
          </button>
          <div className="h-px bg-line" />
          <button
            type="button"
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-danger hover:bg-danger/5 transition-colors"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Set Home modal ───────────────────────────────────────────────────────────
function SetHomeModal({
  existing,
  onClose,
  onSave,
}: {
  existing: HomeLocation | null;
  onClose: () => void;
  onSave: (loc: HomeLocation) => void;
}) {
  const [label, setLabel] = useState(existing?.label ?? 'My Home');
  const [chosen, setChosen] = useState<SavedLocation | null>(
    existing ? { lat: existing.lat, lng: existing.lng, address: existing.address, district: existing.district } : null
  );
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = document.getElementById('mobile-frame-container');
    const prevFrameOverflow = frame ? frame.style.overflow : '';
    if (frame) {
      frame.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      if (frame) {
        frame.style.overflow = prevFrameOverflow;
      }
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 pointer-events-auto touch-none overscroll-contain">
        {/* Dimmed backdrop */}
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default border-none p-0 focus:outline-none touch-none"
        />

        {/* Centered Modal Card fitting strictly within 320px mobile frame */}
        <div
          className="relative bg-surface rounded-2xl shadow-2xl flex flex-col w-[calc(100%-24px)] max-w-[280px] overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-line p-3.5 space-y-3 touch-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1 border-b border-line/60">
            <h2 className="text-sm font-bold text-ink">{existing ? 'Edit Home Address' : 'Set Home Address'}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1 -mr-1 rounded-full text-ink-muted hover:text-ink hover:bg-sunken transition-colors"
            >
              <X size={17} />
            </button>
          </div>

          {/* Label */}
          <div>
            <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My Home, Office, School"
              className="w-full bg-sunken border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe"
            />
          </div>

          {/* Address - Same concept as Choose on Map */}
          <div>
            <label className="text-[11px] font-semibold text-ink-muted mb-1 block">Address</label>
            {chosen ? (
              <div
                onClick={() => setShowPicker(true)}
                className="w-full flex items-start justify-between gap-2 p-2.5 bg-sunken border border-line rounded-xl hover:border-taupe cursor-pointer transition-all text-left group"
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 mt-0.5 text-taupe">
                    <MapPin size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">{chosen.address.split(',')[0]}</p>
                    <p className="text-[10px] text-ink-muted line-clamp-2 mt-0.5 leading-tight">{chosen.address}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPicker(true);
                  }}
                  className="shrink-0 text-[11px] font-bold text-taupe hover:underline flex items-center gap-0.5 self-center pl-1 py-1"
                >
                  <MapIcon size={12} />
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-full flex items-center justify-between gap-2 p-2.5 bg-sunken border border-line rounded-xl hover:border-taupe hover:bg-taupe/5 transition-all text-left"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-7 h-7 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 text-taupe">
                    <MapIcon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-ink truncate">Choose on Map</p>
                    <p className="text-[10px] text-ink-muted truncate">Pin your address on map</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-ink-faint shrink-0" />
              </button>
            )}
          </div>

          {/* Action button */}
          <button
            type="button"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              onSave({ ...chosen, label: label.trim() || 'My Home' });
            }}
            className="w-full py-2.5 bg-taupe text-white text-xs font-bold rounded-xl hover:bg-taupe-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
          >
            Save Home Address
          </button>
        </div>
      </div>

      {/* Interactive Map Picker for Home Address */}
      {showPicker && (
        <LocationPicker
          initial={chosen}
          confirmLabel="Set this Address"
          onClose={() => setShowPicker(false)}
          onConfirm={(pickedLoc) => {
            setChosen(pickedLoc);
            setShowPicker(false);
          }}
        />
      )}
    </>
  );
}

// ─── Main page content ────────────────────────────────────────────────────────
function LocationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const outgoingQ = searchParams.get('q') ?? '';

  const [activeTab, setActiveTab] = useState<'recent' | 'suggested'>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; display_name: string }[]>([]);
  const [searchError, setSearchError] = useState('');

  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [recents, setRecents] = useState<RecentLocation[]>([]);
  const [homeLocation, setHomeLocation] = useState<HomeLocation | null>(null);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [currentAddressPreview, setCurrentAddressPreview] = useState('');

  const [shopHubs, setShopHubs] = useState<SuggestedHub[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [hubCategory, setHubCategory] = useState<'all' | 'shops' | 'malls' | 'districts'>('all');

  const [showSetHome, setShowSetHome] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // If user visits /location?mode=map, seamlessly redirect to the unified /map page
  useEffect(() => {
    if (searchParams.get('mode') === 'map') {
      router.replace(outgoingQ ? `/map?q=${encodeURIComponent(outgoingQ)}&select=1&returnTo=/location&continueTo=/location` : '/map?select=1&returnTo=/location&continueTo=/location');
    }
  }, [searchParams, router, outgoingQ]);

  const refreshData = useCallback(() => {
    const loc = getSavedLocation();
    setSavedLocation(loc);
    setRecents(getRecentLocations());
    setHomeLocation(getHomeLocation());
    if (loc?.address) setCurrentAddressPreview(loc.address);
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);

  // Dynamically load real Davao tailor shop branches from SUTURA
  useEffect(() => {
    setLoadingShops(true);
    api.get('/public/shops')
      .then((res) => {
        const shops = res.data?.data ?? [];
        const hubs: SuggestedHub[] = [];
        shops.forEach((shop: {
          name: string;
          address?: string;
          city?: string;
          branches?: Array<{
            name?: string;
            address?: string;
            district?: string;
            latitude?: string | number;
            longitude?: string | number;
          }>;
        }) => {
          if (Array.isArray(shop.branches)) {
            shop.branches.forEach((b) => {
              const lat = typeof b.latitude === 'string' ? parseFloat(b.latitude) : Number(b.latitude);
              const lng = typeof b.longitude === 'string' ? parseFloat(b.longitude) : Number(b.longitude);
              if (
                lat != null &&
                lng != null &&
                !isNaN(lat) &&
                !isNaN(lng) &&
                lat >= 6.85 &&
                lat <= 7.40 &&
                lng >= 125.30 &&
                lng <= 125.80
              ) {
                hubs.push({
                  name: `${shop.name}${b.name ? ` (${b.name})` : ''}`,
                  address: `${b.address || shop.address || ''}, ${b.district || 'Davao City'}`.replace(/^,\s*/, ''),
                  district: b.district || shop.city || 'Davao City',
                  lat,
                  lng,
                  type: 'tailor_shop',
                });
              }
            });
          }
        });
        setShopHubs(hubs);
      })
      .catch(() => {})
      .finally(() => setLoadingShops(false));
  }, []);

  // Dynamically compute and sort all Davao hubs and shops by proximity to user
  const dynamicSuggested = useMemo(() => {
    const combined = [...shopHubs, ...DAVAO_LANDMARKS];
    const refLat = savedLocation?.lat ?? 7.0731;
    const refLng = savedLocation?.lng ?? 125.6128;

    const filtered = combined.filter((item) => {
      if (hubCategory === 'shops') return item.type === 'tailor_shop';
      if (hubCategory === 'malls') return item.type === 'mall';
      if (hubCategory === 'districts') return item.type === 'district' || item.type === 'landmark';
      return true;
    });

    return filtered.sort((a, b) => {
      const distA = haversineKm(refLat, refLng, a.lat, a.lng);
      const distB = haversineKm(refLat, refLng, b.lat, b.lng);
      return distA - distB;
    });
  }, [shopHubs, savedLocation, hubCategory]);

  function handleSelectLocation(loc: SavedLocation) {
    saveLocationWithHistory(loc);
    router.push(outgoingQ ? `/search?q=${encodeURIComponent(outgoingQ)}` : '/search');
  }

  function handleUseCurrentGps() {
    if (!navigator.geolocation) { setSearchError('Geolocation not supported.'); return; }
    setLocatingCurrent(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          handleSelectLocation({
            lat: latitude, lng: longitude,
            address: data?.display_name ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            district: data?.address?.suburb || data?.address?.neighbourhood || data?.address?.city_district || 'Davao City',
          });
        } catch {
          handleSelectLocation({ lat: latitude, lng: longitude, address: `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`, district: 'Davao City' });
        } finally { setLocatingCurrent(false); }
      },
      () => { setSearchError('Unable to get location. Check browser permissions.'); setLocatingCurrent(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearch() {
    const text = searchQuery.trim();
    if (!text) return;
    setSearchError(''); setSearchResults([]);

    const parsedCoords = parseCoordsFromMapsLink(text);
    if (parsedCoords) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${parsedCoords.lat}&lon=${parsedCoords.lng}`);
        const data = await res.json();
        handleSelectLocation({ lat: parsedCoords.lat, lng: parsedCoords.lng, address: data?.display_name ?? text, district: data?.address?.suburb || 'Davao City' });
      } catch {
        handleSelectLocation({ lat: parsedCoords.lat, lng: parsedCoords.lng, address: text, district: 'Davao City' });
      }
      return;
    }

    setSearching(true);
    try {
      const cleaned = cleanLocationQuery(text);
      const isDavaoQuery = cleaned.toLowerCase().includes('davao');
      const queryText = isDavaoQuery ? cleaned : `${cleaned}, Davao City`;
      // Bounded strictly around Davao City (lat 6.85-7.40, lng 125.30-125.80)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(queryText)}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=8&countrycodes=ph`
      );
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError('No places found around Davao City. Try a landmark, street, or choose on map.');
      } else {
        setSearchResults(data.map((d: { lat: string; lon: string; display_name: string }) => ({ lat: parseFloat(d.lat), lng: parseFloat(d.lon), display_name: d.display_name })));
      }
    } catch { setSearchError('Connection error. Please try again.'); }
    finally { setSearching(false); }
  }

  function getDistanceLabel(lat: number, lng: number): string {
    const refLat = savedLocation?.lat ?? 7.0731;
    const refLng = savedLocation?.lng ?? 125.6128;
    return `${haversineKm(refLat, refLng, lat, lng).toFixed(2)} km`;
  }

  function handleDeleteRecent(lat: number, lng: number) {
    removeRecentLocation(lat, lng);
    setRecents(getRecentLocations());
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col pb-10 relative">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-surface border-b border-line px-3 py-3 shadow-xs">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-full text-ink hover:bg-sunken active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex-1 flex items-center gap-2 bg-sunken rounded-full px-3.5 py-2 border border-line focus-within:border-taupe focus-within:bg-white transition-all">
            <MapPin size={17} className="text-taupe shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSearch(); }}
              placeholder="Ateneo de Davao, Agdao, Bajada..."
              className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder:text-ink-faint focus:outline-none"
            />
            {searchQuery ? (
              <button type="button" onClick={() => { setSearchQuery(''); setSearchResults([]); setSearchError(''); }} className="text-ink-faint hover:text-ink shrink-0">
                <X size={15} />
              </button>
            ) : (
              <button type="button" onClick={() => void handleSearch()} aria-label="Search" className="text-ink-faint hover:text-taupe shrink-0">
                <SearchIcon size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-3 max-w-lg mx-auto">
          {(['recent', 'suggested'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all shrink-0 ${
                activeTab === tab ? 'bg-taupe text-white shadow-xs' : 'bg-sunken text-ink-muted hover:text-ink hover:bg-line/40'
              }`}
            >
              {tab === 'recent' ? 'Recent' : 'Suggested'}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 pt-4 space-y-4">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="bg-surface border border-line rounded-2xl p-3 shadow-xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint px-2 pb-1">Search Results</p>
            {searchResults.map((res, i) => (
              <button
                key={`${res.lat}-${res.lng}-${i}`}
                type="button"
                onClick={() => handleSelectLocation({ lat: res.lat, lng: res.lng, address: res.display_name, district: res.display_name.split(',')[1]?.trim() || 'Davao City' })}
                className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-sunken text-left transition-colors"
              >
                <MapPin size={17} className="text-taupe shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink line-clamp-1">{res.display_name.split(',')[0]}</p>
                  <p className="text-xs text-ink-muted line-clamp-1">{res.display_name}</p>
                </div>
                <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
              </button>
            ))}
          </div>
        )}

        {searchError && (
          <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-medium">{searchError}</div>
        )}

        {/* Location Selection Options */}
        <section className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={handleUseCurrentGps}
            disabled={locatingCurrent}
            className="w-full flex items-start gap-3.5 p-3.5 text-left hover:bg-sunken active:bg-sunken transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-taupe/10 text-taupe flex items-center justify-center shrink-0 mt-0.5">
              <LocateFixed size={19} className={locatingCurrent ? 'animate-pulse' : ''} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-ink">Current location</span>
                {locatingCurrent && <span className="text-[10px] text-taupe font-semibold animate-pulse">Detecting GPS…</span>}
              </div>
              <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                {currentAddressPreview || 'Use device GPS to find nearest tailors'}
              </p>
            </div>
            <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
          </button>

          <button
            type="button"
            onClick={() => router.push(outgoingQ ? `/map?q=${encodeURIComponent(outgoingQ)}&select=1&returnTo=/location&continueTo=/location` : '/map?select=1&returnTo=/location&continueTo=/location')}
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

        {/* ── Home Address ── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Home Address</p>
            {homeLocation && (
              <button
                type="button"
                onClick={() => setShowSetHome(true)}
                className="text-[11px] font-semibold text-taupe hover:underline"
              >
                Edit
              </button>
            )}
          </div>

          {homeLocation ? (
            <div className="bg-surface border border-line rounded-2xl overflow-hidden shadow-xs">
              <div className="flex items-start gap-3.5 p-3.5">
                <div className="w-9 h-9 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Home size={17} className="text-taupe" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-ink">{homeLocation.label}</p>
                  <p className="text-xs text-ink-muted line-clamp-2 mt-0.5">{homeLocation.address}</p>
                  <p className="text-[11px] font-semibold text-taupe mt-1">{getDistanceLabel(homeLocation.lat, homeLocation.lng)} from current</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0 self-center">
                  <button
                    type="button"
                    onClick={() => handleSelectLocation(homeLocation)}
                    className="px-3 py-1.5 bg-taupe text-white text-[11px] font-bold rounded-lg hover:bg-taupe-hover transition-colors"
                  >
                    Use
                  </button>
                  <button
                    type="button"
                    onClick={() => { removeHomeLocation(); setHomeLocation(null); }}
                    className="px-3 py-1.5 text-danger text-[11px] font-semibold rounded-lg hover:bg-danger/10 transition-colors border border-danger/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowSetHome(true)}
              className="w-full flex items-center gap-3 p-3.5 bg-surface border border-line border-dashed rounded-2xl hover:border-taupe hover:bg-taupe/5 transition-all text-left"
            >
              <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
                <Plus size={17} className="text-taupe" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Set a home address</p>
                <p className="text-xs text-ink-muted mt-0.5">Find nearby shops even when you&apos;re far away</p>
              </div>
            </button>
          )}
        </section>

        {/* ── Recent Tab ── */}
        {activeTab === 'recent' && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">Recent Places</p>
              {recents.length > 0 && (
                <button
                  type="button"
                  onClick={() => { clearRecentLocations(); setRecents([]); }}
                  className="text-[11px] font-semibold text-ink-muted hover:text-danger transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {recents.length > 0 ? (
              <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
                {recents.map((loc, idx) => (
                  <div key={`${loc.lat}-${loc.lng}-${idx}`} className="flex items-center gap-3.5 px-3.5 hover:bg-sunken transition-colors">
                    <button
                      type="button"
                      onClick={() => handleSelectLocation(loc)}
                      className="flex items-start gap-3.5 py-3.5 flex-1 min-w-0 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-ink-muted">
                        <Clock size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-ink line-clamp-1">{loc.address.split(',')[0]}</p>
                        <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                          <span className="font-semibold text-taupe">{getDistanceLabel(loc.lat, loc.lng)}</span>
                          {' · '}{loc.address}
                        </p>
                      </div>
                    </button>
                    <RecentItemMenu
                      onUse={() => handleSelectLocation(loc)}
                      onDelete={() => handleDeleteRecent(loc.lat, loc.lng)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-surface border border-line rounded-2xl p-7 text-center">
                <Clock size={26} className="mx-auto text-ink-faint mb-2" />
                <p className="text-xs font-medium text-ink-muted">No recent locations yet.</p>
                <p className="text-[11px] text-ink-faint mt-0.5">Pick a suggested place or choose on the map.</p>
              </div>
            )}
          </section>
        )}

        {/* ── Suggested Tab ── */}
        {activeTab === 'suggested' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  Suggested Places Around Davao
                </p>
                <p className="text-[11px] text-ink-muted">
                  Sorted by nearest distance to your location
                </p>
              </div>
              {loadingShops && (
                <span className="text-[10px] text-taupe font-semibold animate-pulse">Syncing…</span>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {(
                [
                  { id: 'all', label: 'All Davao' },
                  { id: 'shops', label: 'Tailor Shops' },
                  { id: 'malls', label: 'Malls & Hubs' },
                  { id: 'districts', label: 'Districts' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setHubCategory(chip.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    hubCategory === chip.id
                      ? 'bg-taupe text-white shadow-xs'
                      : 'bg-surface border border-line text-ink-muted hover:text-ink'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Dynamic list sorted by distance */}
            <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
              {dynamicSuggested.map((hub, idx) => (
                <button
                  key={`${hub.lat}-${hub.lng}-${idx}`}
                  type="button"
                  onClick={() => handleSelectLocation(hub)}
                  className="w-full flex items-start gap-3.5 p-3.5 text-left hover:bg-sunken transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-taupe/10 flex items-center justify-center shrink-0 mt-0.5 text-taupe">
                    {hub.type === 'tailor_shop' ? (
                      <Scissors size={15} />
                    ) : hub.type === 'mall' ? (
                      <ShoppingBag size={15} />
                    ) : (
                      <MapPin size={16} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-ink line-clamp-1">{hub.name}</p>
                      {hub.type === 'tailor_shop' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-taupe/15 text-taupe shrink-0">
                          Shop
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-muted line-clamp-1 mt-0.5">
                      <span className="font-semibold text-taupe">{getDistanceLabel(hub.lat, hub.lng)}</span>
                      {' · '}{hub.district}
                      {hub.address && hub.address !== hub.name ? ` · ${hub.address}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-ink-faint shrink-0 self-center" />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Need help */}
        <section className="space-y-2 pt-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint px-1">Need help?</p>
          <div className="bg-surface border border-line rounded-2xl divide-y divide-line overflow-hidden shadow-xs">
            <div className="flex items-start gap-3 p-3.5">
              <HelpCircle size={16} className="text-ink-muted shrink-0 mt-0.5" />
              <p className="text-xs text-ink-muted leading-relaxed">
                Locations are saved locally to your device. You can find shops near your <strong>home address</strong> even when you&apos;re far from it — just tap <em>Use</em>.
              </p>
            </div>
          </div>
        </section>
      </main>


      {/* Set Home Modal */}
      {showSetHome && (
        <SetHomeModal
          existing={homeLocation}
          onClose={() => setShowSetHome(false)}
          onSave={(loc) => {
            saveHomeLocation(loc);
            setHomeLocation(loc);
            setShowSetHome(false);
          }}
        />
      )}
    </div>
  );
}

export default function LocationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-taupe border-t-transparent animate-spin" />
      </div>
    }>
      <LocationPageContent />
    </Suspense>
  );
}
