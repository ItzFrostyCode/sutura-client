'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScrollNavProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'className'> {
  /** Classes of the scrolling row itself (layout: flex, gap, padding). Scrolling and the hidden scrollbar are added here. */
  readonly className?: string;
  /** Classes of the wrapper around the row (margins, border, width). */
  readonly wrapperClassName?: string;
  /** The colour the edge fade melts into: the panel the strip sits on. */
  readonly fade?: 'surface' | 'canvas';
  /** Keep the chosen tab in view (sideways only): pass a selector such as `[aria-selected="true"]`. */
  readonly activeSelector?: string;
}

const FADE = { surface: 'from-surface via-surface/90', canvas: 'from-canvas via-canvas/90' } as const;

/**
 * A row of tabs or chips that scrolls sideways. When some of it is out of sight, a "‹" or "›" arrow (with a soft fade) shows on
 * that side, so people know there is more there and can tap to reveal it; the arrow goes away at the end. The same on every nav.
 */
export default function ScrollNav({ children, className = '', wrapperClassName = '', fade = 'surface', activeSelector, ...rest }: ScrollNavProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setLeft(el.scrollLeft > 4);
    setRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const resize = new ResizeObserver(update);
    resize.observe(el);
    // Tabs gain or lose a count or a label: the strip may now be longer or shorter.
    const mutate = new MutationObserver(update);
    mutate.observe(el, { childList: true, subtree: true, characterData: true });
    return () => { resize.disconnect(); mutate.disconnect(); };
  }, [update]);

  // When the chosen tab changes, bring it into view inside the strip. Sideways only: the page itself is never scrolled.
  const lastActive = useRef<Element | null>(null);
  useEffect(() => {
    const el = ref.current;
    const active = activeSelector ? el?.querySelector<HTMLElement>(activeSelector) : null;
    if (!el || !active || active === lastActive.current) return;
    lastActive.current = active;
    const a = active.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (a.left < r.left) el.scrollLeft -= r.left - a.left + 16;
    else if (a.right > r.right) el.scrollLeft += a.right - r.right + 16;
  });

  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.7, behavior: 'smooth' });
  const arrow = 'absolute top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-espresso/15 bg-white text-espresso shadow-sm hover:bg-sunken';

  return (
    <div className={`relative min-w-0 ${wrapperClassName}`}>
      {left && <span aria-hidden className={`pointer-events-none absolute inset-y-0 left-0 z-[5] w-12 bg-gradient-to-r to-transparent ${FADE[fade]}`} />}
      {right && <span aria-hidden className={`pointer-events-none absolute inset-y-0 right-0 z-[5] w-12 bg-gradient-to-l to-transparent ${FADE[fade]}`} />}
      {left && <button type="button" tabIndex={-1} onClick={() => go(-1)} aria-label="Show earlier tabs" className={`${arrow} left-0.5`}><ChevronLeft size={18} /></button>}
      {right && <button type="button" tabIndex={-1} onClick={() => go(1)} aria-label="Show more tabs" className={`${arrow} right-0.5`}><ChevronRight size={18} /></button>}
      <div ref={ref} onScroll={update} className={`overflow-x-auto hide-scrollbar ${className}`} {...rest}>{children}</div>
    </div>
  );
}
