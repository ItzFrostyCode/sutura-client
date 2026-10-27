// Tries to pull real coordinates directly out of a pasted Google Maps link
// (or raw "lat, lng" text) before the location picker falls back to
// forward-geocoding the text as a place name via Nominatim. Deliberately
// only pattern-matches — there's no Maps API key in this app, so this is
// regex against known URL shapes, not a real link resolver.
//
// A SHORTENED link (maps.app.goo.gl/..., goo.gl/maps/...) can't be handled
// this way — resolving it requires following an HTTP redirect, which a
// browser can't do cross-origin. isGoogleMapsLink() spots those (and full
// links with no coordinates) so the caller can ask the server to resolve it
// (POST /public/resolve-map-url).
export function parseCoordsFromMapsLink(input: string): { lat: number; lng: number } | null {
  const text = input.trim();
  if (!text) return null;
  const valid = (lat: number, lng: number) => (Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null);

  // Raw "lat, lng" or "lat lng" typed or pasted directly (also matches
  // Google's own "7.0731, 125.6128" copy-coordinates format).
  // Decimals required, so a street number pair like "50 12" isn't read as coordinates.
  const rawMatch = text.match(/^(-?\d{1,3}\.\d+)\s*[,\s]\s*(-?\d{1,3}\.\d+)$/);
  if (rawMatch) return valid(parseFloat(rawMatch[1]), parseFloat(rawMatch[2]));

  // Most precise first: the "!3dlat!4dlng" pin data on a specific-place link,
  // then "@lat,lng,zoom" (the map view), then "?q=lat,lng" / "ll=lat,lng".
  for (const pattern of [
    /!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
    /[?&]q=(-?\d{1,3}\.\d+)(?:,|%2C)\s*(-?\d{1,3}\.\d+)/i,
    /[?&]ll=(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/,
  ]) {
    const m = text.match(pattern);
    if (m) return valid(parseFloat(m[1]), parseFloat(m[2]));
  }

  return null;
}

/** A Google Maps link of any shape: maps.app.goo.gl, goo.gl/maps, google.com/maps, maps.google.com. */
export function isGoogleMapsLink(input: string): boolean {
  return /^(https?:\/\/)?(maps\.app\.goo\.gl\/|goo\.gl\/maps\/|(www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]+\/)/i.test(input.trim());
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
