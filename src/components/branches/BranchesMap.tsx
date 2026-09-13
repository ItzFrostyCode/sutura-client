'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Star, Phone, Clock, User, ExternalLink } from 'lucide-react';
import { ShopBranch, getMapUrl } from './branchHelpers';

// 🌟 Special Gold Star Pin for Primary Headquarters (Main Branch)
const mainPinIcon = L.divIcon({
  className: '',
  html: '<div style="filter: drop-shadow(0 3px 6px rgba(180,83,9,0.45)); transform: scale(1.15);"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="#D97706" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><polygon points="12 6 13.5 8.8 16.5 9.2 14.2 11.4 14.8 14.5 12 13 9.2 14.5 9.8 11.4 7.5 9.2 10.5 8.8 12 6" fill="#FEF3C7" stroke="#92400E" stroke-width="0.8"/></svg></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

// Satellite Branch standard Pin
const satellitePinIcon = L.divIcon({
  className: '',
  html: '<div style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#9A8073" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -22],
});

function FitBounds({ points }: { readonly points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

function FlyToSelected({ pos }: { readonly pos: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { duration: 0.8 });
  }, [map, pos]);
  return null;
}

export default function BranchesMap({ branches }: { readonly branches: ShopBranch[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const markerRefs = useRef(new Map<number, L.Marker>());

  const safeBranches = Array.isArray(branches) ? branches : [];

  // Pinned branches with valid coordinates. If Main Branch has missing coordinates,
  // fall back to default Davao City coordinates [7.0702, 125.6077] so it is NEVER missing!
  const pinned = safeBranches
    .map(b => {
      let lat = Number(b.latitude);
      let lng = Number(b.longitude);
      if (b.is_main && (Number.isNaN(lat) || Number.isNaN(lng) || !b.latitude || !b.longitude)) {
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
      <div className="bg-surface border border-line rounded-2xl p-10 text-center text-sm text-ink-muted">
        No branches have map coordinates yet. Add a Latitude/Longitude to a branch to pin it here.
      </div>
    );
  }

  const points = pinned.map(p => p.pos);
  const selectedPos = pinned.find(p => p.branch.id === selectedId)?.pos ?? null;

  const handleSelect = (id: number) => {
    setSelectedId(id);
    markerRefs.current.get(id)?.openPopup();
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-line flex flex-col md:flex-row bg-surface shadow-xs" style={{ height: 460 }}>
      {/* Sidebar List */}
      <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-line bg-surface overflow-y-auto max-h-40 md:max-h-none">
        <div className="p-3 bg-canvas/60 border-b border-line">
          <p className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            All Locations ({pinned.length})
          </p>
        </div>
        {pinned.map(({ branch }) => (
          <button
            key={branch.id}
            type="button"
            onClick={() => handleSelect(branch.id)}
            className={`w-full text-left px-4 py-3 flex items-start gap-2.5 border-b border-line last:border-b-0 transition-colors cursor-pointer ${
              selectedId === branch.id
                ? 'bg-sunken border-l-4 border-l-taupe'
                : 'hover:bg-canvas'
            }`}
          >
            {branch.is_main ? (
              <Star size={15} className="mt-0.5 shrink-0 fill-amber-500 text-amber-600" />
            ) : (
              <MapPin size={15} className={`mt-0.5 shrink-0 ${selectedId === branch.id ? 'text-taupe' : 'text-ink-muted'}`} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm font-semibold truncate ${selectedId === branch.id ? 'text-taupe' : 'text-ink'}`}>
                  {branch.name}
                </p>
                {branch.is_main && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 shrink-0">
                    HQ
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-muted truncate mt-0.5">{branch.address}, {branch.city}</p>
              {branch.manager?.user && (
                <p className="text-[11px] text-taupe truncate mt-0.5">
                  Mgr: {branch.manager.user.name}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Map Canvas */}
      <div className="flex-1 min-h-0 relative">
        <MapContainer center={points[0]} zoom={13} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitBounds points={points} />
          <FlyToSelected pos={selectedPos} />
          {pinned.map(({ branch, pos }) => (
            <Marker
              key={branch.id}
              position={pos}
              icon={branch.is_main ? mainPinIcon : satellitePinIcon}
              ref={(ref) => {
                if (ref) markerRefs.current.set(branch.id, ref);
                else markerRefs.current.delete(branch.id);
              }}
              eventHandlers={{ click: () => setSelectedId(branch.id) }}
            >
              <Popup className="sutura-branch-popup">
                <div className="p-1 text-ink min-w-[200px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    {branch.is_main ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
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

                  <a
                    href={getMapUrl(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-taupe hover:underline"
                  >
                    <ExternalLink size={12} /> Open in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

