'use client';

import { useEffect, useState } from 'react';

/**
 * True when the page is shown inside the map panel (`?embed=1`): the panel already has the shop's name, address and Back, so the
 * page leaves out its own way back to the shop. Read after mounting, so a page needs no Suspense boundary for it.
 */
export function useEmbedded(): boolean {
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    const isIframe = typeof window !== 'undefined' && window.self !== window.top;
    const hasEmbed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';
    setEmbedded(isIframe || hasEmbed);
  }, []);
  return embedded;
}

/** `?embed=1` to keep on links that stay inside the map panel, or nothing. */
export const embedSuffix = (embedded: boolean) => (embedded ? '?embed=1' : '');
