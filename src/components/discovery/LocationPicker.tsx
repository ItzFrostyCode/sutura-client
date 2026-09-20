'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { ArrowLeft, LocateFixed, Search as SearchIcon, Clock, X, Check, SlidersHorizontal } from 'lucide-react';
import type { SavedLocation, RecentLocation } from '@/lib/customerLocation';
import { getRecentLocations, addRecentLocation } from '@/lib/customerLocation';
import { parseCoordsFromMapsLink, cleanLocationQuery } from '@/lib/parseLocationInput';
import api from '@/lib/axios';
import { isShopOpen } from '@/lib/shopStatus';
import { buildStorePinIcon } from '@/components/discovery/DiscoveryMap';
import { getMediaUrl } from '@/lib/media';

interface StoreMapPin {
  id: number;
  slug: string;
  name: string;
  branchName: string;
  isMain: boolean;
  logoPath: string | null;
  district: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

// Davao City center — the map's default view when there's no saved or
// device location to open on yet.
const DAVAO_CENTER: [number, number] = [7.0731, 125.6128];

// Hands the mounted Leaflet map instance back up to the parent component —
// react-leaflet only exposes it via useMap() from inside the tree.
function MapRefSetter({ mapRef }: { readonly mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map, mapRef]);
  return null;
}

// Fires once per pan/zoom gesture (not per pixel) with wherever the map's
// own center ends up — this is what makes the fixed center pin "pick"
// whatever's underneath it as the map is dragged, gmaps/Grab-picker style.
function MapCenterTracker({ onMoveEnd }: { readonly onMoveEnd: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend(e) {
      const c = e.target.getCenter();
      onMoveEnd(c.lat, c.lng);
    },
  });
  return null;
}

interface Props {
  readonly initial: SavedLocation | null;
  readonly onClose: () => void;
  readonly onConfirm: (loc: SavedLocation) => void;
  /** Confirm-button label — defaults to the customer-picker wording. */
  readonly confirmLabel?: string;
}

