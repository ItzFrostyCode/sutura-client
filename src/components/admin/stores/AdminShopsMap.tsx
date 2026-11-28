'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink } from 'lucide-react';
import PlanPill, { PILL } from '@/components/admin/ui/PlanPill';
import { formatAddress } from '@/lib/formatAddress';
import { buildStorePinIcon } from '@/components/discovery/DiscoveryMap';
import { isStoreOpen } from '@/lib/storeStatus';
import { planRing, type ShopPin } from './shopPins';

const DAVAO: [number, number] = [7.0731, 125.6128];

/** Fits the view to the pins whenever the set changes; stops animations on unmount. */
function FitToPins({ pins }: { readonly pins: ShopPin[] }) {
  const map = useMap();
  useEffect(() => () => { try { map.stop(); } catch { /* unmounting mid-animation */ } }, [map]);
  useEffect(() => {
    if (pins.length === 0) return;
    if (pins.length === 1) map.setView([pins[0].latitude, pins[0].longitude], 15, { animate: false });
    else map.fitBounds(pins.map((p) => [p.latitude, p.longitude] as [number, number]), { padding: [48, 48], maxZoom: 15, animate: false });
  }, [map, pins]);
  return null;
}

export default function AdminShopsMap({ pins }: { readonly pins: ShopPin[] }) {
  return (
    <MapContainer center={DAVAO} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <FitToPins pins={pins} />
      {pins.map((p) => (
        <Marker
          key={p.key}
          position={[p.latitude, p.longitude]}
          // Same pin as the public /map, labelled with the shop (or branch) name, its ring in the plan's colour.
          icon={buildStorePinIcon(p.logo_path, p.is_main ? p.name : (p.branch_name || p.name), isStoreOpen(p.operating_hours), false, false, planRing(p.plan_slug))}
          title={p.is_main ? p.name : `${p.name} · ${p.branch_name ?? 'Branch'}`}
        >
          <Popup>
            <div className="min-w-52 space-y-2 font-sans">
              {/* m-0!: Leaflet's popup CSS gives every <p> a 1.3em margin. */}
              <div>
                <p className="m-0! text-sm font-semibold text-ink">{p.name}</p>
                <p className="m-0! text-xs font-medium text-ink-body">
                  {p.is_main ? 'Main shop' : `Branch · ${p.branch_name ?? 'Unnamed'}`}
                </p>
              </div>
              <p className="m-0! text-xs leading-relaxed text-ink-muted">
                {formatAddress({ address: p.address, barangay: p.barangay, district: p.district, city: p.city, province: p.province }) || 'No address on file'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <PlanPill plan={p.plan} />
                {p.subscription_status === 'trial' && <span className={`${PILL} border-orange-200 bg-orange-50 text-orange-700`}>Trial</span>}
              </div>
              <a
                href={`/store/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-ink! underline underline-offset-2"
              >
                Open shop page <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
