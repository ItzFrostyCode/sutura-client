'use client';

import { useState } from 'react';
import { AlertCircle, Check, Crosshair, ExternalLink, Loader2, MapPinned } from 'lucide-react';
import { reverseGeocodeCoords } from '@/lib/geocoding';

export interface PinPoint {
  lat: number;
  lng: number;
  address: string;
  district: string;
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
 * Setting a shop/branch pin: "Use my current location" (phone GPS, for an owner
 * standing in the shop) or "Pick on map". Once set, shows the pin with a link to
 * check it in Google Maps.
 */
export default function PinTools({ current, onPin, onPickOnMap, variant = 'rounded' }: PinToolsProps) {
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const round = variant === 'rounded' ? 'rounded-lg' : '';

  const useGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setNote({ ok: false, text: "This device can't share its location. Use \"Pick on map\" instead." });
      return;
    }
    setLocating(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(7));
        const lng = Number(pos.coords.longitude.toFixed(7));
        // Best effort: a readable address for the pin; the coordinates are what count.
        const place = await reverseGeocodeCoords(lat, lng).catch(() => null);
        setLocating(false);
        onPin({ lat, lng, address: place?.address ?? '', district: place?.district ?? '' });
        const m = Math.round(pos.coords.accuracy);
        setNote({
          ok: true,
          text: m > 100
            ? `Pin set from your location (accurate to about ${m} m). Check it, and move it on the map if it's off.`
            : `Pin set from your location (accurate to about ${m} m).`,
        });
      },
      (err) => {
        setLocating(false);
        setNote({
          ok: false,
          text: err.code === 1
            ? 'Location access was blocked. Allow it in your browser settings, or use "Pick on map".'
            : 'Could not get your location. Use "Pick on map" instead.',
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const button = `flex min-h-11 flex-1 items-center justify-center gap-2 border border-ink px-3 text-sm font-semibold text-ink transition-colors hover:bg-sunken disabled:opacity-50 ${round}`;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 gap-2.5 min-[480px]:grid-cols-2">
        <button type="button" onClick={useGps} disabled={locating} className={button}>
          {locating ? <Loader2 size={16} className="animate-spin" /> : <Crosshair size={16} />}
          {locating ? 'Finding you…' : 'Use my current location'}
        </button>
        <button type="button" onClick={onPickOnMap} className={button}>
          <MapPinned size={16} /> {current ? 'Change on map' : 'Pick on map'}
        </button>
      </div>

      {note && (
        <p role="status" className={`flex items-start gap-2 border px-3 py-2 text-xs ${round} ${note.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
          {note.ok ? <Check size={14} className="mt-0.5 shrink-0" /> : <AlertCircle size={14} className="mt-0.5 shrink-0" />}
          {note.text}
        </p>
      )}

      {current && (
        <div className={`flex items-start gap-3 border border-sage bg-sage/5 px-3 py-2.5 ${round}`}>
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-white">
            <Check size={13} strokeWidth={3} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Pin location set</p>
            {current.address && <p className="truncate text-xs text-ink-body">{current.address}</p>}
            <p className="text-xs text-ink-muted tabular-nums">{current.lat.toFixed(5)}, {current.lng.toFixed(5)}</p>
            <a
              href={googleMapsHref(current.lat, current.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-taupe hover:underline"
            >
              Check in Google Maps <ExternalLink size={11} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
