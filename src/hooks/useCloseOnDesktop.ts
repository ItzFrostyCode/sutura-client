'use client';

import { useEffect, useRef } from 'react';

/**
 * Auto-closes a mobile-only drawer/sheet the moment the viewport crosses
 * into whatever breakpoint replaces it with a persistent desktop/tablet UI
 * (a filter sidebar instead of a filter drawer, WebHoverNav instead of the
 * hamburger drawer, etc.). Without this, resizing or rotating past that
 * point leaves the mobile overlay open with no way to close it — its own
 * trigger button is hidden at that width too — stacked on top of the
 * now-visible desktop equivalent, often with its scroll-lock never
 * released either.
 *
 * `onDesktop` fires on every resize crossing into desktop width, whether
 * or not the sheet is actually open — cheap, and the caller's own setter
 * (e.g. `setOpen(false)`) is a no-op if it's already closed.
 */
export function useCloseOnDesktop(onDesktop: () => void, breakpointPx = 1024) {
  const onDesktopRef = useRef(onDesktop);
  onDesktopRef.current = onDesktop;

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) onDesktopRef.current();
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [breakpointPx]);
}
