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
  const { isAuthenticated, user } = useAuthStore();

  const isNonCustomer = user?.roles?.some((r) => NON_CUSTOMER_ROLES.has(r.name)) ?? false;
  const accountHref = isAuthenticated && isNonCustomer ? '/dashboard' : '/account';

  useEffect(() => {
    if (!isAuthenticated) return;
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

  // Resizing past lg (1024px) while the mobile drawer is open — e.g.
  // rotating a tablet, or dragging a browser window wider — left it open
  // with no way to close it (the hamburger button itself is lg:hidden, so
  // there was nothing left to click), stacked on top of the now-visible
  // WebHoverNav, plus its body-scroll-lock never got released. Force-close
  // it the moment the viewport crosses into desktop nav territory.
  useCloseOnDesktop(() => {
    setMenuOpen(false);
    setScreen({ level: 0 });
  }, 1024);

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

  const effectiveUnreadCount = isAuthenticated ? unreadCount : 0;

  return {
    menuOpen,
    screen,
    setScreen,
    openSection,
    unreadCount: effectiveUnreadCount,
    accountHref,
    toggleMenu,
    closeMenu,
    goBack,
    openCategory,
    toggleSection,
  };
}
