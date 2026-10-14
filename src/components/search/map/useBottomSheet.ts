'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react';

export type SheetSnap = 'peek' | 'half' | 'full';

// Heights are built from what the list needs, so the lowest sheet always shows one whole shop and the top of the next, and the
// middle one two whole shops and the top of a third: a person who does not know the list scrolls can see there is more.
/** Handle, location, search bar and the "Nearby Stores" heading — everything above the first shop. */
const LIST_HEADER_PX = 200;
/** One shop row in the list (logo, label, name, owner, place — no specialization tags). */
const ROW_PX = 102;
/** How much of the next shop is left showing under the last whole one. */
const SLIVER_PX = 44;
const shopsHeight = (rows: number) => LIST_HEADER_PX + rows * ROW_PX + SLIVER_PX;
/** Map showing above the sheet that the row of map buttons needs: 48px of buttons, 12px above the sheet, 8px below the top. */
const CONTROLS_ROW_PX = 68;
/** Space kept above the full sheet. */
const TOP_GAP_PX = 16;
/** Room taken by the floating bottom navigation, which the sheet sits above. */
const NAV_RESERVED_PX = 76;

/**
 * Phone results sheet: tap its handle to open or close, or drag it to peek, half or full height.
 * `reserveTop` is the room a card floating at the top of the map needs (0 when there is none); peek and half never grow
 * so tall that this card and the map buttons would no longer fit above the sheet. Full height covers the map on purpose.
 */
export function useBottomSheet(containerRef: RefObject<HTMLElement | null>, reserveTop = 0) {
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const start = useRef({ y: 0, h: 0, moved: false });

  useEffect(() => {
    const onResize = () => setTick((t) => t + 1);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const total = (containerRef.current?.clientHeight ?? 640) - NAV_RESERVED_PX;
  const heightFor = useCallback((s: SheetSnap) => {
    const full = total - TOP_GAP_PX;
    if (s === 'full') return full;
    // On a small screen the sheet may not leave less than a third of the map, so the shop count gives way before the map does.
    const limit = total - reserveTop - CONTROLS_ROW_PX;
    const peek = Math.min(shopsHeight(1), Math.round(total * 0.62), limit);
    if (s === 'peek') return peek;
    return Math.max(peek, Math.min(shopsHeight(2), Math.round(total * 0.8), limit));
  }, [total, reserveTop]);
  const height = dragHeight ?? heightFor(snap);

  const handleProps = {
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { y: e.clientY, h: height, moved: false };
    },
    onPointerMove: (e: PointerEvent<HTMLButtonElement>) => {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      const dy = start.current.y - e.clientY;
      if (Math.abs(dy) > 4) start.current.moved = true;
      setDragHeight(Math.min(total - TOP_GAP_PX, Math.max(heightFor('peek'), start.current.h + dy)));
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (!start.current.moved) {
        setSnap((s) => (s === 'peek' ? 'half' : 'peek'));
      } else {
        const options: SheetSnap[] = ['peek', 'half', 'full'];
        setSnap(options.reduce((best, s) => (Math.abs(heightFor(s) - height) < Math.abs(heightFor(best) - height) ? s : best)));
      }
      setDragHeight(null);
    },
  };

  return { height, total, settledHeight: heightFor(snap), snap, setSnap, dragging: dragHeight !== null, handleProps };
}
