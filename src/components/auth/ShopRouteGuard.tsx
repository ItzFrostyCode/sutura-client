'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useShopAccount } from '@/hooks/useShopAccount';

// Own-storefront subpaths the dashboard relies on (profile preview, review
// management, catalog/service/package previews, portfolio). Customer
// actions on it — booking, repair requests — stay blocked.
const OWN_STORE_SUBPATHS = ['', '/catalog', '/service', '/package', '/portfolio'];

function isAllowed(pathname: string, ownStoreKeys: string[]): boolean {
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/print') || pathname.startsWith('/admin')) return true;
  return ownStoreKeys.some((key) =>
    OWN_STORE_SUBPATHS.some((sub) => {
      const base = `/store/${key}${sub}`;
      return pathname === base || (sub !== '' && pathname.startsWith(`${base}/`));
    }),
  );
}

/**
 * Shop accounts (owner, branch manager, staff) sign in with an admin-issued
 * shop login and live in /dashboard — they don't browse SUTURA as a
 * customer. Any other page (landing, search, map, other shops, customer
 * account pages, login/register) sends them back to their dashboard.
 * Customers and guests are never affected.
 *
 * Client-side because sessions live in local/sessionStorage, not cookies,
 * so middleware can't see them; the API's role gates remain the real
 * security boundary.
 */
export default function ShopRouteGuard({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { isShopAccount, ownStoreKeys } = useShopAccount();
  const blocked = isShopAccount && !isAllowed(pathname, ownStoreKeys);

  useEffect(() => {
    if (blocked) router.replace('/dashboard');
  }, [blocked, router]);

  // Don't flash the customer page while the redirect happens.
  if (blocked) return null;
  return <>{children}</>;
}
