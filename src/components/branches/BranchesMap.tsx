'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from '@/lib/leafletSafe';
import 'leaflet/dist/leaflet.css';
import { MapPin, Star, Phone, Clock, User, ExternalLink, Map as MapIcon, List, Navigation } from 'lucide-react';
import { StoreBranch, getMapUrl } from './branchHelpers';

// 🌟 Special Gold Star Pin for Primary Headquarters (Main Branch)
const mainPinIcon = L.divIcon({
  className: '',
  html: '<div style="filter: drop-shadow(0 3px 6px rgba(180,83,9,0.45)); transform: scale(1.15);"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#D97706" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><polygon points="12 6 13.5 8.8 16.5 9.2 14.2 11.4 14.8 14.5 12 13 9.2 14.5 9.8 11.4 7.5 9.2 10.5 8.8 12 6" fill="#FEF3C7" stroke="#92400E" stroke-width="0.8"/></svg></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

// Satellite Branch standard Pin. fill uses var(--brand-taupe) (see
// globals.css) rather than a hardcoded hex, so it tracks the design
// system's brand color automatically instead of silently drifting out of
// sync if that token is ever changed — CSS custom properties resolve fine
// inside inline SVG fill/stroke attributes, this doesn't need to be a
// Tailwind class.
const satellitePinIcon = L.divIcon({
  className: '',
  html: '<div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="var(--brand-taupe)" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -22],
});

function MapController({
  points,
  selectedPos,
}: {
  readonly points: [number, number][];
  readonly selectedPos: [number, number] | null;
}) {
  const map = useMap();
  const isFirstRender = useRef(true);
  const prevSelectedRef = useRef<string | null>(null);

  // Stop any active Leaflet animations if the component unmounts mid-transition
  useEffect(() => {
    return () => {
      try {
        map.stop();
      } catch {
        // Safe fallback
      }
    };
  }, [map]);

  useEffect(() => {
    if (points.length === 0) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Immediate view positioning without animation avoids race conditions on initial mount
      if (selectedPos) {
        map.setView(selectedPos, 15, { animate: false });
        prevSelectedRef.current = `${selectedPos[0]},${selectedPos[1]}`;
      } else if (points.length === 1) {
        map.setView(points[0], 15, { animate: false });
      } else {
        map.fitBounds(points, { padding: [40, 40], animate: false });
      }
      return;
    }

    // Subsequent user selection changes: smoothly fly to the chosen branch
    if (selectedPos) {
      const key = `${selectedPos[0]},${selectedPos[1]}`;
      if (key !== prevSelectedRef.current) {
        prevSelectedRef.current = key;
        map.flyTo(selectedPos, 16, { duration: 0.8 });
      }
    }
  }, [map, points, selectedPos]);

  return null;
}

export default function BranchesMap({
  branches,
  initialSelectedId = null,
  onSelectBranch,
  height = 440,
}: {
  readonly branches: StoreBranch[];
  readonly initialSelectedId?: number | null;
  readonly onSelectBranch?: (branch: StoreBranch) => void;
  readonly height?: number | string;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId ?? null);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('map');
  const markerRefs = useRef(new Map<number, L.Marker>());

  useEffect(() => {
    if (initialSelectedId !== undefined && initialSelectedId !== null) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  const safeBranches = Array.isArray(branches) ? branches : [];

  // Pinned branches with valid coordinates. If Main Branch has missing coordinates,
  // fall back to default Davao City coordinates [7.0702, 125.6077] so it is NEVER missing!
  const pinned = safeBranches
    .map(b => {
      let lat = Number(b.latitude);
      let lng = Number(b.longitude);
      if (Boolean(b.is_main) && (Number.isNaN(lat) || Number.isNaN(lng) || !b.latitude || !b.longitude)) {
        lat = 7.0702;
        lng = 125.6077;
      }
      return { branch: b, lat, lng };
    })
    .filter(({ lat, lng }) => !Number.isNaN(lat) && !Number.isNaN(lng) && lat !== 0 && lng !== 0)
    .map(({ branch, lat, lng }) => ({
      branch,
      pos: [lat, lng] as [number, number],
    }));

  if (pinned.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-none p-10 text-center text-sm text-ink-muted">
        No branches have map coordinates yet. Add a Latitude/Longitude to a branch to pin it here.
      </div>
    );
  }

  const points = pinned.map(p => p.pos);
  const activePinned = pinned.find(p => p.branch.id === selectedId) ?? pinned[0];
  const selectedPos = activePinned?.pos ?? points[0];
  const selectedBranch = activePinned?.branch ?? pinned[0].branch;

  const handleSelect = (id: number) => {
    setSelectedId(id);
    markerRefs.current.get(id)?.openPopup();
  };

  return (
    <div
      className="border-y border-line sm:border-x flex flex-col md:flex-row bg-surface rounded-none overflow-hidden sm:shadow-xs"
      style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
    >
      {/* 📱 Mobile Top Switcher (Map vs List) */}
      <div className="md:hidden flex items-center justify-between p-3 bg-canvas/80 border-b border-line">
        <div className="flex items-center gap-1.5">
          <MapPin size={16} className="text-taupe" />
          <span className="text-xs font-bold uppercase tracking-wider text-ink">
            Locations ({pinned.length})
          </span>
        </div>
        <div className="flex items-center bg-sunken border border-line p-0.5 rounded-none">
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors min-h-[36px] rounded-none cursor-pointer ${
              mobileTab === 'map' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <MapIcon size={13} /> Map
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('list')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors min-h-[36px] rounded-none cursor-pointer ${
              mobileTab === 'list' ? 'bg-ink text-white' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <List size={13} /> List
          </button>
        </div>
      </div>

      {/* 🖥️ Desktop Left Sidebar List (hidden on mobile) */}
      <div
        className="hidden md:block md:w-72 shrink-0 border-r border-line bg-surface overflow-y-auto"
        style={{ maxHeight: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="p-3.5 bg-canvas/60 border-b border-line flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            All Locations ({pinned.length})
          </p>
          <span className="text-[10px] font-semibold text-taupe uppercase">Davao City</span>
        </div>
        {pinned.map(({ branch }) => {
          const isMain = Boolean(branch.is_main);
          const isSelected = selectedId === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => handleSelect(branch.id)}
              className={`w-full text-left px-4 py-3.5 flex items-start gap-3 border-b border-line last:border-b-0 transition-colors cursor-pointer min-h-[56px] rounded-none ${
                isSelected
                  ? 'bg-sunken border-l-4 border-l-taupe'
                  : 'hover:bg-canvas'
              }`}
            >
              {isMain ? (
                <Star size={16} className="mt-0.5 shrink-0 fill-amber-500 text-amber-600" />
              ) : (
                <MapPin size={16} className={`mt-0.5 shrink-0 ${isSelected ? 'text-taupe' : 'text-ink-muted'}`} />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-semibold truncate ${isSelected ? 'text-taupe' : 'text-ink'}`}>
                    {branch.name}
                  </p>
                  {isMain ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 shrink-0 rounded-none">
                      HQ
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-ink-muted truncate mt-0.5">{branch.address}, {branch.city}</p>
                {branch.manager?.user && (
                  <p className="text-[11px] text-taupe truncate mt-0.5">
                    Mgr: {branch.manager.user.name}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 📱 Mobile List Tab View */}
      {mobileTab === 'list' && (
        <div className="md:hidden flex-1 overflow-y-auto divide-y divide-line bg-surface">
          {pinned.map(({ branch }) => {
            const isMain = Boolean(branch.is_main);
            const isSelected = selectedId === branch.id;
            return (
              <div
                key={branch.id}
                className={`p-4 transition-colors ${isSelected ? 'bg-sunken border-l-4 border-l-taupe' : 'bg-surface'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {isMain ? (
                      <Star size={18} className="mt-0.5 shrink-0 fill-amber-500 text-amber-600" />
                    ) : (
                      <MapPin size={18} className="mt-0.5 shrink-0 text-taupe" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-base font-bold text-ink truncate">{branch.name}</h4>
                        {isMain ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 shrink-0 rounded-none">
                            HQ
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-ink-body mt-1">
                        {branch.address}, {branch.city}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-ink-muted border-t border-line/60 pt-2.5">
                  {branch.manager?.user && (
                    <div className="flex items-center gap-2 text-ink-body">
                      <User size={13} className="text-taupe shrink-0" />
                      <span>Manager: <strong>{branch.manager.user.name}</strong></span>
                    </div>
                  )}
                  {branch.contact_number && (
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-ink-muted shrink-0" />
                      <span>{branch.contact_number}</span>
                    </div>
                  )}
                  {branch.operating_hours && (
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-ink-muted shrink-0" />
                      <span>{branch.operating_hours}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-line flex items-stretch -mx-4 mb-[-16px]">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelect(branch.id);
                      setMobileTab('map');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink hover:bg-sunken transition-colors min-h-[44px] border-r border-line cursor-pointer"
                  >
                    <MapIcon size={14} className="text-taupe" />
                    Map
                  </button>
                  {onSelectBranch && (
                    <button
                      type="button"
                      onClick={() => onSelectBranch(branch)}
                      className="flex-1 flex items-center justify-center text-xs font-semibold text-ink hover:bg-sunken transition-colors min-h-[44px] border-r border-line cursor-pointer"
                    >
                      View Profile
                    </button>
                  )}
                  <a
                    href={getMapUrl(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-[52px] flex items-center justify-center text-ink-muted hover:text-ink hover:bg-sunken transition-colors min-h-[44px] shrink-0 cursor-pointer"
                    title="Directions"
                  >
                    <Navigation size={16} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 🗺️ Map Canvas Area (always on Desktop, toggled on Mobile) */}
      <div className={`${mobileTab === 'map' ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-h-0 relative`}>
        {/* Map Container */}
        <div className="flex-1 min-h-[280px] sm:min-h-[340px] md:min-h-0 relative">
          <MapContainer
            center={points[0] ?? [7.0702, 125.6077]}
            zoom={13}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController points={points} selectedPos={selectedPos} />
            {pinned.map(({ branch, pos }) => (
              <Marker
                key={branch.id}
                position={pos}
                icon={Boolean(branch.is_main) ? mainPinIcon : satellitePinIcon}
                ref={(ref) => {
                  if (ref) markerRefs.current.set(branch.id, ref);
                  else markerRefs.current.delete(branch.id);
                }}
                eventHandlers={{ click: () => setSelectedId(branch.id) }}
              >
                <Popup className="sutura-branch-popup">
                  <div className="p-1 text-ink min-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      {Boolean(branch.is_main) ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-none">
                          <Star size={10} className="fill-amber-500" /> Primary Headquarters
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                          Satellite Branch
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-sm text-ink mb-1">{branch.name}</h4>
                    <p className="text-xs text-ink-body mb-2">
                      {branch.address}, {branch.city}
                      {branch.landmark ? <span className="block text-ink-muted text-[11px] mt-0.5">Landmark: {branch.landmark}</span> : null}
                    </p>

                    <div className="space-y-1 text-xs border-t border-line/60 pt-2 mb-2">
                      {branch.manager?.user && (
                        <div className="flex items-center gap-1.5 text-ink-body">
                          <User size={12} className="text-taupe shrink-0" />
                          <span className="truncate">Manager: <strong>{branch.manager.user.name}</strong></span>
                        </div>
                      )}
                      {branch.contact_number && (
                        <div className="flex items-center gap-1.5 text-ink-body">
                          <Phone size={12} className="text-ink-muted shrink-0" />
                          <span>{branch.contact_number}</span>
                        </div>
                      )}
                      {branch.operating_hours && (
                        <div className="flex items-center gap-1.5 text-ink-body">
                          <Clock size={12} className="text-ink-muted shrink-0" />
                          <span>{branch.operating_hours}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                      {onSelectBranch && (
                        <button
                          type="button"
                          onClick={() => onSelectBranch(branch)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-ink hover:bg-black px-3 py-1.5 transition-colors cursor-pointer rounded-none"
                        >
                          View Profile
                        </button>
                      )}
                      <a
                        href={getMapUrl(branch)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-taupe hover:underline"
                      >
                        <ExternalLink size={12} /> Directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* 📱 Mobile Bottom Quick-Select Chips & Active Branch Card */}
        <div className="md:hidden border-t border-line bg-surface">
          {/* Horizontal Branch Chips */}
          <div className="flex items-center gap-2 overflow-x-auto p-2.5 bg-canvas/50 border-b border-line no-scrollbar">
            {pinned.map(({ branch }) => {
              const isSelected = selectedId === branch.id;
              const isMain = Boolean(branch.is_main);
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleSelect(branch.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors border cursor-pointer rounded-none ${
                    isSelected
                      ? 'bg-ink text-white border-ink'
                      : 'bg-surface text-ink border-line hover:border-line-strong'
                  }`}
                >
                  {isMain ? (
                    <Star size={13} className={isSelected ? 'fill-amber-300 text-amber-300' : 'fill-amber-500 text-amber-600'} />
                  ) : (
                    <MapPin size={13} className={isSelected ? 'text-white' : 'text-taupe'} />
                  )}
                  <span>{branch.name}</span>
                  {isMain ? (
                    <span className={`text-[8px] font-bold px-1 py-0.2 uppercase rounded-none ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                      HQ
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Active Branch Quick Details Drawer */}
          {selectedBranch && (
            <div className="p-3.5 bg-surface space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-bold text-ink truncate">{selectedBranch.name}</h4>
                    {Boolean(selectedBranch.is_main) ? (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-amber-100 text-amber-800 shrink-0 rounded-none">
                        HQ
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-ink-muted truncate mt-0.5">
                    {selectedBranch.address}, {selectedBranch.city}
                  </p>
                </div>
                {selectedBranch.contact_number && (
                  <a
                    href={`tel:${selectedBranch.contact_number}`}
                    className="min-h-[40px] px-2.5 border border-line text-xs text-taupe font-semibold flex items-center gap-1 hover:border-taupe shrink-0 rounded-none"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
              </div>

              {selectedBranch.manager?.user && (
                <p className="text-xs text-ink-body">
                  Manager: <strong className="text-ink">{selectedBranch.manager.user.name}</strong>
                </p>
              )}

              <div className="mt-3 border-t border-line flex items-stretch -mx-3.5 mb-[-14px]">
                {onSelectBranch && (
                  <button
                    type="button"
                    onClick={() => onSelectBranch(selectedBranch)}
                    className="flex-1 flex items-center justify-center text-xs font-semibold text-ink hover:bg-sunken transition-colors min-h-[44px] border-r border-line cursor-pointer"
                  >
                    View Profile
                  </button>
                )}
                <a
                  href={getMapUrl(selectedBranch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-ink hover:bg-sunken transition-colors min-h-[44px] cursor-pointer"
                >
                  <Navigation size={14} className="text-taupe" /> Directions
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
