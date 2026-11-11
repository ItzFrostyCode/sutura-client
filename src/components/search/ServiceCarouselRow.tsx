'use client';

import React from 'react';
import DragScrollRow from '@/components/shared/DragScrollRow';

/**
 * A row of service cards that slides — no arrow buttons: swipe on touch, click and drag with a mouse (a plain click
 * still opens a card), arrow keys when focused. Same row as the shop page's designs (DragScrollRow).
 */
export default function ServiceCarouselRow({ children, label = 'Services' }: { readonly children: React.ReactNode; readonly label?: string }) {
  return (
    <DragScrollRow className="py-2" label={label}>
      {children}
    </DragScrollRow>
  );
}
