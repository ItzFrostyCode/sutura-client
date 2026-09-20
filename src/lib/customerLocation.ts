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
}

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

export function saveLocation(loc: SavedLocation): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(loc));
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
    shop?: {
      branches?: {
        name: string;
        district?: string | null;
        latitude?: number | string | null;
        longitude?: number | string | null;
      }[];
    } | null;
  },
  userCoords?: { lat: number; lng: number } | null
): { distanceKm: number; label: string } | null {
  if (item.distance_km != null) {
    const firstBranch = item.shop?.branches?.[0];
    const locName = firstBranch?.district || firstBranch?.name || '';
    return {
      distanceKm: item.distance_km,
      label: locName ? `${item.distance_km.toFixed(1)} km · ${locName}` : `${item.distance_km.toFixed(1)} km`,
    };
  }

  if (!userCoords || !item.shop?.branches?.length) return null;

  let minKm: number | null = null;
  let nearestBranchName = '';

  for (const b of item.shop.branches) {
    if (b.latitude == null || b.longitude == null) continue;
    const bLat = Number(b.latitude);
    const bLng = Number(b.longitude);
    if (Number.isNaN(bLat) || Number.isNaN(bLng)) continue;

    const d = haversineKm(userCoords.lat, userCoords.lng, bLat, bLng);
    if (minKm === null || d < minKm) {
      minKm = d;
      nearestBranchName = b.district || b.name || '';
    }
  }

  if (minKm === null) return null;

  return {
    distanceKm: minKm,
    label: nearestBranchName ? `${minKm.toFixed(1)} km · ${nearestBranchName}` : `${minKm.toFixed(1)} km`,
  };
}
