import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const canGoBack = () => window.history.length > 1;

/**
 * True when this tab has a page to go back to. A page opened in a new tab (the Eye / "Preview customer view" links, a shared
 * link) starts with no history, so a Back button there would do nothing — callers hide it instead. False on the server.
 */
export function useCanGoBack(): boolean {
  return useSyncExternalStore(subscribe, canGoBack, () => false);
}
