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

/**
 * Reverse geocodes coordinates to a human-readable address with road/street name.
 * Uses Photon (OpenStreetMap/Komoot) as primary for fast, rate-limit-free resolution,
 * with Nominatim as secondary fallback.
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<GeocodeResult> {
  // Strategy 1: Photon (OSM / Komoot) — reliably returns street/road names without 429 rate-limiting
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      const feature = data?.features?.[0]?.properties;
      if (feature) {
        const parts: string[] = [];

        // Primary road or place name
        const primary = feature.name || feature.street;
        if (primary) parts.push(primary);

        // Locality / Barangay / Suburb
        if (feature.locality && !parts.includes(feature.locality)) parts.push(feature.locality);

        // District (e.g. Poblacion, Buhangin, Talomo)
        if (feature.district && !parts.includes(feature.district)) parts.push(feature.district);

        // City
        if (feature.city && !parts.includes(feature.city)) parts.push(feature.city);

        const district = feature.district || feature.locality || feature.city || 'Davao City';
        const address = parts.length > 0 ? parts.join(', ') : '';

        if (address) {
          return {
            address,
            district,
            street: feature.street || feature.name,
          };
        }
      }
    }
  } catch {
    // Continue to fallback
  }

  // Strategy 2: Nominatim (OpenStreetMap) fallback
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        const d =
          data?.address?.suburb ||
          data?.address?.neighbourhood ||
          data?.address?.city_district ||
          data?.address?.city ||
          'Davao City';
        return {
          address: data.display_name,
          district: d,
          street: data?.address?.road,
        };
      }
    }
  } catch {
    // Continue to final fallback
  }

  // Strategy 3: Coordinates fallback when offline or unavailable
  return {
    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    district: 'Davao City',
  };
}

/**
 * Searches places around Davao City.
 * Biased towards Davao City coordinates to return relevant streets and landmarks.
 */
export async function searchPlacesAroundDavao(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Strategy 1: Photon search biased to Davao City (7.0707, 125.6083)
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=7.0707&lon=125.6083&limit=8`,
      { headers: { Accept: 'application/json' } }
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
      )}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=8&countrycodes=ph`
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
