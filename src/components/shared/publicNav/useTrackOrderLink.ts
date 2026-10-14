'use client';

import { useAuthStore } from '@/store/useAuthStore';

const NON_CUSTOMER_ROLES = new Set(['store_owner', 'staff', 'branch_manager', 'admin']);

/** Where the Order Tracking icon leads: the code page for guests, My Orders for customers, the jobs list for shop roles. */
export function useTrackOrderLink() {
  const { isAuthenticated, user, hydrated } = useAuthStore();
  const isAuth = hydrated && isAuthenticated && !!user;
  const isNonCustomer = isAuth && (user?.roles?.some((r) => NON_CUSTOMER_ROLES.has(r.name)) ?? false);
  const isCustomer = isAuth && !isNonCustomer;

  return {
    href: isAuth ? (isCustomer ? '/account/orders' : '/dashboard/jobs') : '/track',
    title: isAuth ? (isCustomer ? 'My Orders & Tracking' : 'Track Job Orders') : 'Track Order with Code',
    label: isAuth ? (isCustomer ? 'My Orders' : 'Track Jobs') : 'Track Order',
  };
}
