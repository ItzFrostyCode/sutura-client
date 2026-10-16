'use client';

import { Suspense, useEffect } from 'react';
import ChooseLocationScreen from '@/components/map/ChooseLocationScreen';
import type { SavedLocation } from '@/lib/customerLocation';

export interface LocationPickerProps {
  readonly initial: SavedLocation | null;
  readonly onClose: () => void;
  readonly onConfirm: (loc: SavedLocation) => void;
  readonly confirmLabel?: string;
  readonly title?: string;
}

/**
 * Full-screen map location picker matching /map?select=1:
 * Floating search bar, live debounced suggestions, popular Davao landmarks,
 * locate/zoom controls, and chosen place confirm card.
 */
export default function LocationPicker({
  initial,
  onClose,
  onConfirm,
  confirmLabel,
}: Readonly<LocationPickerProps>) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] h-dvh w-screen overflow-hidden bg-canvas">
      <Suspense fallback={<div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">Loading map…</div>}>
        <ChooseLocationScreen
          initial={initial}
          onClose={onClose}
          onConfirm={onConfirm}
          confirmLabel={confirmLabel}
        />
      </Suspense>
    </div>
  );
}
