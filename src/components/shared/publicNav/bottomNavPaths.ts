/**
 * Pages that use the bottom-navigation layout, at every screen size: bottom navigation, no header bar, and the
 * SUTURA name with the Order Tracking icon at the top of the page content (PageBrandRow). Every other public page
 * keeps the header.
 */
export const BOTTOM_NAV_PATHS = ['/', '/search', '/categories', '/notifications', '/track', '/account', '/about', '/ask'];

/**
 * The bottom navigation (and no header bar) is also kept on every page inside the profile (`/account/orders`, `/account/settings`…), so
 * opening one does not swap the layout under the person's thumb: same side margins, same top margin, same bar at the bottom — the
 * page's own back row (`AccountHeader`) takes the place of the SUTURA name row.
 */
export function usesBottomNav(pathname: string): boolean {
  return BOTTOM_NAV_PATHS.includes(pathname) || pathname.startsWith('/account/') || AUTH_PATHS.includes(pathname);
}

/**
 * Log In and Sign Up are reached from the Profile tab, so they keep its layout too: no header bar, the bottom
 * navigation stays (owner, 2026-10-15), and the Profile tab stays lit.
 */
export const AUTH_PATHS = ['/login', '/register'];
