'use client';

import { useEffect, useState } from 'react';

/** Hover previews are for a mouse on a wide screen only; on a tablet or phone (touch, or under 1024px) they stay off. */
export function useHoverPreview(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const sync = () => setOn(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);
  return on;
}
