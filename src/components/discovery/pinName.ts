import type { DiscoveryMapBranch } from './DiscoveryMap';

/**
 * The label a shop pin / card shows: the store name for its main branch,
 * the branch name otherwise. Kept out of DiscoveryMap.tsx so list UI can use
 * it without importing react-leaflet, which touches `window` on import and
 * breaks server prerendering (the /map page build failed on exactly that).
 */
export function pinName(b: Pick<DiscoveryMapBranch, 'isMain' | 'storeName' | 'branchName'>): string {
  return b.isMain ? b.storeName : (b.branchName || b.storeName);
}
