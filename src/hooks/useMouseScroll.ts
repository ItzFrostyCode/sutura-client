'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Makes a sideways-scrolling row usable with a mouse, not only with a finger or a trackpad: the vertical wheel scrolls
 * it sideways (only while it can actually scroll), and it can be dragged. A drag that moved the row is not treated as a
 * click on whatever was under the pointer when it ended. Touch and trackpads keep their native behaviour.
 */
export function useMouseScroll<T extends HTMLElement>(ref: RefObject<T | null>) {
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return; // let the page scroll on once the row has nothing more in that direction
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button === 0) drag.current = { x: e.clientX, left: el.scrollLeft, moved: false };
    };
    const onMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 4) d.moved = true;
      if (d.moved) el.scrollLeft = d.left - dx;
    };
    const onUp = () => { setTimeout(() => { drag.current = null; }, 0); };
    const onClick = (e: MouseEvent) => {
      if (drag.current?.moved) { e.preventDefault(); e.stopPropagation(); }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
    };
  }, [ref]);
}
