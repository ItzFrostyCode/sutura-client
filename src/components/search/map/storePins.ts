import { isStoreOpen } from '@/lib/storeStatus';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';

/** One map pin per live branch that has coordinates. The server already returns only live branches. */
export function storesToPins(stores: RelatedStore[]): DiscoveryMapBranch[] {
  return stores.flatMap((store) => {
    const open = isStoreOpen(store.operating_hours);
    return (store.branches ?? [])
      .filter((b) => b.latitude != null && b.longitude != null && !Number.isNaN(Number(b.latitude)) && !Number.isNaN(Number(b.longitude)))
      .map((b) => ({
        storeSlug: store.slug,
        storeName: store.name,
        storeLogoPath: store.logo_path,
        branchId: b.id,
        branchName: b.name,
        isMain: Boolean((b as { is_main?: boolean }).is_main),
        address: b.address ?? null,
        city: b.city,
        district: b.district,
        landmark: null,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
        isOpen: open,
      }));
  });
}
