'use client';

import { useState } from 'react';
import { Crosshair, ExternalLink, Loader2, MapPinned } from 'lucide-react';
import { googleMapsHref, inDavaoCity, parseCoordinates, type LatLng } from '@/lib/coordinates';

interface PinPasteProps {
  readonly current: LatLng | null;
  readonly onPin: (pin: LatLng) => void;
  readonly onPickOnMap: () => void;
  /** Reads a Google Maps share link into a pin (the branch form has a shop to ask the server with). */
  readonly resolveLink?: (url: string) => Promise<LatLng>;
}

const button = 'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-taupe px-3 text-sm font-semibold text-taupe transition-colors hover:bg-taupe/5 disabled:opacity-50';

/**
 * Setting a map pin the simple way (owner, 2026-10-15): copy the location from Google Maps and paste it, use the
 * phone's GPS while standing in the shop, or pick on the map. What is set shows as coordinates with a link to check it.
 */
export default function PinPaste({ current, onPin, onPickOnMap, resolveLink }: PinPasteProps) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<'link' | 'gps' | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const apply = async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    const pin = parseCoordinates(value);
    if (pin) {
      onPin(pin);
      setNote({ ok: true, text: 'Pin set from the coordinates you pasted.' });
      return;
    }
    if (resolveLink && /^https?:\/\//i.test(value)) {
      setBusy('link');
      try {
        onPin(await resolveLink(value));
        setNote({ ok: true, text: 'Pin set from your Google Maps link.' });
      } catch {
        setNote({ ok: false, text: 'Couldn’t read a location from that link. Paste the coordinates instead.' });
      } finally {
        setBusy(null);
      }
      return;
    }
    setNote({ ok: false, text: resolveLink ? 'Paste coordinates like 7.0702, 125.6077, or a Google Maps link.' : 'Paste coordinates like 7.0702, 125.6077.' });
  };

  const useGps = () => {
    if (!navigator.geolocation) return setNote({ ok: false, text: 'This device can’t share its location. Paste or pick on the map.' });
    setBusy('gps');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(null);
        onPin({ lat: Number(pos.coords.latitude.toFixed(7)), lng: Number(pos.coords.longitude.toFixed(7)) });
        const m = Math.round(pos.coords.accuracy);
        setNote(m > 100
          ? { ok: false, text: `Pin set, but your phone’s location is rough (±${m} m). Check it on the map, or stand near a window and try again.` }
          : { ok: true, text: `Pin set from your phone’s location (±${m} m).` });
      },
      () => { setBusy(null); setNote({ ok: false, text: 'Location is off or blocked for this site. Paste the coordinates or pick on the map.' }); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  return (
    <div>
      <p className="mb-2 text-xs text-ink-muted">
        In Google Maps, long-press your shop (or tap your blue dot while you’re there), copy the coordinates{resolveLink ? ' or the Share link' : ''}, and paste them here.
      </p>
      <div className="flex gap-2">
        <label htmlFor="pin-paste" className="sr-only">Paste the shop’s location</label>
        <input
          id="pin-paste"
          type="text"
          inputMode="text"
          placeholder={resolveLink ? 'e.g. 7.0702, 125.6077 or a Maps link' : 'e.g. 7.0702, 125.6077'}
          value={text}
          onChange={(e) => { setText(e.target.value); setNote(null); }}
          onPaste={(e) => { const v = e.clipboardData.getData('text'); if (v) { e.preventDefault(); setText(v); void apply(v); } }}
          className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 text-base text-ink focus:border-taupe focus:outline-none"
        />
        <button type="button" onClick={() => void apply(text)} disabled={!text.trim() || busy !== null} className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-taupe px-4 text-sm font-semibold text-white hover:bg-taupe/90 disabled:opacity-50">
          {busy === 'link' && <Loader2 size={15} className="animate-spin" />} Use
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={useGps} disabled={busy !== null} className={button}>
          {busy === 'gps' ? <Loader2 size={15} className="animate-spin" /> : <Crosshair size={15} />} Use my current location
        </button>
        <button type="button" onClick={onPickOnMap} className={button}><MapPinned size={15} /> Pick on map</button>
      </div>
      {note && <p className={`mt-2 text-xs ${note.ok ? 'text-emerald-700' : 'text-amber-800'}`}>{note.text}</p>}
      {current && (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          <span>Pin: {current.lat.toFixed(5)}, {current.lng.toFixed(5)}</span>
          <a href={googleMapsHref(current)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-taupe underline underline-offset-2">
            Check in Google Maps <ExternalLink size={12} />
          </a>
          {!inDavaoCity(current) && <span className="w-full text-amber-800">This pin is outside Davao City — check it before saving.</span>}
        </p>
      )}
    </div>
  );
}
