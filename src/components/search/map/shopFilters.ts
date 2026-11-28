import { haversineKm } from '@/lib/customerLocation';
import { isStoreOpen, type OperatingHours } from '@/lib/storeStatus';
import type { NearFilters } from '@/components/home/homeFilters';

interface ShopLike {
  operating_hours?: OperatingHours | string | null;
  branches?: { latitude?: string | number | null; longitude?: string | number | null }[] | null;
}

/**
 * Open / Closed and Distance for results the server cannot filter itself (services).
 * A shop with no opening hours on record is never hidden by Open / Closed, since we cannot say either way.
 */
export function shopPassesFilters(
  shop: ShopLike | null | undefined,
  filters: NearFilters,
  coords: { lat: number; lng: number } | null,
): boolean {
  if (!shop) return true;
  if (filters.status !== 'all' && shop.operating_hours) {
    if ((filters.status === 'open') !== isStoreOpen(shop.operating_hours)) return false;
  }
  if (coords && filters.radiusKm !== null) {
    let nearest: number | null = null;
    for (const b of shop.branches ?? []) {
      if (b.latitude == null || b.longitude == null) continue;
      const d = haversineKm(coords.lat, coords.lng, Number(b.latitude), Number(b.longitude));
      if (nearest === null || d < nearest) nearest = d;
    }
    if (nearest !== null && nearest > filters.radiusKm) return false;
  }
  return true;
}
