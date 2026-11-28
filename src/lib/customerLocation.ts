// Per-device "where am I browsing from" — used by the /search location
// picker. Deliberately localStorage-only, not a backend field: `users` has
// no address column (SUTURA has no delivery/logistics in scope per the
// thesis Limitations), so this is a browsing convenience, not a real
// customer profile field. district is the one part of this that actually
// drives a real backend filter (CatalogController::publicShowroom's
// `district` param) — lat/lng/address are for display + map placement only.
export interface SavedLocation {
  lat: number;
  lng: number;
  address: string;
  district: string;
  /** Radius in metres the device gave for a "Use my location" fix; absent for a place picked on the map or typed. */
  accuracy?: number;
  /** True when this is the Davao City fallback, not the visitor's real spot (team lead's landing splash). */
  isDefault?: boolean;
}

/** Fallback when detection is declined, ignored or too slow: Davao City centre. */
export const DEFAULT_LOCATION: SavedLocation = {
  lat: 7.0731,
  lng: 125.6128,
  address: 'Davao City',
  district: 'Davao City',
  isDefault: true,
};

import { reverseGeocodeCoords } from './geocoding';

const KEY = 'sutura_customer_location';
const OLD_KEY = 'sutura_old_location';

export function getSavedLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') return null;
    return parsed as SavedLocation;
  } catch {
    return null;
  }
}

export const LOCATION_CHANGED_EVENT = 'sutura:location_changed';

export function saveLocation(loc: SavedLocation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT, { detail: loc }));
    }
  } catch {
    // Private browsing / storage disabled
  }
}

export function getOldLocation(): SavedLocation | null {
  try {
    const raw = localStorage.getItem(OLD_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== 'number' || typeof parsed?.lng !== 'number') return null;
    return parsed as SavedLocation;
  } catch {
    return null;
  }
}

export function saveOldLocation(loc: SavedLocation): void {
  try {
    localStorage.setItem(OLD_KEY, JSON.stringify(loc));
  } catch {
    // Private browsing
  }
}

export function saveLocationWithHistory(newLoc: SavedLocation): void {
  const current = getSavedLocation();
  if (current && (current.lat !== newLoc.lat || current.lng !== newLoc.lng)) {
    saveOldLocation(current);
  }
  saveLocation(newLoc);
  addRecentLocation(newLoc);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGED_EVENT, { detail: newLoc }));
  }
}

export function swapLocations(): { current: SavedLocation | null; old: SavedLocation | null } | null {
  const current = getSavedLocation();
  const old = getOldLocation();
  if (!old) return null;
  if (current) saveOldLocation(current);
  saveLocation(old);
  return { current: old, old: current };
}

export function formatTravelEstimate(distanceKm: number): string {
  return `${distanceKm.toFixed(1)} km`;
}

// A short "Recent" history of previously-picked locations, shown at the top
// of the location picker's search screen (same idea as Grab/Google Maps'
// own recent-places list) — separate from the single "current default"
// saveLocation() above.
export interface RecentLocation extends SavedLocation {
  savedAt: number;
}

const RECENT_KEY = 'sutura_recent_locations';
const MAX_RECENT = 6;

