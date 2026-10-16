'use client';

import { useState } from 'react';
import { Crosshair, ExternalLink, Loader2, MapPinned, Check, AlertCircle } from 'lucide-react';
import { googleMapsHref, inDavaoCity, type LatLng } from '@/lib/coordinates';

interface PinPasteProps {
  readonly current: LatLng | null;
  readonly onPin: (pin: LatLng) => void;
  readonly onPickOnMap: () => void;
  /** Reads a Google Maps share link into a pin (deprecated / optional). */
  readonly resolveLink?: (url: string) => Promise<LatLng>;
}

const button =
  'flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-taupe bg-canvas px-3 text-sm font-semibold text-taupe transition-colors hover:bg-taupe/5 active:scale-[0.99] disabled:opacity-50';

/**
 * Setting a shop map pin: use device GPS or pick on the interactive map.
 */
export default function PinPaste({ current, onPin, onPickOnMap }: PinPasteProps) {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const useGps = () => {
    if (!navigator.geolocation) {
      setNote({ ok: false, text: 'This device cannot share its location. Please click "Pick on map" to choose your shop location.' });
      return;
    }
    setGpsLoading(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        onPin({
          lat: Number(pos.coords.latitude.toFixed(7)),
          lng: Number(pos.coords.longitude.toFixed(7)),
        });
        const m = Math.round(pos.coords.accuracy);
        setNote(
          m > 100
            ? { ok: true, text: `Pin set from current location (±${m}m accuracy). You can adjust on the map if needed.` }
            : { ok: true, text: `Pin set from your current location (±${m}m accuracy).` },
        );
      },
      (err) => {
        setGpsLoading(false);
        const msg =
          err.code === 1
            ? 'Location access was denied. Please allow location permissions in your browser or click "Pick on map".'
            : 'Unable to retrieve location. Please click "Pick on map" instead.';
        setNote({ ok: false, text: msg });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button type="button" onClick={useGps} disabled={gpsLoading} className={button}>
          {gpsLoading ? <Loader2 size={16} className="animate-spin text-taupe" /> : <Crosshair size={16} />}
          <span>Use my current location</span>
        </button>

        <button type="button" onClick={onPickOnMap} className={button}>
          <MapPinned size={16} />
          <span>Pick on map</span>
        </button>
      </div>

      {note && (
        <div
          className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${
            note.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
          }`}
        >
          {note.ok ? <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" /> : <AlertCircle size={14} className="mt-0.5 shrink-0 text-amber-600" />}
          <span>{note.text}</span>
        </div>
      )}

      {current && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-line bg-canvas p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
              <Check size={14} className="stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">
                Pin Location Set ({current.lat.toFixed(5)}, {current.lng.toFixed(5)})
              </p>
              <a
                href={googleMapsHref(current)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-taupe hover:underline"
              >
                <span>Check in Google Maps</span>
                <ExternalLink size={11} />
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onPickOnMap}
            className="self-end sm:self-center shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-taupe hover:bg-taupe/10 transition-colors"
          >
            Change on map
          </button>
        </div>
      )}

      {current && !inDavaoCity(current) && (
        <p className="flex items-center gap-1.5 text-xs text-amber-700">
          <AlertCircle size={13} className="shrink-0" />
          <span>This pin is outside Davao City — please verify or pick again.</span>
        </p>
      )}
    </div>
  );
}
