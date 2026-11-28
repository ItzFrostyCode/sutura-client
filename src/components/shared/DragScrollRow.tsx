'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

/**
 * A row of cards that slides by itself — no arrow buttons. Touch: the normal swipe. Mouse: click and drag the row left
 * or right (a plain click still opens a card; a drag never does). Keyboard: the row can take focus and scrolls with the
 * arrow keys. Snaps to a card again once released.
 */
export default function DragScrollRow({ children, className = '', label }: { readonly children: ReactNode; readonly className?: string; readonly label?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startLeft: 0, moved: false });

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return; // touch keeps its native swipe
    drag.current = { down: true, startX: e.clientX, startLeft: ref.current.scrollLeft, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    const d = drag.current;
    if (!d.down || !el) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < 6) return; // a small wobble is still a click
    if (!d.moved) {
      d.moved = true;
      el.style.scrollSnapType = 'none'; // follow the mouse freely while dragging
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = d.startLeft - dx;
  };

  const endDrag = () => {
    const el = ref.current;
    drag.current.down = false;
    if (el) el.style.scrollSnapType = ''; // settle on the nearest card
  };

  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
      // A drag that ends over a card must not open it.
      onClickCapture={(e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation(); drag.current.moved = false; } }}
      onDragStart={(e) => e.preventDefault()}
      className={`flex cursor-grab snap-x snap-mandatory gap-3 overflow-x-auto py-1 hide-scrollbar select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:cursor-grabbing ${className}`}
    >
      {children}
    </div>
  );
}
