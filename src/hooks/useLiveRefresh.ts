'use client';

import { useEffect, useRef } from 'react';

/**
 * Calls `refresh` every `everyMs` while the tab is visible, and once right away when the person comes back to the tab.
 * Nothing runs in a hidden tab, so a page left open in the background does not keep calling the server.
 * Used where the shop's action should show up on the customer's screen without a reload (payment approved, stage moved).
 */
export function useLiveRefresh(refresh: () => void, everyMs: number, enabled = true) {
  const latest = useRef(refresh);
  useEffect(() => { latest.current = refresh; }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => { if (document.visibilityState === 'visible') latest.current(); };
    const id = window.setInterval(tick, everyMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [everyMs, enabled]);
}