export function getRecentLocations(): RecentLocation[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentLocation(loc: SavedLocation): void {
  try {
    // Drop any existing entry for roughly the same spot (~50m) before
    // re-adding it at the front, so picking the same place twice doesn't
    // pile up duplicates.
    const existing = getRecentLocations().filter(
      (r) => !(Math.abs(r.lat - loc.lat) < 0.0005 && Math.abs(r.lng - loc.lng) < 0.0005)
    );
    const next = [{ ...loc, savedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Same private-browsing fallback as saveLocation() above.
  }
}

export function removeRecentLocation(lat: number, lng: number): void {
  try {
    const existing = getRecentLocations().filter(
      (r) => !(Math.abs(r.lat - lat) < 0.0005 && Math.abs(r.lng - lng) < 0.0005)
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(existing));
  } catch {}
}

export function clearRecentLocations(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}

// ─── Home / Main address ───────────────────────────────────────────────────
const HOME_KEY = 'sutura_home_location';

export interface HomeLocation extends SavedLocation {
  label: string; // e.g. "My Home", "Office"
}

export function getHomeLocation(): HomeLocation | null {
  try {
    const raw = localStorage.getItem(HOME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== 'number') return null;
    return parsed as HomeLocation;
  } catch {
    return null;
  }
}

export function saveHomeLocation(loc: HomeLocation): void {
  try {
    localStorage.setItem(HOME_KEY, JSON.stringify(loc));
  } catch {}
}

export function removeHomeLocation(): void {
  try {
    localStorage.removeItem(HOME_KEY);
  } catch {}
}


export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getItemDistanceInfo(
  item: {
    distance_km?: number | null;
    store?: {
      branches?: {
        name: string;
        district?: string | null;
        city?: string | null;
        latitude?: number | string | null;
        longitude?: number | string | null;
      }[];
    } | null;
  },
  userCoords?: { lat: number; lng: number } | null
): { distanceKm: number; label: string } | null {
  if (item.distance_km != null) {
    const firstBranch = item.store?.branches?.[0];
    const locName = firstBranch?.name || firstBranch?.city || '';
    return {
      distanceKm: item.distance_km,
      label: locName ? `${item.distance_km.toFixed(1)} km · ${locName}` : `${item.distance_km.toFixed(1)} km`,
    };
  }

  if (!userCoords || !item.store?.branches?.length) return null;

  let minKm: number | null = null;
  let nearestBranchName = '';

  for (const b of item.store.branches) {
    if (b.latitude == null || b.longitude == null) continue;
    const bLat = Number(b.latitude);
    const bLng = Number(b.longitude);
    if (Number.isNaN(bLat) || Number.isNaN(bLng)) continue;

    const d = haversineKm(userCoords.lat, userCoords.lng, bLat, bLng);
    if (minKm === null || d < minKm) {
      minKm = d;
      nearestBranchName = b.name || b.city || '';
    }
  }

  if (minKm === null) return null;

  return {
    distanceKm: minKm,
    label: nearestBranchName ? `${minKm.toFixed(1)} km · ${nearestBranchName}` : `${minKm.toFixed(1)} km`,
  };
}

export async function checkLocationPermission(): Promise<PermissionState | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state;
  } catch {
    return 'unsupported';
  }
}

export function requestCurrentLocation(
  onSuccess?: (loc: SavedLocation) => void,
  onError?: (err: GeolocationPositionError | Error) => void
): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError?.(new Error('Geolocation not supported'));
    return;
  }

  const handlePositionSuccess = async (pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = pos.coords;
    let address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    let district = 'Davao City';

    try {
      const geo = await reverseGeocodeCoords(latitude, longitude);
      address = geo.address;
      district = geo.district;
    } catch {
      // Fallback
    }

    const loc: SavedLocation = {
      lat: latitude,
      lng: longitude,
      address,
      district,
      accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : undefined,
    };

    saveLocationWithHistory(loc);
    onSuccess?.(loc);
  };

  getBestPosition(handlePositionSuccess, (err) => onError?.(err));
}

/** Stop watching as soon as a reading is this close (metres): a phone's GPS usually gets here in 1–3 s. */
const GOOD_ENOUGH_M = 30;
/** Never watch longer than this; the best reading so far is used. Kept under the landing gate's 8 s ask. */
const WATCH_WINDOW_MS = 6000;

/**
 * The most accurate position the device can give in a few seconds.
 *
 * The first reading is often a stale cache or a rough Wi-Fi/cell guess, and GPS sharpens over the next seconds; the
 * old code took the first one (and accepted readings up to 2–5 minutes old), which could put a person a street or a
 * barangay away. This watches fresh readings (`maximumAge: 0`), keeps the one with the smallest `accuracy` radius, and
 * stops early once it is within GOOD_ENOUGH_M. A device with no GPS (most laptops) still answers from Wi-Fi —
 * `accuracy` then tells the page the place is approximate.
 */
export function getBestPosition(onSuccess: (pos: GeolocationPosition) => void, onError: (err: GeolocationPositionError | Error) => void): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onError(new Error('Geolocation not supported'));
    return;
  }

  let best: GeolocationPosition | null = null;
  let done = false;
  let watchId: number | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const finish = (err?: GeolocationPositionError) => {
    if (done) return;
    done = true;
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (timer) clearTimeout(timer);
    if (best) onSuccess(best);
    else if (err) onError(err);
    else lowAccuracyFallback();
  };

  // No fresh fix at all in the window (e.g. GPS off indoors): one rough reading, at most a minute old.
  const lowAccuracyFallback = () => {
    navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  };

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
      if (pos.coords.accuracy <= GOOD_ENOUGH_M) finish();
    },
    (err) => {
      // A block (PERMISSION_DENIED = 1) is final; other errors just end the watch with what we have.
      if (err.code === 1) finish(err);
      else if (!best) finish();
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: WATCH_WINDOW_MS },
  );
  timer = setTimeout(() => finish(), WATCH_WINDOW_MS);
}

/** Past this radius (metres) the place came from Wi-Fi or the network, not GPS: say so and offer the map. */
export const APPROXIMATE_M = 150;

export function isApproximate(loc: Pick<SavedLocation, 'accuracy'> | null | undefined): boolean {
  return typeof loc?.accuracy === 'number' && loc.accuracy > APPROXIMATE_M;
}

