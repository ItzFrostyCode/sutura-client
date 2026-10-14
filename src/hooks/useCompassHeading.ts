'use client';

import { useEffect, useState } from 'react';
import { angleDiff } from '@/lib/angle';

type AskForCompass = () => Promise<'granted' | 'denied'>;
type Orientation = DeviceOrientationEvent & { webkitCompassHeading?: number };

// A sensor reading comes many times a second; the arrow only needs a new angle after a real turn.
const MIN_TURN_DEG = 3;
const MIN_GAP_MS = 120;

/** iPhone and iPad only share the compass after the person says yes to a prompt that a tap must trigger; elsewhere there is nothing to ask. */
function permissionAsk(): AskForCompass | null {
  if (typeof DeviceOrientationEvent === 'undefined') return null;
  const ask = (DeviceOrientationEvent as unknown as { requestPermission?: AskForCompass }).requestPermission;
  return typeof ask === 'function' ? ask.bind(DeviceOrientationEvent) : null;
}

let allowed = false;
const wake = new Set<() => void>();

/** Call it from a tap (my location, Get Directions). Asks iOS for the compass once; harmless on Android and desktop. */
export function enableCompass(): void {
  const ask = permissionAsk();
  if (!ask || allowed) return;
  ask()
    .then((answer) => {
      if (answer !== 'granted') return;
      allowed = true;
      wake.forEach((start) => start());
    })
    .catch(() => {});
}

/** Degrees clockwise from true north the device's back points to (the way someone holding the phone up in front of them faces). */
function headingOf(e: Orientation): number | null {
  if (typeof e.webkitCompassHeading === 'number') return e.webkitCompassHeading; // iOS
  // Android Chrome: only the "absolute" event is tied to north. Formula: W3C DeviceOrientation spec, "compass heading".
  if (e.type !== 'deviceorientationabsolute' || e.alpha === null || e.beta === null || e.gamma === null) return null;
  const rad = Math.PI / 180;
  const [a, b, g] = [e.alpha * rad, e.beta * rad, e.gamma * rad];
  const x = -Math.cos(a) * Math.sin(g) - Math.sin(a) * Math.sin(b) * Math.cos(g);
  const y = -Math.sin(a) * Math.sin(g) + Math.cos(a) * Math.sin(b) * Math.cos(g);
  return (((Math.atan2(x, y) * 180) / Math.PI) + 360) % 360;
}

/** Which way the phone faces, from its compass; null on a laptop or until the sensor answers. Only listens while a component uses it. */
export function useCompassHeading(): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  const [granted, setGranted] = useState(0);

  useEffect(() => {
    const start = () => setGranted((n) => n + 1);
    wake.add(start);
    return () => {
      wake.delete(start);
    };
  }, []);

  useEffect(() => {
    if (permissionAsk() && !allowed) return;
    let last = { at: 0, deg: -1000 };
    const onOrientation = (event: Event) => {
      const deg = headingOf(event as Orientation);
      if (deg === null || Number.isNaN(deg)) return;
      const at = Date.now();
      if (at - last.at < MIN_GAP_MS || angleDiff(deg, last.deg) < MIN_TURN_DEG) return;
      last = { at, deg };
      setHeading(Math.round(deg));
    };
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);
    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [granted]);

  return heading;
}
