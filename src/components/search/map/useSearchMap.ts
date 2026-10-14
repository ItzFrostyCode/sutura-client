'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { requestCurrentLocation } from '@/lib/customerLocation';
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
  const pins = useMemo(() => storesToPins(stores), [stores]);

  // A pin that the filters have since removed is no longer selected.
  const selected = picked && pins.find((p) => p.storeSlug === picked.storeSlug && p.branchId === picked.branchId) || null;

  const selectPin = useCallback((branch: DiscoveryMapBranch | null) => {
    setPicked(branch);
    const map = mapRef.current;
    if (branch && map) map.setView([branch.latitude, branch.longitude], Math.max(map.getZoom(), 15), { animate: true });
  }, []);

  // From the results list: show this shop's pin. False when it has none.
  const selectStore = useCallback((slug: string) => {
    const pin = pins.find((p) => p.storeSlug === slug);
    if (pin) selectPin(pin);
    return Boolean(pin);
  }, [pins, selectPin]);

  const zoomIn = useCallback(() => mapRef.current?.zoomIn(), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut(), []);

  // Centres on the person's real position and keeps it as their location, so distances follow. Like Google Maps' my-location
  // button it zooms IN to street level and never out.
  const locate = useCallback((pad?: FocusPad) => {
    setLocating(true);
    requestCurrentLocation(
      (loc) => {
        if (mapRef.current) focusOn(mapRef.current, loc.lat, loc.lng, pad);
        setLocating(false);
      },
      () => {
        toast.error('Could not get your location. Check your browser’s location permission.');
        setLocating(false);
      },
    );
  }, [toast]);

  return { mapRef, pins, selected, selectPin, selectStore, zoomIn, zoomOut, locate, locating };
}
