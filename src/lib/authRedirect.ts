/**
 * Where to go after signing in or up, and how. Always `router.replace`, never `push`: the sign-in page must not stay in
 * the browser history, or Back after booking lands on "Sign in" again (for someone who is already signed in).
 */

/** A path from `?redirect=` only when it stays inside the app (never `//other-site`). */
export function safeRedirect(value: string | null | undefined): string | null {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : null;
}

const SHOP_ROLES = ['store_owner', 'branch_manager', 'staff'];

/** A shop account goes to the dashboard (or the dashboard page it was sent from); a customer to where they were going, else home. */
export function destinationFor(
  user: { roles?: { name: string }[] } | null | undefined,
  hasStaffProfile: boolean,
  redirect: string | null | undefined,
): string {
  const to = safeRedirect(redirect);
  const shop = hasStaffProfile || !!user?.roles?.some((r) => SHOP_ROLES.includes(r.name));
  if (shop) return to?.startsWith('/dashboard') ? to : '/dashboard';
  return to && !to.startsWith('/dashboard') ? to : '/';
}

/** `/login` (or `/register`) that brings the person back to `redirect` afterwards. */
export function withRedirect(path: '/login' | '/register', redirect: string | null | undefined, extra?: string): string {
  const to = safeRedirect(redirect);
  const q = [extra, to ? `redirect=${encodeURIComponent(to)}` : null].filter(Boolean).join('&');
  return q ? `${path}?${q}` : path;
}
