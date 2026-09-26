'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useCloseOnDesktop } from '@/hooks/useCloseOnDesktop';
import type { CategoryLeaf, MenuScreen, TopGroup } from './navTypes';

const NON_CUSTOMER_ROLES = new Set(['store_owner', 'staff', 'branch_manager', 'admin']);

export function usePublicNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [screen, setScreen] = useState<MenuScreen>({ level: 0 });
  const [openSection, setOpenSection] = useState('explore');
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, user, hydrated } = useAuthStore();

  const isAuth = hydrated && isAuthenticated && !!user;
  const isNonCustomer = isAuth && (user?.roles?.some((r) => NON_CUSTOMER_ROLES.has(r.name)) ?? false);
  const isCustomer = isAuth && !isNonCustomer;

  // Track Order:
  // - Customer Profile: routes to their personal Job Orders & garment progress list
  // - Tailor / Staff: routes to store dashboard jobs
  // - Guest Account: routes to receipt code tracking page (/track)
  const trackOrderHref = isAuth
    ? (isCustomer ? '/account/orders' : '/dashboard/jobs')
    : '/track';

  const trackOrderTitle = isAuth
    ? (isCustomer ? 'My Orders & Tracking' : 'Track Job Orders')
    : 'Track Order with Code';

  const trackOrderLabel = isAuth
    ? (isCustomer ? 'My Orders' : 'Track Jobs')
    : 'Track Order';

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

  const userDrawerLabel = isAuth
    ? (isCustomer ? 'My Account' : 'Dashboard')
    : 'Sign In / Register';

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;

    api
      .get('/notifications')
      .then((res) => {
        if (isMounted) {
          setUnreadCount(typeof res.data.unread_count === 'number' ? res.data.unread_count : 0);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUnreadCount(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const effectiveUnreadCount = isAuth ? unreadCount : 0;
  const notificationsTitle = effectiveUnreadCount > 0
    ? `${effectiveUnreadCount} unread notification${effectiveUnreadCount > 1 ? 's' : ''}`
    : 'Notifications';

  // Resizing past md (768px) while the mobile drawer is open — e.g.
  // rotating a tablet, or dragging a browser window wider — left it open
  // with no way to close it. Force-close it the moment the viewport crosses
  // into desktop nav territory.
  useCloseOnDesktop(() => {
    setMenuOpen(false);
    setScreen({ level: 0 });
  }, 768);

  useEffect(() => {
    if (!menuOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const scrollContainers = Array.from(
      document.querySelectorAll<HTMLElement>('.overflow-y-auto, .overflow-x-hidden')
    );
    const prevStyles = new Map<HTMLElement, string>();
    scrollContainers.forEach((el) => {
      if (!el.closest('[data-public-nav-menu]')) {
        prevStyles.set(el, el.style.overflowY);
        el.style.overflowY = 'hidden';
      }
    });

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      prevStyles.forEach((val, el) => {
        el.style.overflowY = val;
      });
    };
  }, [menuOpen]);

  function toggleMenu() {
    setMenuOpen((open) => !open);
    setScreen({ level: 0 });
  }

  function closeMenu() {
    setMenuOpen(false);
    setScreen({ level: 0 });
  }

  function goBack() {
    if (screen.level === 2) setScreen({ level: 1, group: screen.group });
    else if (screen.level === 1) setScreen({ level: 0 });
  }

  function openCategory(group: TopGroup, category: CategoryLeaf) {
    setOpenSection(category.sections ? category.sections[0].key : 'explore');
    setScreen({ level: 2, group, category });
  }

  function toggleSection(key: string) {
    setOpenSection((cur) => (cur === key ? '' : key));
  }

  return {
    menuOpen,
    screen,
    setScreen,
    openSection,
    unreadCount: effectiveUnreadCount,
    accountHref,
    userTitle,
    userDrawerLabel,
    trackOrderHref,
    trackOrderTitle,
    trackOrderLabel,
    notificationsHref,
    notificationsTitle,
    user: isAuth ? user : null,
    isAuthenticated: isAuth,
    isCustomer,
    isNonCustomer,
    hydrated,
    toggleMenu,
    closeMenu,
    goBack,
    openCategory,
    toggleSection,
  };
}
