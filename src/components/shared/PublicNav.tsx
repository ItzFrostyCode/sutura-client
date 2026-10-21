'use client';

import React from 'react';
import Link from 'next/link';
import SuturaLogo from '@/components/brand/SuturaLogo';
import { usePathname } from 'next/navigation';
import { usePublicNav } from './publicNav/usePublicNav';
import NavActionButtons from './publicNav/NavActionButtons';
import PublicTopLinks from './publicNav/PublicTopLinks';
import { isAuthPath, usesBottomNav } from './publicNav/bottomNavPaths';

/**
 * The main pages (bottomNavPaths) have no header bar at any screen size: the name and Order Tracking icon sit in
 * the page (PageBrandRow) and the main destinations are in the bottom bar. Other pages keep this header.
 *
 * Tablet and desktop: logo left, Discover / Map / About centered, Order Tracking / Notifications / Profile right.
 */
export default function PublicNav({
  isSticky = true,
  className = '',
}: {
  readonly isSticky?: boolean;
  readonly className?: string;
} = {}) {
  const {
    unreadCount,
    notificationsHref,
    notificationsTitle,
    trackOrderHref,
    trackOrderTitle,
    accountHref,
    userTitle,
    user,
    isAuthenticated,
  } = usePublicNav();
  const pathname = usePathname() ?? '/';
  const hideHeader = usesBottomNav(pathname) || isAuthPath(pathname);

  return (
    <>
      <header className={`${isSticky ? 'sticky top-0' : 'relative'} z-50 w-full shrink-0 border-b border-line bg-surface text-ink ${hideHeader ? 'hidden' : ''} ${className}`}>
        <div className="relative mx-auto flex h-[52px] max-w-7xl items-center justify-between px-4 sm:h-[60px] sm:px-6 lg:px-8">
          <Link href="/" aria-label="SUTURA home" className="flex min-h-11 shrink-0 items-center">
            <SuturaLogo halo="var(--card-bg)" className="h-7 w-auto text-espresso sm:h-8" />
          </Link>

          <PublicTopLinks />

          <NavActionButtons
            trackOrderHref={trackOrderHref}
            trackOrderTitle={trackOrderTitle}
            notificationsHref={notificationsHref}
            notificationsTitle={notificationsTitle}
            unreadCount={unreadCount}
            accountHref={accountHref}
            userTitle={userTitle}
            user={user}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </header>
    </>
  );
}
