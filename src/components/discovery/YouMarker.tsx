'use client';

import { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from '@/lib/leafletSafe';
import { useCompassHeading } from '@/hooks/useCompassHeading';

// The beam: a flat, translucent wedge fanning out from the dot toward where the person faces (north = up, turned by the heading).
const BEAM = '<svg viewBox="0 0 100 100" width="100" height="100" style="display:block"><path d="M50 50 L28.4 9.4 A46 46 0 0 1 71.6 9.4 Z" fill="#3B82F6" fill-opacity="0.3"/></svg>';

// "You are here": a plain blue dot with a white ring, a pulsing halo and a "You" label — no photo, no initial — so it
// can never be mistaken for a store pin. The beam is hidden until a heading is known.
const youIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:30px;height:30px;">
      <div class="you-beam" style="position:absolute;left:-35px;top:-35px;width:100px;height:100px;opacity:0;pointer-events:none;transition:opacity 0.3s,transform 0.25s linear;">${BEAM}</div>
      <span style="position:absolute;inset:-10px;border-radius:9999px;background:#3B82F6;opacity:0.3;animation:sutura-pulse 1.8s ease-out infinite;"></span>
      <div style="position:relative;width:30px;height:30px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);"></div>
      <span style="position:absolute;left:50%;top:100%;transform:translate(-50%,5px);background:#3B82F6;color:#fff;font:600 11px sans-serif;padding:2px 9px;border-radius:9999px;border:2px solid #fff;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.3);">You</span>
    </div>
    <style>@keyframes sutura-pulse{0%{transform:scale(0.7);opacity:0.5;}100%{transform:scale(1.8);opacity:0;}}</style>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface YouMarkerProps {
  readonly position: { readonly lat: number; readonly lng: number };
  /** Direction of travel from the GPS while moving fast (bike, motorbike, car); the phone's compass is used otherwise. */
  readonly course?: number | null;
}

/** Where I am, with a beam showing which way I face (as in Google Maps) once the phone knows it. */
export default function YouMarker({ position, course = null }: YouMarkerProps) {
  const compass = useCompassHeading();
  const heading = course ?? compass;
  const markerRef = useRef<L.Marker | null>(null);
  // The angle as drawn, kept unwrapped so turning from 350° to 10° goes the short way round.
  const drawn = useRef(0);

  useEffect(() => {
    // Turning the beam by hand keeps the marker as it is: a new icon would rebuild it many times a second.
    const beam = markerRef.current?.getElement()?.querySelector<HTMLElement>('.you-beam');
    if (!beam) return;
    if (heading === null) {
      beam.style.opacity = '0';
      return;
    }
    drawn.current += ((((heading - drawn.current) % 360) + 540) % 360) - 180;
    beam.style.transform = `rotate(${drawn.current}deg)`;
    beam.style.opacity = '1';
  }, [heading]);

  return (
    <Marker ref={markerRef} position={[position.lat, position.lng]} icon={youIcon} zIndexOffset={1000}>
      <Popup>You are here</Popup>
    </Marker>
  );
}