// ---- Team lead's landing splash (LocationSplash): kept as in his customerLocation.ts so his landing keeps working. ----

const sleep = (ms: number) => new Promise<null>((r) => setTimeout(() => r(null), ms));

export interface StartupLocation {
  /** Settles with the visitor's spot, or the fallback (see below). */
  result: Promise<SavedLocation>;
  /** "Skip for now": stop waiting and use the fallback. */
  skip: () => void;
}

/**
 * Landing-splash location.
 *
 * The countdown never runs while the browser's "Allow location?" prompt is
 * open — the visitor's reading time isn't the GPS's time:
 *   - permission already granted → up to `fixMs` (8 s) for a position;
 *   - prompt showing → wait for the answer. Allow → then up to `fixMs`;
 *     Block / dismiss → fall back at once; ignoring it → the splash offers
 *     "Skip for now" (`skip`);
 *   - permission blocked → fall back at once.
 * Fallback = the visitor's last saved real location, else Davao City centre.
 *
 * High accuracy: a phone uses its GPS, which is much closer than the Wi-Fi /
 * network position (a laptop without GPS still answers from Wi-Fi). A reading
 * at most 10 s old may be reused; older ones drift. GPS can take longer than
 * `fixMs`, so the request stays alive for 30 s and a position that lands
 * after the fallback still replaces it (banner updates).
 * `hasResolved` makes whichever path finishes first the only one that counts.
 */
export function startStartupLocation({ fixMs = 8000 }: { fixMs?: number } = {}): StartupLocation {
  let hasResolved = false;
  let fixTimer: ReturnType<typeof setTimeout> | undefined;
  let settle!: (loc: SavedLocation) => void;
  const result = new Promise<SavedLocation>((r) => { settle = r; });

  const finish = (loc: SavedLocation, save: (l: SavedLocation) => void) => {
    if (hasResolved) return;
    hasResolved = true;
    clearTimeout(fixTimer);
    save(loc);
    settle(loc);
  };
  const fallBack = () => {
    const last = getSavedLocation();
    if (last && !last.isDefault) finish(last, () => { /* already saved */ });
    else finish(DEFAULT_LOCATION, saveLocation);
  };
  // Starts once there's nothing left to wait for but the position itself.
  const startFixTimer = () => {
    if (hasResolved || fixTimer) return;
    fixTimer = setTimeout(fallBack, fixMs);
  };

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    fallBack();
    return { result, skip: () => {} };
  }

  // Ask straight away (this is what shows the browser prompt).
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      if (hasResolved) {
        // Arrived after the fallback: swap in the real spot.
        void toLocation(pos, 8000).then(saveLocationWithHistory);
        return;
      }
      clearTimeout(fixTimer);
      // At least 2.5 s to name the place (the lookup itself takes 1–2 s); if
      // slower still, the name fills in when it arrives (toLocation upgrade).
      void toLocation(pos, 2500, true).then((loc) => finish(loc, saveLocationWithHistory));
    },
    () => fallBack(), // blocked, dismissed, unavailable
    { enableHighAccuracy: true, timeout: 30_000, maximumAge: 10_000 },
  );

  // Is the prompt up? Only then do we hold the countdown.
  if (navigator.permissions?.query) {
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'denied') { fallBack(); return; }
        if (status.state === 'granted') { startFixTimer(); return; }
        status.onchange = () => {
          if (status.state === 'granted') startFixTimer();
          else if (status.state === 'denied') fallBack();
        };
      })
      .catch(startFixTimer);
  } else {
    // No way to tell (older Safari): don't hold forever — prompt time included.
    fixTimer = setTimeout(fallBack, fixMs + 6000);
  }

  return { result, skip: fallBack };
}

async function toLocation(pos: GeolocationPosition, geocodeMs: number, upgradeLate = false): Promise<SavedLocation> {
  const { latitude, longitude } = pos.coords;
  const lookup = reverseGeocodeCoords(latitude, longitude).catch(() => null);
  const geo = await Promise.race([lookup, sleep(geocodeMs)]);
  if (!geo && upgradeLate) {
    // Too slow for the splash: save the real place name once it arrives,
    // unless the visitor has picked another spot in the meantime.
    void lookup.then((late) => {
      const current = getSavedLocation();
      if (!late || !current || current.lat !== latitude || current.lng !== longitude) return;
      if (/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(late.address)) return; // lookup failed too
      saveLocation({ ...current, address: late.address, district: late.district });
    });
  }
  return {
    lat: latitude,
    lng: longitude,
    // Coordinates as the label read as "Davao City" in the banner (formatFullLocationAddress).
    address: geo?.address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    district: geo?.district ?? 'Davao City',
  };
}
