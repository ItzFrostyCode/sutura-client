// Tries to pull real coordinates directly out of a pasted Google Maps link
// (or raw "lat, lng" text) before the location picker falls back to
// forward-geocoding the text as a place name via Nominatim. Deliberately
// only pattern-matches — there's no Maps API key in this app, so this is
// regex against known URL shapes, not a real link resolver.
//
// A SHORTENED link (maps.app.goo.gl/..., goo.gl/maps/...) can't be handled
// this way — resolving it requires following an HTTP redirect, which a
// browser can't do cross-origin from client-side JS. Callers should ask the
// customer to paste the full (expanded) link or a plain address instead.
export function parseCoordsFromMapsLink(input: string): { lat: number; lng: number } | null {
  const text = input.trim();
  if (!text) return null;

  // Raw "lat, lng" typed or pasted directly (also matches Google's own
  // "7.0731, 125.6128" copy-coordinates format).
  const rawMatch = text.match(/^(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (rawMatch) {
    return { lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };
  }

  // Google Maps' "@lat,lng,zoom" pattern — present in most share links and
  // any "/place/.../@lat,lng,17z/..." URL.
  const atMatch = text.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  // "?q=lat,lng" / "&q=lat,lng" — the classic maps.google.com/?q= form.
  const qMatch = text.match(/[?&]q=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }

  // "ll=lat,lng" — an older/alternate Google Maps query param.
  const llMatch = text.match(/[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/);
  if (llMatch) {
    return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
  }

  return null;
}

// Nominatim (the geocoder this app uses — see LocationPicker.tsx) has no
// idea what a Google Plus Code ("3JVP+W3V") is and returns zero results for
// the whole query if one's present, even though the rest of the address is
// perfectly valid on its own (verified: "3JVP+W3V, Jasmin St, Ubalde,
// Agdao, Davao City" → no match; the exact same string with the Plus Code
// removed → matches instantly). Strip it out before searching rather than
// failing the whole thing over a code Nominatim can't parse.
export function stripPlusCode(text: string): string {
  return text.replace(/\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}\b,?\s*/gi, '').trim();
}

// Google Maps addresses inside Davao City routinely append ", Davao del
// Sur" (colloquial, left over from before the city split off) — but Davao
// City is an independent city, not actually nested under that province in
// OSM's administrative data, and Nominatim's structured search returns
// zero results for the WHOLE query once both appear together (verified:
// "...Agdao, Davao City" alone matches instantly; the identical string with
// a trailing ", Davao del Sur" added returns nothing at all).
export function stripRedundantDavaoProvince(text: string): string {
  return text.replace(/,?\s*Davao del Sur\b/gi, '').trim();
}

// Philippine addresses routinely describe an intersection as "<Street A>
// Corner <Street B>" — Nominatim's structured search has no idea what to do
// with "Corner" as a keyword and returns zero results for the whole query
// once it's present (verified: "R. Magsaysay Avenue, Davao City" alone
// matches instantly; "R. Magsaysay Avenue Corner Jacinto Extension, Davao
// City" — the exact same start — returns nothing). Drop the "Corner ..."
// clause and keep just the first-named street, which is enough to geocode
// to the right area.
export function stripCornerClause(text: string): string {
  return text.replace(/\s+corner\s+[^,]+/gi, '').trim();
}

// Runs every pasted-text cleanup step before handing the result to
// Nominatim — order matters (Plus Code first, since it can sit anywhere in
// the string; the trailing province name and "Corner" clause come after).
export function cleanLocationQuery(text: string): string {
  const withoutPlusCode = stripPlusCode(text) || text;
  const withoutProvince = stripRedundantDavaoProvince(withoutPlusCode) || withoutPlusCode;
  return stripCornerClause(withoutProvince) || withoutProvince;
}
