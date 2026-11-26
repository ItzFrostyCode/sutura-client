'use client';

import { useState } from 'react';
import { AlertCircle, Check, ExternalLink, LocateFixed, Map as MapIcon } from 'lucide-react';
import LocationRow from '@/components/location/LocationRow';
import { reverseGeocodeCoords } from '@/lib/geocoding';
import { APPROXIMATE_M, getBestPosition } from '@/lib/customerLocation';

export interface PinPoint {
  lat: number;
  lng: number;
  address: string;
  district: string;
  /** Radius in metres the device gave (GPS); absent for a place picked on the map. */
  accuracy?: number;
}

interface PinToolsProps {
  /** The pin as it stands now (null = not set yet). */
  readonly current: { lat: number; lng: number; address?: string } | null;
  readonly onPin: (pin: PinPoint) => void;
  readonly onPickOnMap: () => void;
  /** 'square' for the shop application (sharp corners), 'rounded' for the dashboard forms. */
  readonly variant?: 'square' | 'rounded';
}

export const googleMapsHref = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat},${lng}`;

/**
 * Setting a shop/branch pin, with the customer side's wording and location code: "Current location" (the same
 * best-of-a-few-seconds GPS reading and address lookup as My Location, without changing the customer's own saved
 * place) or "Choose on map". Once set, shows the pin with a link to check it in Google Maps.
 */
export default function PinTools({ current, onPin, onPickOnMap, variant = 'rounded' }: PinToolsProps) {
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<{ tone: 'ok' | 'warn'; text: string } | null>(null);
  // Both looks are now the rounded group (the application moved to the Apple-style form); kept for older callers.
  const round = variant === 'rounded' || variant === 'square' ? 'rounded-xl' : '';

  const useGps = () => {
    setNote(null);
    // Browsers share GPS only on https (or localhost): a phone opening the site by its network address can't.
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setNote({ tone: 'warn', text: 'This browser only shares GPS on a secure (https) page. Use “Choose on map” instead.' });
      return;
    }
    setLocating(true);
    getBestPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(7));
        const lng = Number(pos.coords.longitude.toFixed(7));
        const accuracy = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : undefined;
        // Best effort: a readable address for the pin; the coordinates are what count.
        const place = await reverseGeocodeCoords(lat, lng).catch(() => null);
        setLocating(false);
        onPin({ lat, lng, address: place?.address ?? '', district: place?.district ?? '', accuracy });
        setNote(accuracy !== undefined && accuracy > APPROXIMATE_M
          ? { tone: 'warn', text: `Pin set, but only roughly (about ${accuracy} m). Check it, and move it with “Choose on map” if it’s off.` }
          : { tone: 'ok', text: accuracy !== undefined ? `Pin set from your location (accurate to about ${accuracy} m).` : 'Pin set from your location.' });
      },
      (err) => {
        setLocating(false);
        const blocked = 'code' in err && err.code === 1;
        setNote({
          tone: 'warn',
          text: blocked
            ? 'Location access is blocked. Allow it in your browser settings, or use “Choose on map”.'
            : 'We couldn’t get your location. Use “Choose on map” instead.',
        });
      },
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="divide-y divide-line/80 overflow-hidden rounded-2xl bg-surface ring-1 ring-line/80">
        <LocationRow
          flat
          icon={(
            <span className="relative flex h-7 w-7 items-center justify-center">
              {locating && (
                <>
                  <span className="pointer-events-none absolute -inset-0.5 animate-ping rounded-full bg-taupe/25" aria-hidden="true" />
                  <span className="pointer-events-none absolute inset-0 animate-spin rounded-full border-2 border-taupe-dark border-t-transparent" aria-hidden="true" />
                </>
              )}
              <LocateFixed size={22} className={`relative z-10 transition-all ${locating ? 'scale-90 text-taupe-dark' : ''}`} />
            </span>
          )}
          title="Current location"
          subtitle={locating ? 'Detecting GPS…' : 'Use your device GPS while you’re at the shop'}
          onClick={useGps}
          disabled={locating}
        />
        <LocationRow flat icon={<MapIcon size={22} />} title={current ? 'Change on map' : 'Choose on map'} subtitle="Pin the exact place on the map" onClick={onPickOnMap} />
      </div>

      {note && (
        <p role="status" className={`flex items-start gap-2 px-3 py-2.5 text-[13px] ${round} ${note.tone === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
          {note.tone === 'ok' ? <Check size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
          {note.text}
        </p>
      )}

      {current && (
        <div className={`flex items-start gap-3 bg-sage/10 px-4 py-3 ${round}`}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-white">
            <Check size={13} strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">Pin location set</p>
            {current.address && <p className="break-words text-[13px] text-ink-body">{current.address}</p>}
            <p className="text-[13px] text-ink-muted tabular-nums">{current.lat.toFixed(5)}, {current.lng.toFixed(5)}</p>
            <a
              href={googleMapsHref(current.lat, current.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex min-h-8 items-center gap-1 text-[13px] font-semibold text-taupe hover:underline"
            >
              Check in Google Maps <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
