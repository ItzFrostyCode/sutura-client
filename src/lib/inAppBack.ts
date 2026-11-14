/**
 * True when the page before this one in the tab's history is a SUTURA page, so a history Back stays inside the app
 * (order list, notifications, a shop page — wherever the person came from).
 *
 * The Navigation API only lists same-origin entries, so `canGoBack` is false when the page was opened by URL, from an
 * email link, or from another site: then the caller should go to its parent page instead of leaving SUTURA.
 * Browsers without it fall back to the history length.
 */
export function canGoBackInApp(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = (window as Window & { navigation?: { canGoBack?: boolean } }).navigation;
  if (nav && typeof nav.canGoBack === 'boolean') return nav.canGoBack;
  return window.history.length > 1;
}
