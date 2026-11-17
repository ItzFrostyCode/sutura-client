'use client';

import { useEffect } from 'react';

/**
 * A step-by-step flow (online order, repair request, general request, booking) always fills the whole window. Opened
 * from a shop shown inside the search map's panel (an iframe, ?embed=1), it would otherwise run inside that narrow
 * panel: the steps get cut and the customer has to press "View store" to see them. Here the page moves itself to the
 * full window instead (same URL, without embed=1), on every screen size, so the flow looks the same however it was reached.
 */
export function useFullPage(): void {
  useEffect(() => {
    try {
      if (window.top && window.top !== window.self) {
        const url = new URL(window.location.href);
        url.searchParams.delete('embed');
        window.top.location.href = url.toString();
      }
    } catch {
      // A frame from another site cannot be moved; the page still works inside it.
    }
  }, []);
}
