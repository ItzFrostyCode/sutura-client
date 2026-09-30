import { useEffect } from 'react';

// Stacked overlays share one lock: the page only unlocks when the last closes.
let locks = 0;
let restore: (() => void) | null = null;

function lock() {
  if (locks++ > 0) return;
  const body = document.body;
  const prev = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
  // Without this the page jumps sideways by one scrollbar width the moment
  // the scrollbar disappears — the modal would look off-center.
  const scrollbar = window.innerWidth - document.documentElement.clientWidth;
  body.style.overflow = 'hidden';
  if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

  // The dashboard scrolls inside <main data-scroll-root>, not the body, so
  // locking the body alone still lets the page behind the modal scroll.
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-scroll-root]')).map(el => ({ el, overflow: el.style.overflow }));
  roots.forEach(({ el }) => { el.style.overflow = 'hidden'; });

  restore = () => {
    body.style.overflow = prev.overflow;
    body.style.paddingRight = prev.paddingRight;
    roots.forEach(({ el, overflow }) => { el.style.overflow = overflow; });
  };
}

function unlock() {
  if (--locks > 0) return;
  locks = 0;
  restore?.();
  restore = null;
}

/** Freeze whatever is scrolling behind an open modal / sheet. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
