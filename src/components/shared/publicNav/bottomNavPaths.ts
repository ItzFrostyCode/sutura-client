/**
 * Pages that use the bottom-navigation layout, at every screen size: bottom navigation, no header bar, and the
 * SUTURA name with the Order Tracking icon at the top of the page content (PageBrandRow). Every other public page
 * keeps the header.
 */
export const BOTTOM_NAV_PATHS = ['/', '/search', '/categories', '/shops', '/stores', '/notifications', '/track', '/account', '/about', '/ask'];

/**
 * The bottom navigation (and no header bar) is also kept on every page inside the profile (`/account/orders`, `/account/settings`…), so
 * opening one does not swap the layout under the person's thumb: same side margins, same top margin, same bar at the bottom — the
 * page's own back row (`AccountHeader`) takes the place of the SUTURA name row.
 */
export const AUTH_PATHS = ['/login', '/register', '/register/store', '/forgot-password', '/reset-password'];

export function isAuthPath(pathname: string): boolean {
  return (
    AUTH_PATHS.includes(pathname) ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password')
  );
}

/**
 * A shop's own page (/store/<slug>), not its booking or design pages. It gets the same way around as the rest of the
 * site (bottom bar on a phone, the header from tablet up): opened from a shared link it would otherwise have no Back and
 * no way out at all. A shop account previewing its own page keeps its owner bar instead (see usesCustomerNavOn).
 */
export const isShopProfilePath = (pathname: string): boolean => /^\/store\/[^/]+\/?$/.test(pathname);

/** The customer's site navigation is for customers and guests; on its own shop page a shop account has its owner bar. */
export function usesCustomerNavOn(pathname: string, isShopAccount: boolean): boolean {
  return usesBottomNav(pathname) && !(isShopAccount && isShopProfilePath(pathname));
}

export function usesBottomNav(pathname: string): boolean {
  // Authentication screens never show the bottom navigation bar
  if (isAuthPath(pathname)) {
    return false;
  }

  return (
    BOTTOM_NAV_PATHS.includes(pathname) ||
    pathname.startsWith('/account/') ||
    isShopProfilePath(pathname)
  );
}

