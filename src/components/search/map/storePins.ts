import { isStoreOpen } from '@/lib/storeStatus';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';

/**
 * Map pins from search results.
 * - When no store is selected: each store has ONE primary pin, and NO "MAIN" badge is shown.
 * - When a store IS selected (or its pin clicked): that store displays its Main branch (badge: "MAIN")
 *   plus its companion branches (badges: "2", "3", "4", etc.) so customers can see and choose between them.
 */
export function storesToPins(
  stores: RelatedStore[],
  selectedStoreSlug?: string | null,
  selectedBranchId?: number | null,
): DiscoveryMapBranch[] {
  return stores.flatMap((store): DiscoveryMapBranch[] => {
    const open = isStoreOpen(store.operating_hours);
    const validBranches = (store.branches ?? []).filter(
      (b) =>
        b.latitude != null &&
        b.longitude != null &&
        !Number.isNaN(Number(b.latitude)) &&
        !Number.isNaN(Number(b.longitude))
    );

    if (validBranches.length === 0) return [];

    const isStoreSelected = selectedStoreSlug === store.slug;

    // Normal map overview: 1 clean pin per store, NO "MAIN" badge
    if (!isStoreSelected) {
      const primaryBranch =
        validBranches.find((b) => Boolean(b.is_main)) ??
        validBranches[0];

      return [
        {
          storeSlug: store.slug,
          storeName: store.name,
          storeLogoPath: store.logo_path,
          branchId: primaryBranch.id,
          branchName: primaryBranch.name,
          isMain: Boolean(primaryBranch.is_main),
          address: primaryBranch.address ?? null,
          city: primaryBranch.city,
          district: primaryBranch.district,
          landmark: null,
          latitude: Number(primaryBranch.latitude),
          longitude: Number(primaryBranch.longitude),
          isOpen: open,
          badgeText: null, // No badge on general map
          isSelected: false,
        },
      ];
    }

    // Store is selected: show Main branch and all its companion branches (Main, 2, 3, 4...)
    const mainBranch =
      validBranches.find((b) => Boolean(b.is_main)) ??
      validBranches[0];
    const otherBranches = validBranches.filter((b) => b.id !== mainBranch.id);
    const orderedBranches = [mainBranch, ...otherBranches];

    return orderedBranches.map((b, idx) => {
      const isMain = b.id === mainBranch.id;
      // Main gets "MAIN", fellow branches get "2", "3", "4", etc.
      const badgeText = isMain ? 'MAIN' : `${idx + 1}`;
      const isSelected = selectedBranchId ? b.id === selectedBranchId : isMain;

      return {
        storeSlug: store.slug,
        storeName: store.name,
        storeLogoPath: store.logo_path,
        branchId: b.id,
        branchName: b.name,
        isMain,
        address: b.address ?? null,
        city: b.city,
        district: b.district,
        landmark: null,
        latitude: Number(b.latitude),
        longitude: Number(b.longitude),
        isOpen: open,
        badgeText,
        isSelected,
      };
    });
  });
}
