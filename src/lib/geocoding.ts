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

        // Sub-area (clean without 'District' suffix)
        if (feature.district) {
          const clean = feature.district.replace(/\s+district$/i, '').trim();
          if (clean && !parts.includes(clean)) parts.push(clean);
        }

        // City
        if (feature.city && !parts.includes(feature.city)) parts.push(feature.city);

        const district = (feature.district ? feature.district.replace(/\s+district$/i, '').trim() : '') || feature.locality || feature.city || 'Davao City';
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

async function singleQueryPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // Strategy 1: Photon search biased to Davao City (7.0707, 125.6083)
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=7.0707&lon=125.6083&limit=6`,
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
            if (p.district) {
              const clean = p.district.replace(/\s+district$/i, '').trim();
              if (clean && !parts.includes(clean)) parts.push(clean);
            }
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
      )}&viewbox=125.30,7.40,125.80,6.85&bounded=1&limit=6&countrycodes=ph`
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

function normalizeStreetAbbrev(text: string): string {
  return text
    .replace(/\bste\.?\b/gi, 'Street')
    .replace(/\bst\.?\b/gi, 'Street')
    .replace(/\bave\.?\b/gi, 'Avenue')
    .replace(/\bblvd\.?\b/gi, 'Boulevard')
    .replace(/\brd\.?\b/gi, 'Road')
    .replace(/\bext\.?\b/gi, 'Extension')
    .replace(/\bbrgy\.?\b/gi, 'Barangay')
    .replace(/\bbgy\.?\b/gi, 'Barangay')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches places around Davao City.
 * Biased towards Davao City coordinates to return relevant streets and landmarks.
 * Automatically handles multi-segment queries like "Washington ste. Front of almendras gym, Davao City".
 */
export async function searchPlacesAroundDavao(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  // First try direct search
  const directResults = await singleQueryPlaces(trimmed);
  if (directResults.length > 0) {
    return directResults;
  }

  // Also try normalized street abbreviations directly
  const normalizedDirect = normalizeStreetAbbrev(trimmed);
  if (normalizedDirect !== trimmed) {
    const hits = await singleQueryPlaces(normalizedDirect);
    if (hits.length > 0) return hits;
  }

  // Check if query contains connective segments (e.g. "Front of", "near", "beside", "corner")
  const connectorPattern =
    /\b(?:in\s*front\s*of|infront\s*of|front\s*of|fronting|ahead\s*of|near(?:\s*by|\s*to)?|beside|next\s*to|across(?:\s*from)?|opposite(?:\s*to)?|opp\.?|corner|cor\.?|along|at\s*the\s*back\s*of|back\s*of|behind|adjacent\s*to|around|outside|inside|close\s*to|between)\b/gi;

  let rawSegments: string[] = [];
  if (connectorPattern.test(trimmed)) {
    rawSegments = trimmed.split(connectorPattern);
  } else if (/[,;]+/.test(trimmed)) {
    rawSegments = trimmed.split(/[,;]+/);
  }

  if (rawSegments.length > 0) {
    const cleanSegments = rawSegments
      .map((s) =>
        s
          .trim()
          .replace(/^[,\s.-]+|[,\s.-]+$/g, '')
          .replace(/,\s*davao(?:\s*(?:city|del\s*sur))?.*$/i, '')
          .trim()
      )
      .filter((s) => s.length >= 2 && !/^(?:davao|davao city|philippines)$/i.test(s));

    const combined: PlaceSearchResult[] = [];
    const seen = new Set<string>();

    for (const rawSeg of cleanSegments) {
      const candidates = [rawSeg, normalizeStreetAbbrev(rawSeg)];
      for (const cand of candidates) {
        const hits = await singleQueryPlaces(cand);
        for (const hit of hits) {
          const key = `${hit.lat.toFixed(4)},${hit.lng.toFixed(4)}`;
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(hit);
          }
        }
        if (combined.length >= 8) break;
      }
    }

    if (combined.length > 0) {
      return combined.slice(0, 8);
    }
  }

  return [];
}
