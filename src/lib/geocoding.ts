export interface GeocodeResult {
  address: string;
  district: string;
  street?: string;
}

export interface PlaceSearchResult {
  lat: number;
  lng: number;
  display_name: string;
}

// A free service that hangs must not hold the address on "Locating…" forever.
const LOOKUP_TIMEOUT_MS = 5000;

// Photon (OSM / Komoot): short, street-level names ("Abreeza Residences,
// Poblacion, Davao City"). Null when it has nothing usable.
async function photonReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data?.features?.[0]?.properties;
    if (!feature) return null;
    const parts: string[] = [];
    const primary = feature.name || feature.street; // road or place name
    if (primary) parts.push(primary);
    if (feature.locality && !parts.includes(feature.locality)) parts.push(feature.locality); // barangay / suburb
    if (feature.district && !parts.includes(feature.district)) parts.push(feature.district); // Poblacion, Buhangin…
    if (feature.city && !parts.includes(feature.city)) parts.push(feature.city);
    if (parts.length === 0) return null;
    return {
      address: parts.join(', '),
      district: feature.district || feature.locality || feature.city || 'Davao City',
      street: feature.street || feature.name,
    };
  } catch {
    return null;
  }
}

// Nominatim (OSM): usually faster here, but a longer display name.
async function nominatimReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.display_name) return null;
    return {
      address: data.display_name,
      district:
        data?.address?.suburb ||
        data?.address?.neighbourhood ||
        data?.address?.city_district ||
        data?.address?.city ||
        'Davao City',
      street: data?.address?.road,
    };
  } catch {
    return null;
  }
}

// BigDataCloud's keyless client endpoint: no street, but the district and
// city ("Poblacion, Davao City"). Used only when Photon and Nominatim both
// fail — Nominatim rate-limits busy connections (429) and Photon has outages.
async function bigDataCloudReverse(lat: number, lng: number): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const admin: { name?: string; adminLevel?: number }[] = data?.localityInfo?.administrative ?? [];
    // Deepest named area below the city (adminLevel 8+: district / barangay).
    const area = [...admin].reverse().find((a) => (a.adminLevel ?? 0) >= 8 && a.name)?.name;
    const city = data?.city === 'Davao' ? 'Davao City' : data?.city || data?.locality;
    const parts = [area, city].filter((p): p is string => !!p);
    if (parts.length === 0) return null;
    return { address: parts.join(', '), district: area || city || 'Davao City' };
  } catch {
    return null;
  }
}

const PREFER_PHOTON_MS = 1500;

// The picker asks for the same spot twice (once when it jumps there, once when
// the map stops moving): share one lookup per ~1 m spot, and remember answers,
// so the free services see half the traffic and rate-limit us less.
const reverseCache = new Map<string, Promise<GeocodeResult | null>>();

/**
 * Coordinates → a human-readable address with the street name. Asks Photon
 * and Nominatim at the same time: Photon's shorter label wins if it answers
 * within 1.5 s, otherwise whichever answers first. If both fail, BigDataCloud
 * gives the district and city. Coordinates as the label only when all three
 * fail (offline).
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<GeocodeResult> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  let lookup = reverseCache.get(key);
  if (!lookup) {
    lookup = lookupAddress(lat, lng);
    reverseCache.set(key, lookup);
    // Don't remember a failure: the next try may get through.
    void lookup.then((r) => { if (!r) reverseCache.delete(key); });
  }
  const result = await lookup;
  return result ?? { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, district: 'Davao City' };
}

async function lookupAddress(lat: number, lng: number): Promise<GeocodeResult | null> {
  const photon = photonReverse(lat, lng);
  const nominatim = nominatimReverse(lat, lng);

  const quickPhoton = await Promise.race([
    photon,
    new Promise<null>((r) => setTimeout(() => r(null), PREFER_PHOTON_MS)),
  ]);
  const result =
    quickPhoton ??
    // First non-null of the two; null only when both came back empty.
    (await new Promise<GeocodeResult | null>((resolve) => {
      let pending = 2;
      const take = (r: GeocodeResult | null) => {
        if (r) resolve(r);
        else if (--pending === 0) resolve(null);
      };
      void photon.then(take);
      void nominatim.then(take);
    }));

  return result ?? bigDataCloudReverse(lat, lng);
}

export async function searchPlacesAroundDavao(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Strategy 1: Photon search biased to Davao City (7.0707, 125.6083)
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=7.0707&lon=125.6083&limit=8`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) }
    );
    if (res.ok) {
      const data = await res.json();
      const features = data?.features;
      if (Array.isArray(features) && features.length > 0) {
        const results: PlaceSearchResult[] = features
          .map((f: any) => {
            const p = f.properties;
            const parts: string[] = [];
            const primary = p.name || p.street;
            if (primary) parts.push(primary);
            if (p.locality && !parts.includes(p.locality)) parts.push(p.locality);
            if (p.district && !parts.includes(p.district)) parts.push(p.district);
            if (p.city && !parts.includes(p.city)) parts.push(p.city);

            const display_name = parts.join(', ');
            const [lng, lat] = f.geometry?.coordinates ?? [];
            return {
              lat,
              lng,
              display_name: display_name || primary,
            };
          })
          .filter((r) => r.lat != null && r.lng != null && !!r.display_name);

        if (results.length > 0) return results;
      }
    }
  } catch {
    // Fallback
  }

  // Strategy 2: Nominatim search
  try {
    const isDavaoQuery = trimmed.toLowerCase().includes('davao');
    const queryText = isDavaoQuery ? trimmed : `${trimmed}, Davao City`;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
        queryText
      )}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=8&countrycodes=ph`,
      { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS) }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((d: any) => ({
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
          display_name: d.display_name,
        }));
      }
    }
  } catch {
    // Fallback
  }

  return [];
}
