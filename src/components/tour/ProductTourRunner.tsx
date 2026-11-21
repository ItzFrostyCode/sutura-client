'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuthStore } from '@/store/useAuthStore';
import { TOURS, isTourId, markTourDone } from './tours';

const WAIT_MS = 8000;

/** Resolves once the element is on the page (lists load after the page does). */
function waitFor(selector: string, timeout = WAIT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) return resolve(true);
    const started = Date.now();
    const timer = setInterval(() => {
      if (document.querySelector(selector)) { clearInterval(timer); resolve(true); }
      else if (Date.now() - started > timeout) { clearInterval(timer); resolve(false); }
    }, 150);
  });
}

/** An element that is actually showing (not display:none on this screen size). */
const visible = (selector: string) => {
  const el = document.querySelector<HTMLElement>(selector);
  return !!el && el.getClientRects().length > 0;
};

/**
 * Runs the product tour named in ?tour= on the page it belongs to. Mounted once
 * in the dashboard layout, so pages only need `data-tour` attributes. Finishing
 * or skipping marks the tour done (the Welcome Guide shows ✓ Done / Replay).
 */
export default function ProductTourRunner() {
  const params = useSearchParams();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const starting = useRef(false);
  const active = useRef<Driver | null>(null);
  const tourParam = params.get('tour');

  useEffect(() => {
    if (!isTourId(tourParam) || starting.current || active.current) return;
    const tour = TOURS[tourParam];
    if (pathname !== tour.path && !(tour.pathPrefix && pathname?.startsWith(tour.pathPrefix))) return;
    starting.current = true;
    let aborted = false;

    (async () => {
      // Wait for any stop to render (the page's data loads after navigation), then let it settle.
      await Promise.race(tour.stops.map((s) => waitFor(s.element)));
      await new Promise((r) => setTimeout(r, 300));
      const stops = tour.stops.filter((s) => visible(s.element));
      if (aborted || stops.length === 0) { starting.current = false; return; }

      const { driver } = await import('driver.js');
      if (aborted) { starting.current = false; return; }
      const d = driver({
        showProgress: stops.length > 1,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
        allowClose: true,
        overlayColor: '#2D2A26',
        overlayOpacity: 0.55,
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: 'sutura-tour',
        smoothScroll: true,
        steps: stops.map((s) => ({ element: s.element, popover: { title: s.title, description: s.text } })),
        onDestroyed: () => {
          markTourDone(user?.id, tour.id);
          active.current = null;
        },
      });
      active.current = d;
      starting.current = false;
      d.drive();

      // Take ?tour= off the address so a refresh doesn't restart it (the tour keeps running).
      const clean = new URLSearchParams(window.location.search);
      clean.delete('tour');
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${clean.toString() ? `?${clean}` : ''}`);
    })();

    // Only abandons a tour that hasn't opened yet; a running tour isn't closed by the address change above.
    // (Clearing `starting` lets the re-run that follows, e.g. once the user loads, start it instead.)
    return () => { if (!active.current) { aborted = true; starting.current = false; } };
  }, [tourParam, pathname, user?.id]);

  // Leaving the page closes the tour.
  useEffect(() => () => { active.current?.destroy(); }, [pathname]);

  return null;
}