// One-screen location picker: the map (fixed center pin, pans underneath
// it — "wherever I move the map to" IS the pick) is visible immediately,
// not gated behind a separate "search first" step. Search/Recent live as a
// lightweight dropdown under the search bar (shown on focus, or once a
// search actually returns something), rather than a whole screen of their
// own — a first-time customer with no Recent history yet was landing on an
// almost-empty screen before ever seeing a map, which read as broken more
// than helpful. Reached from the "Your Location" dropdown in /search's
// header, and reused as-is for a shop owner's "set my branch's map pin"
// picker (BranchFormModal).
//
// district isn't user-editable here (there's no real polygon/boundary data
// in this app to derive "which district is this exact coordinate in"
// honestly) — /search's own Filter panel is where a customer actually
// filters by district; whatever district a picked Recent/initial location
// already carries just passes through unchanged.
//
// Reverse/forward geocoding both use Nominatim (OpenStreetMap's own free,
// keyless service — same provider as the tile layer already used across
// the app's other Leaflet maps), one on-demand call per pick/search, not
// bulk lookups. A pasted Google Maps link is pattern-matched for embedded
// coordinates first (see parseLocationInput.ts) so it doesn't need a
// network round-trip at all when it already has them.
export default function LocationPicker({ initial, onClose, onConfirm, confirmLabel = 'Choose this Location' }: Props) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recents, setRecents] = useState<RecentLocation[]>([]);
  const [position, setPosition] = useState<[number, number]>(
    initial ? [initial.lat, initial.lng] : DAVAO_CENTER
  );
  const [address, setAddress] = useState(initial?.address ?? '');
  const [district, setDistrict] = useState(initial?.district ?? '');
  const [locating, setLocating] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ lat: number; lng: number; display_name: string }[]>([]);
  const [error, setError] = useState('');
  const geocodeRequestId = useRef(0);
  const mapRef = useRef<LeafletMap | null>(null);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [stores, setStores] = useState<StoreMapPin[]>([]);
  const [selectedStore, setSelectedStore] = useState<StoreMapPin | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);

  useEffect(() => { setRecents(getRecentLocations()); }, []);

  useEffect(() => {
    api.get('/public/shops', { params: { per_page: 50 } })
      .then((res) => {
        const list: StoreMapPin[] = [];
        const raw = res.data?.data ?? [];
        for (const s of raw) {
          const open = isShopOpen(s.operating_hours);
          if (Array.isArray(s.branches)) {
            for (const b of s.branches) {
              if (b.latitude != null && b.longitude != null && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude))) {
                list.push({
                  id: b.id,
                  slug: s.slug,
                  name: s.name,
                  branchName: b.name,
                  isMain: !!b.is_main,
                  logoPath: s.logo_path,
                  district: s.district || b.city || null,
                  address: b.address || s.address || null,
                  latitude: Number(b.latitude),
                  longitude: Number(b.longitude),
                  isOpen: open,
                });
              }
            }
          }
        }
        setStores(list);
      })
      .catch(() => setStores([]));
  }, []);

  const filteredStores = stores.filter((st) => {
    if (selectedDistrict !== 'all' && st.district && !st.district.toLowerCase().includes(selectedDistrict.toLowerCase())) {
      return false;
    }
    if (statusFilter === 'online' && !st.isOpen) return false;
    if (statusFilter === 'offline' && st.isOpen) return false;
    return true;
  });

  function handleSelectStore(st: StoreMapPin) {
    setSelectedStore(st);
    setPosition([st.latitude, st.longitude]);
    setAddress(`${st.name} (${st.branchName}) - ${st.address || st.district || 'Davao City'}`);
    if (st.district) setDistrict(st.district);
    mapRef.current?.flyTo([st.latitude, st.longitude], 16, { animate: true });
  }

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

  function reverseGeocode(lat: number, lng: number) {
    const requestId = ++geocodeRequestId.current;
    setReverseLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`)
      .then((res) => res.json())
      .then((data) => {
        if (requestId !== geocodeRequestId.current) return;
        setAddress(data?.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      })
      .catch(() => {
        if (requestId !== geocodeRequestId.current) return;
        setAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      })
      .finally(() => {
        if (requestId === geocodeRequestId.current) setReverseLoading(false);
      });
  }

  // The map's own moveend just reports where it ended up — it never moves
  // the map itself (it's already there), so this can't fight a drag/flyTo.
  function handleMapMoveEnd(lat: number, lng: number) {
    setPosition([lat, lng]);
    if (selectedStore) {
      const dLat = Math.abs(lat - selectedStore.latitude);
      const dLng = Math.abs(lng - selectedStore.longitude);
      if (dLat > 0.001 || dLng > 0.001) {
        setSelectedStore(null);
      }
    }
    reverseGeocode(lat, lng);
  }

  function jumpTo(lat: number, lng: number) {
    setPosition([lat, lng]);
    mapRef.current?.flyTo([lat, lng], 16);
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Your browser does not support location access.');
      return;
    }
    setLocating(true);
    setError('');
    setShowSuggestions(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        jumpTo(latitude, longitude);
        reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      () => {
        setError('Could not get your location. Check your browser’s location permission and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSearchSubmit() {
    const text = query.trim();
    if (!text) return;
    setError('');
    setSearchResults([]);

    const parsed = parseCoordsFromMapsLink(text);
    if (parsed) {
      jumpTo(parsed.lat, parsed.lng);
      reverseGeocode(parsed.lat, parsed.lng);
      setShowSuggestions(false);
      return;
    }

    // Strip a Google Plus Code, a redundant trailing "Davao del Sur", and
    // any "Corner <street>" clause before searching — Nominatim can't parse
    // any of those and returns zero results for the whole string if left
    // in, even when the rest of the address alone matches instantly (see
    // parseLocationInput.ts).
    const cleaned = cleanLocationQuery(text);

    const geocode = (q: string) =>
      fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=5&countrycodes=ph`)
        .then((res) => res.json());

    setSearching(true);
    try {
      // limit=5, not 1 — a short/generic query (e.g. just a street name)
      // can genuinely match several real places, and silently taking
      // whichever one came back first risks landing on the wrong city
      // district entirely. Multiple matches get handed to the customer to
      // pick from instead of guessed at.
      let data = await geocode(cleaned);

      // A pasted "Business Name, full street address" combo routinely
      // returns nothing even when each half works fine on its own
      // (verified: "Jollibee - Davao Magsaysay, R. Magsaysay Avenue,
      // Poblacion, Davao City" → 0 results; "Jollibee - Davao Magsaysay"
      // alone → 2, the right one among them). Nominatim just can't match a
      // POI name and a full structured address in the same query — so if
      // the full string comes back empty, retry with just the first
      // comma-separated segment (almost always the place/business name
      // when copied from Google Maps or Grab) before giving up entirely.
      const firstSegment = cleaned.split(',')[0].trim();
      if ((!Array.isArray(data) || data.length === 0) && firstSegment && firstSegment !== cleaned) {
        data = await geocode(firstSegment);
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError("Couldn't find that place. Try pasting the full Google Maps link (not a shortened one), or a more specific address.");
        setShowSuggestions(false);
      } else if (data.length === 1) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        jumpTo(lat, lng);
        setAddress(data[0].display_name ?? cleaned);
        setShowSuggestions(false);
      } else {
        setSearchResults(
          data.map((d: { lat: string; lon: string; display_name: string }) => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            display_name: d.display_name,
          }))
        );
        setShowSuggestions(true);
      }
    } catch {
      setError('Something went wrong searching that. Please try again.');
      setShowSuggestions(false);
    } finally {
      setSearching(false);
    }
  }

  function handlePickSearchResult(r: { lat: number; lng: number; display_name: string }) {
    jumpTo(r.lat, r.lng);
    setAddress(r.display_name);
    setSearchResults([]);
    setShowSuggestions(false);
  }

  function handlePickRecent(loc: RecentLocation) {
    jumpTo(loc.lat, loc.lng);
    setAddress(loc.address);
    setDistrict(loc.district);
    setShowSuggestions(false);
  }

  function handleConfirm() {
    const loc: SavedLocation = { lat: position[0], lng: position[1], address, district };
    addRecentLocation(loc);
    onConfirm(loc);
  }

  // A brief delay on blur so a tap on a suggestion row registers before the
  // dropdown disappears out from under it.
  function handleInputBlur() {
    blurTimeout.current = setTimeout(() => setShowSuggestions(false), 150);
  }
  function handleInputFocus() {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    setShowSuggestions(true);
  }

  const suggestionsVisible = showSuggestions && (searchResults.length > 0 || (!query.trim() && recents.length > 0));

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center">
      {/* Dimmed backdrop outside the 320px frame on desktop */}
      <button
        type="button"
        aria-label="Close location picker"
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default border-none p-0 focus:outline-none"
      />

      {/* 320px mobile frame container */}
      <div className="relative w-full max-w-[320px] h-full bg-canvas flex flex-col shadow-2xl border-x border-line z-10">
        {/* Header with Search and Filter Icon on Right */}
        <div className="relative z-20 flex items-center gap-2 px-3 h-14 border-b border-line shrink-0 bg-canvas">
          <button type="button" onClick={onClose} aria-label="Back" className="p-1.5 text-ink-muted hover:text-ink shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 relative min-w-0">
            <button
              type="button"
              onClick={() => void handleSearchSubmit()}
              disabled={!query.trim() || searching}
              aria-label="Search"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint disabled:opacity-50"
            >
              <SearchIcon size={15} className={searching ? 'animate-pulse' : ''} />
            </button>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleSearchSubmit(); }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Search address, store, or Maps link"
              className="w-full bg-sunken border border-line rounded-full pl-9 pr-8 py-2 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-taupe"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter button on right side */}
          <button
            type="button"
            onClick={() => setShowFilterDropdown((prev) => !prev)}
            aria-label="Filter stores and districts"
            className={`relative p-2 rounded-full border transition-colors shrink-0 ${
              selectedDistrict !== 'all' || statusFilter !== 'all'
                ? 'bg-taupe text-white border-taupe shadow-xs'
                : 'bg-surface text-ink-muted border-line hover:border-taupe'
            }`}
          >
            <SlidersHorizontal size={15} />
            {(selectedDistrict !== 'all' || statusFilter !== 'all') && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-canvas" />
            )}
          </button>
        </div>

        {/* Filter Dropdown — District + Store Status (Online/Offline) */}
        {showFilterDropdown && (
          <div className="absolute left-2.5 right-2.5 top-15 z-30 bg-surface border border-line rounded-2xl p-3.5 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-1.5 border-b border-line/70">
              <span className="text-xs font-bold text-ink">Filter Stores & Districts</span>
              <button
                type="button"
                onClick={() => setShowFilterDropdown(false)}
                className="text-ink-muted hover:text-ink p-1 rounded-full hover:bg-sunken"
              >
                <X size={14} />
              </button>
            </div>

            {/* District dropdown */}
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-ink-faint block mb-1">
                District
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-canvas border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink focus:outline-none focus:border-taupe"
              >
                <option value="all">All Districts</option>
                {['Poblacion', 'Talomo', 'Buhangin', 'Agdao', 'Toril', 'Bunawan', 'Calinan', 'Tugbok'].map((d) => (
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
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-center transition-colors ${
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
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors ${
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
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1.5 transition-colors ${
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

            {/* Footer with Reset button when filters are active */}
            {(selectedDistrict !== 'all' || statusFilter !== 'all') && (
              <div className="flex items-center justify-end pt-1 text-[10px] text-ink-muted border-t border-line/60">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDistrict('all');
                    setStatusFilter('all');
                  }}
                  className="text-taupe font-bold hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search/Recent dropdown */}
        {suggestionsVisible && (
          <div className="absolute left-0 right-0 top-14 z-20 bg-canvas border-b border-line max-h-72 overflow-y-auto shadow-md">
            {searchResults.length > 0 ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint px-3 pt-2 pb-1">
                  {searchResults.length} matches — pick one
                </p>
                {searchResults.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    type="button"
                    onClick={() => handlePickSearchResult(r)}
                    className="w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left"
                  >
                    <SearchIcon size={16} className="text-ink-faint shrink-0" />
                    <span className="text-sm text-ink-body">{r.display_name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint px-3 pt-2 pb-1">Recent</p>
                {recents.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    type="button"
                    onClick={() => handlePickRecent(r)}
                    className="w-full flex items-center gap-3 px-3 py-3 border-t border-line text-left"
                  >
                    <Clock size={16} className="text-ink-faint shrink-0" />
                    <span className="text-sm text-ink-body truncate">{r.address}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 relative">
          <MapContainer center={position} zoom={16} className="w-full h-full" zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapRefSetter mapRef={mapRef} />
            <MapCenterTracker onMoveEnd={handleMapMoveEnd} />

            {/* All Store Pins with Red (offline) and Green (online) status indicators */}
            {filteredStores.map((st) => (
              <Marker
                key={`store-${st.id}-${st.slug}`}
                position={[st.latitude, st.longitude]}
                icon={buildStorePinIcon(st.logoPath, st.isMain, st.isOpen)}
                eventHandlers={{
                  click: () => handleSelectStore(st),
                }}
              />
            ))}
          </MapContainer>

          {/* Fixed center pin — allows dragging to any custom location */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[500]">
            <svg width="30" height="38" viewBox="0 0 30 38" fill="none">
              <path d="M15 0C6.7 0 0 6.7 0 15c0 10.5 15 23 15 23s15-12.5 15-23C30 6.7 23.3 0 15 0z" fill="#9A8073" stroke="#fff" strokeWidth="2" />
              <circle cx="15" cy="15" r="5" fill="#fff" />
            </svg>
          </div>

          {/* Current Location button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={locating}
            className="absolute bottom-3 right-3 z-[400] w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-taupe shadow-md disabled:opacity-60"
            aria-label="Use my current location"
          >
            <LocateFixed size={18} className={locating ? 'animate-pulse' : ''} />
          </button>
        </div>

        {/* Bottom footer — includes selected store preview card and confirm button */}
        <div className="shrink-0 border-t border-line p-3 space-y-2.5 bg-canvas">
          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Selected Store Card Preview */}
          {selectedStore && (
            <div className="flex items-center gap-2.5 p-2 bg-sunken rounded-xl border border-line animate-in fade-in duration-150">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-line shrink-0 bg-canvas">
                {selectedStore.logoPath ? (
                  <Image src={getMediaUrl(selectedStore.logoPath)} alt={selectedStore.name} fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-taupe">
                    {selectedStore.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-ink truncate">{selectedStore.name}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    selectedStore.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedStore.isOpen ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
                    {selectedStore.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <p className="text-[10px] text-ink-muted truncate">
                  {selectedStore.branchName}{selectedStore.district ? ` • ${selectedStore.district}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStore(null)}
                className="text-ink-faint hover:text-ink p-1"
                aria-label="Deselect store"
              >
                <X size={13} />
              </button>
            </div>
          )}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-faint mb-0.5">Address</p>
            <p className="text-xs text-ink font-medium leading-snug line-clamp-2">
              {reverseLoading ? 'Locating address…' : (address || 'Move the map or tap a store to choose a spot')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-taupe text-white text-sm font-semibold hover:bg-taupe-hover transition-colors shadow-xs"
          >
            <Check size={15} /> {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
