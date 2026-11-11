'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLiveRefresh } from '@/hooks/useLiveRefresh';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useTrackOrderLink } from './useTrackOrderLink';

const NON_CUSTOMER_ROLES = new Set(['store_owner', 'staff', 'branch_manager', 'admin']);

export function usePublicNav() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, user, hydrated } = useAuthStore();

  const isAuth = hydrated && isAuthenticated && !!user;
  const isNonCustomer = isAuth && (user?.roles?.some((r) => NON_CUSTOMER_ROLES.has(r.name)) ?? false);
  const isCustomer = isAuth && !isNonCustomer;

  // Track Order: the code page for guests, My Orders for customers, the jobs list for shop roles.
  const { href: trackOrderHref, title: trackOrderTitle } = useTrackOrderLink();

  // Notifications:
  // - Customer Profile: routes to /notifications (fetches customer notifications)
  // - Tailor / Staff: routes to /dashboard/notifications
  // - Guest Account: routes to /notifications (shows guest sign-in engagement card)
  const notificationsHref = isAuth
    ? (isNonCustomer ? '/dashboard/notifications' : '/notifications')
    : '/notifications';

  // User Account:
  // - Customer Profile: routes to /account
  // - Tailor / Staff: routes to /dashboard
  // - Guest Account: routes to /account (loads GuestAccountHub)
  const accountHref = isAuth
    ? (isNonCustomer ? '/dashboard' : '/account')
    : '/account';

  const userTitle = isAuth
    ? (user?.name ? `${user.name} (${isCustomer ? 'Customer Profile' : 'Dashboard'})` : 'My Account')
    : 'Account / Sign In';

  const fetchUnread = useCallback(() => {
    api.get('/notifications')
      .then((res) => setUnreadCount(typeof res.data.unread_count === 'number' ? res.data.unread_count : 0))
      .catch(() => { /* keep the last count on a network blip */ });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    fetchUnread();
  }, [isAuthenticated, fetchUnread]);

  // New notifications (a payment approved, an order ready) reach the bell without a reload: every 30 seconds while the
  // tab is open, and at once when the person comes back to it.
  useLiveRefresh(fetchUnread, 30_000, isAuthenticated);

  useEffect(() => {
    const onChange = (e: Event) => setUnreadCount(Number((e as CustomEvent<number>).detail) || 0);
    window.addEventListener('sutura:unread_changed', onChange);
    return () => window.removeEventListener('sutura:unread_changed', onChange);
  }, []);

  const effectiveUnreadCount = isAuth ? unreadCount : 0;
  const notificationsTitle = effectiveUnreadCount > 0
    ? `${effectiveUnreadCount} unread notification${effectiveUnreadCount > 1 ? 's' : ''}`
    : 'Notifications';

  return {
    unreadCount: effectiveUnreadCount,
    accountHref,
    userTitle,
    trackOrderHref,
    trackOrderTitle,
    notificationsHref,
    notificationsTitle,
    user: isAuth ? user : null,
    isAuthenticated: isAuth,
  };
}
