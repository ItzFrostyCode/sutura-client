import api from '@/lib/axios';
import { haversineKm } from '@/lib/customerLocation';

/**
 * Province → City/Municipality → District → Barangay from the server's PSGC
 * copy (PSA). Lists are cached per page load; the server caches them too.
 */
export interface PsgcItem {
  readonly code: string;
  readonly name: string;
}

/** A shop/branch area picked from PSGC. Codes go to the server; names are for display. */
export interface PsgcAddress {
  province_code: string;
  province_name: string;
  city_code: string;
  city_name: string;
  district_code: string;
  district_name: string;
  barangay_code: string;
  barangay_name: string;
}

export const EMPTY_PSGC_ADDRESS: PsgcAddress = {
  province_code: '', province_name: '', city_code: '', city_name: '',
  district_code: '', district_name: '', barangay_code: '', barangay_name: '',
};

const cache = new Map<string, Promise<{ items: PsgcItem[]; districtRequired?: boolean }>>();

function load(path: string, params: Record<string, string>) {
  const key = `${path}?${new URLSearchParams(params)}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = api.get(`/public/locations/${path}`, { params }).then((res) => ({
      items: res.data.data as PsgcItem[],
      districtRequired: res.data.district_required as boolean | undefined,
    }));
    // A failed load can be retried.
    hit.catch(() => cache.delete(key));
    cache.set(key, hit);
  }
  return hit;
}

export const fetchProvinces = () => load('provinces', {}).then((r) => r.items);
export const fetchCities = (province: string) => load('cities', { province }).then((r) => r.items);
export const fetchDistricts = (city: string) => load('districts', { city });
export const fetchBarangays = (city: string, district?: string) =>
  load('barangays', district ? { city, district } : { city }).then((r) => r.items);

/** "Street, Barangay, City/Municipality, District (if any), Province" (same order as the server). */
export function displayAddress(street: string, a: PsgcAddress): string {
  const parts: string[] = [];
  for (const raw of [street, a.barangay_name, a.city_name, a.district_name, a.province_name]) {
    const part = (raw ?? '').trim();
    if (part && !parts.some((p) => p.toLowerCase() === part.toLowerCase())) parts.push(part);
  }
  return parts.join(', ');
}

/** "City of Davao" / "Davao City" → "davao", for loose name matching. */
function cityKey(name: string): string {
  return name.toLowerCase().replace(/^city of\s+/, '').replace(/\s+city$/, '').trim();
}

const geoCache = new Map<string, Promise<{ lat: number; lng: number } | null>>();

/** Rough centre of an area (OpenStreetMap search). Null when it can't be found. */
export function geocodeArea(parts: string[]): Promise<{ lat: number; lng: number } | null> {
  const q = [...parts.filter(Boolean), 'Philippines'].join(', ');
  let hit = geoCache.get(q);
  if (!hit) {
    hit = fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ph&q=${encodeURIComponent(q)}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: { lat: string; lon: string }[]) => (rows[0] ? { lat: Number(rows[0].lat), lng: Number(rows[0].lon) } : null))
      .catch(() => null);
    geoCache.set(q, hit);
  }
  return hit;
}

/** Centre for "Open map": the barangay if it can be found, else the city, else the province. */
export async function areaCenter(a: PsgcAddress): Promise<{ lat: number; lng: number } | null> {
  if (a.barangay_name) {
    const b = await geocodeArea([a.barangay_name, a.city_name, a.province_name]);
    if (b) return b;
  }
  if (a.city_name) {
    const c = await geocodeArea([a.city_name, a.province_name]);
    if (c) return c;
  }
  return a.province_name ? geocodeArea([a.province_name]) : null;
}

/**
 * Warning (never a block) when the pin is clearly outside the chosen city:
 * its looked-up address doesn't name the city AND it's far from the city's
 * centre. Null when it looks fine or can't be judged.
 */
export async function pinOutsideCityWarning(
  pin: { lat: number; lng: number; address: string },
  a: PsgcAddress,
): Promise<string | null> {
  if (!a.city_name) return null;
  if (pin.address.toLowerCase().includes(cityKey(a.city_name))) return null;
  const centre = await geocodeArea([a.city_name, a.province_name]);
  if (!centre) return null;
  const km = haversineKm(pin.lat, pin.lng, centre.lat, centre.lng);
  return km > 25
    ? `Your map pin looks like it's outside ${a.city_name} (about ${Math.round(km)} km from it). Check the pin or the city you picked.`
    : null;
}
