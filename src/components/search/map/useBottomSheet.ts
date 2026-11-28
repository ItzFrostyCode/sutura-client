'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

/** Margin kept at the top of the screen when the sheet is full (16px, matching left-4 and right-4). */
const TOP_MARGIN_PX = 16;
/** Room taken by the floating bottom navigation. */
const NAV_RESERVED_PX = 76;
/** A press that moves less than this is a tap on the handle, not a drag. */
const TAP_SLOP_PX = 6;

export type SheetSnap = 'peek' | 'half' | 'full';

/**
 * The map's bottom sheet on a phone or tablet: three heights (peek, half, full) that the handle drags between.
 * A tap on the handle steps up (peek → half → full) and back down from full. The desktop card still uses
 * `expanded` / `toggle` (half ⇄ full) for its width.
 */
export function useBottomSheet(containerRef: RefObject<HTMLElement | null>, hasDetail = false) {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [live, setLive] = useState<number | null>(null); // height while a finger is dragging
  const [, setTick] = useState(0);
  const drag = useRef<{ startY: number; startH: number; moved: boolean } | null>(null);

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Opening a shop, or coming back to the list, starts at the half height.
  useEffect(() => { setSnap('half'); }, [hasDetail]);

  const total = (containerRef.current?.clientHeight ?? 640) - NAV_RESERVED_PX;
  const fullHeight = Math.max(280, total - TOP_MARGIN_PX);
  const halfHeight = Math.max(320, Math.min(hasDetail ? 540 : 460, Math.round(total * (hasDetail ? 0.65 : 0.58))));
  // Peek shows the handle and the first lines: the search bar for the list, the name and the two buttons for a shop.
  const peekHeight = hasDetail ? 176 : 148;
  const heights: Record<SheetSnap, number> = { peek: peekHeight, half: halfHeight, full: fullHeight };

  const height = live ?? heights[snap];
  const expanded = snap === 'full';
  const setExpanded = useCallback((on: boolean) => setSnap(on ? 'full' : 'half'), []);
  const toggle = useCallback(() => setSnap((s) => (s === 'full' ? 'half' : 'full')), []);
  const step = useCallback((dir: 1 | -1) => setSnap((s) => {
    const order: SheetSnap[] = ['peek', 'half', 'full'];
    return order[Math.min(2, Math.max(0, order.indexOf(s) + dir))];
  }), []);

  const nearest = (h: number): SheetSnap =>
    (Object.keys(heights) as SheetSnap[]).reduce((best, k) => (Math.abs(heights[k] - h) < Math.abs(heights[best] - h) ? k : best), 'half' as SheetSnap);

  /** Handlers for the handle: drag it, or tap it. */
  const handleProps = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { startY: e.clientY, startH: heights[snap], moved: false };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d) return;
      const dy = d.startY - e.clientY;
      if (Math.abs(dy) > TAP_SLOP_PX) d.moved = true;
      if (d.moved) setLive(Math.min(fullHeight, Math.max(peekHeight, d.startH + dy)));
    },
    onPointerUp: () => {
      const d = drag.current;
      drag.current = null;
      if (!d) return;
      if (d.moved && live !== null) setSnap(nearest(live));
      else step(snap === 'full' ? -1 : 1);
      setLive(null);
    },
    onPointerCancel: () => { drag.current = null; setLive(null); },
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); step(snap === 'full' && e.key !== 'ArrowUp' ? -1 : 1); }
      if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
    },
  };

  return {
    height,
    total,
    settledHeight: heights[snap],
    collapsedHeight: halfHeight,
    peekHeight,
    snap,
    setSnap,
    dragging: live !== null,
    expanded,
    setExpanded,
    toggle,
    handleProps,
  };
}
