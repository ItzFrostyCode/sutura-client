'use client';

import { useEffect, useState, type RefObject } from 'react';

/** Margin kept at the top of the screen when expanded to full (16px, matching left-4 and right-4). */
const TOP_MARGIN_PX = 16;
/** Room taken by the floating bottom navigation. */
const NAV_RESERVED_PX = 76;

/**
 * Mobile and tablet sheet height controller: exactly 2 states — collapsed (default) and expanded (full).
 * No partial snaps, no drag handle line. Two clicks: expand, un-expand.
 */
export function useBottomSheet(containerRef: RefObject<HTMLElement | null>, hasDetail = false) {
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const total = (containerRef.current?.clientHeight ?? 640) - NAV_RESERVED_PX;
  const fullHeight = Math.max(280, total - TOP_MARGIN_PX);
  // Collapsed height: comfortable view for search list or shop storefront
  const collapsedHeight = Math.max(
    320,
    Math.min(hasDetail ? 540 : 460, Math.round(total * (hasDetail ? 0.65 : 0.58)))
  );

  const height = expanded ? fullHeight : collapsedHeight;
  const toggle = () => setExpanded((prev) => !prev);

  return {
    height,
    total,
    settledHeight: height,
    expanded,
    setExpanded,
    toggle,
  };
}
