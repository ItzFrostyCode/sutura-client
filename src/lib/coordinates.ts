/**
 * Reading a map pin someone copied: Google Maps puts "7.07020, 125.60770" on the clipboard when you long-press a
 * spot (or tap your blue dot); some apps copy degrees-minutes-seconds like 7°04'12.7"N 125°36'27.7"E. Returns null for
 * anything else (e.g. a Maps share link — the branch form sends those to the server to read).
 */
export interface LatLng {
  lat: number;
  lng: number;
}

const valid = (lat: number, lng: number): LatLng | null =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;

export function parseCoordinates(text: string): LatLng | null {
  const t = text.replace(/[()]/g, ' ').trim();
  // Degrees, minutes, seconds with N/S/E/W.
  const dms = t.match(/(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)?["″]?\s*([NS])[\s,]+(\d{1,3})°\s*(\d{1,2})['′]\s*([\d.]+)?["″]?\s*([EW])/i);
  if (dms) {
    const deg = (d: string, m: string, s: string | undefined, h: string) =>
      (Number(d) + Number(m) / 60 + Number(s ?? 0) / 3600) * (/[SW]/i.test(h) ? -1 : 1);
    return valid(deg(dms[1], dms[2], dms[3], dms[4]), deg(dms[5], dms[6], dms[7], dms[8]));
  }
  // Decimal degrees: "7.0702, 125.6077", "7.0702 125.6077", "7.0702° N, 125.6077° E".
  const dec = t.match(/^(-?\d{1,2}(?:\.\d+)?)\s*°?\s*([NS])?\s*[,\s]\s*(-?\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])?$/i);
  if (dec) {
    const lat = Number(dec[1]) * (dec[2] && /S/i.test(dec[2]) ? -1 : 1);
    const lng = Number(dec[3]) * (dec[4] && /W/i.test(dec[4]) ? -1 : 1);
    return valid(lat, lng);
  }
  return null;
}

/** Roughly Davao City's land area (Marilog in the north to Toril / Binugao in the south). */
export function inDavaoCity({ lat, lng }: LatLng): boolean {
  return lat >= 6.9 && lat <= 7.7 && lng >= 125.2 && lng <= 125.7;
}

export const googleMapsHref = ({ lat, lng }: LatLng) => `https://www.google.com/maps?q=${lat},${lng}`;
