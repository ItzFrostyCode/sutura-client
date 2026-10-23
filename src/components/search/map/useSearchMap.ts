'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { requestCurrentLocation, saveLocationWithHistory, type SavedLocation } from '@/lib/customerLocation';
import { useToast } from '@/context/ToastContext';
import { focusOn, type FocusPad } from '@/lib/mapFocus';
import type { DiscoveryMapBranch } from '@/components/discovery/DiscoveryMap';
import type { RelatedStore } from '../types';
import { storesToPins } from './storePins';

/** The map half of Search + Map: pins from the shops found, the selected pin, and the three map buttons. */
export function useSearchMap(stores: RelatedStore[]) {
  const mapRef = useRef<LeafletMap | null>(null);
  const toast = useToast();
  const [picked, setPicked] = useState<DiscoveryMapBranch | null>(null);
  const [locating, setLocating] = useState(false);
  const pins = useMemo(
    () => storesToPins(stores, picked?.storeSlug, picked?.branchId),
    [stores, picked?.storeSlug, picked?.branchId],
  );

  // A pin that the filters have since removed is no longer selected.
  const selected = (picked && pins.find((p) => p.storeSlug === picked.storeSlug && p.branchId === picked.branchId))
    || (picked && pins.find((p) => p.storeSlug === picked.storeSlug))
    || null;

  const selectPin = useCallback((branch: DiscoveryMapBranch | null) => {
    setPicked(branch);
    const map = mapRef.current;
    if (branch && map) map.setView([branch.latitude, branch.longitude], Math.max(map.getZoom(), 15), { animate: true });
  }, []);

  // From the results list: show this shop's pin. Pass branchId to open a specific branch (e.g. when restoring from URL). False when it has none.
  const selectStore = useCallback((slug: string, branchId?: number | null) => {
    const store = stores.find((s) => s.slug === slug);
    if (!store) return false;
    const validBranches = (store.branches ?? []).filter(
      (b) => b.latitude != null && b.longitude != null && !Number.isNaN(Number(b.latitude))
    );
    if (validBranches.length === 0) return false;
    // Prefer the requested branch, then main, then first.
    const primary =
      (branchId != null ? validBranches.find((b) => b.id === branchId) : null) ??
      validBranches.find((b) => Boolean((b as { is_main?: boolean }).is_main)) ??
      validBranches[0];

    const pin: DiscoveryMapBranch = {
      storeSlug: store.slug,
      storeName: store.name,
      storeLogoPath: store.logo_path,
      branchId: primary.id,
      branchName: primary.name,
      isMain: Boolean((primary as { is_main?: boolean }).is_main),
      address: primary.address ?? null,
      city: primary.city,
      district: primary.district,
      landmark: null,
      latitude: Number(primary.latitude),
      longitude: Number(primary.longitude),
      isOpen: false,
      badgeText: (primary as { is_main?: boolean }).is_main ? 'MAIN' : '1',
      isSelected: true,
    };
    selectPin(pin);
    return true;
  }, [stores, selectPin]);


  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  // Centres on the person's real position and keeps it as their location, so distances follow. Like Google Maps' my-location
  // button it zooms IN to street level and never out.
  const locate = useCallback((pad?: FocusPad, onLocated?: (loc: SavedLocation) => void) => {
    setLocating(true);
    requestCurrentLocation(
      (loc) => {
        saveLocationWithHistory(loc);
        if (mapRef.current) focusOn(mapRef.current, loc.lat, loc.lng, pad);
        setLocating(false);
        toast.success(`Location updated to ${loc.address || 'your current position'}.`);
        onLocated?.(loc);
      },
      () => {
        toast.error('Could not get your location. Check your browser’s location permission.');
        setLocating(false);
      },
    );
  }, [toast]);

  return { mapRef, pins, selected, selectPin, selectStore, zoomIn, zoomOut, locate, locating };
}
