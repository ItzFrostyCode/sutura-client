'use client';

import { useEffect, useState } from 'react';
import { haversineKm } from '@/lib/customerLocation';
import { angleDiff } from '@/lib/angle';

export type LiveStatus = 'idle' | 'waiting' | 'live' | 'denied' | 'unavailable';
export interface LiveFix { readonly lat: number; readonly lng: number; readonly accuracy: number }

interface Course { readonly session: number; readonly degrees: number | null }
interface Reading { readonly session: number; readonly fix: LiveFix | null; readonly status: LiveStatus }

// A GPS reports every second or so even when you stand still, jittering a few metres. Only real movement is passed on,
// at most once a second, and a poor reading (a Wi-Fi or cell-tower guess) is ignored once a good one is known.
const MIN_MOVE_M = 5;
const MIN_GAP_MS = 1000;
const POOR_ACCURACY_M = 200;
// Above about 7 km/h (a bike, a motorbike, a car) the GPS's direction of travel is better than the compass; walking uses the compass.
const COURSE_MIN_SPEED_MS = 2;

/**
 * The person's live GPS position, only while a navigation `session` is active (null = off). Following the browser's
 * location the whole time they browse would drain the battery, keep the GPS light on and re-sort the shops with every step,
 * so it is switched on by Get Directions and off again by Cancel or arriving.
 */
export function useLivePosition(session: number | null) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const supported = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

  useEffect(() => {
    if (session === null || !supported) return;
    let last: { lat: number; lng: number; at: number } | null = null;
    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        // The course follows every reading, not only the ones that move the dot, so it drops back to the compass when you stop.
        const moving = coords.speed !== null && coords.speed >= COURSE_MIN_SPEED_MS && coords.heading !== null && !Number.isNaN(coords.heading);
        const degrees = moving ? Math.round(coords.heading as number) : null;
        setCourse((prev) => {
          const same = prev?.session === session && (prev.degrees === degrees || (prev.degrees !== null && degrees !== null && angleDiff(prev.degrees, degrees) < 4));
          return same ? prev : { session, degrees };
        });
        const at = Date.now();
        if (last) {
          const moved = haversineKm(last.lat, last.lng, coords.latitude, coords.longitude) * 1000;
          if (moved < MIN_MOVE_M || at - last.at < MIN_GAP_MS || coords.accuracy > POOR_ACCURACY_M) return;
        }
        last = { lat: coords.latitude, lng: coords.longitude, at };
        setReading({ session, status: 'live', fix: { lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy } });
      },
      (error) => {
        // A timeout between two good readings is normal in a tunnel; only a block or a dead GPS from the start is reported.
        setReading((prev) => (prev?.session === session && prev.fix && error.code !== error.PERMISSION_DENIED ? prev : { session, fix: null, status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable' }));
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [session, supported]);

  const mine = reading && reading.session === session ? reading : null;
  const status: LiveStatus = session === null ? 'idle' : !supported ? 'unavailable' : mine?.status ?? 'waiting';
  const myCourse = course && course.session === session ? course.degrees : null;
  return { fix: session === null ? null : mine?.fix ?? null, status, course: session === null ? null : myCourse };
}
