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
 * The main pages (bottomNavPaths) have no header bar on phones and tablets: the name sits in the page (PageBrandRow)
 * and the main destinations are in the bottom bar. From 1024px the bottom bar is hidden and this header takes over.
 * Other pages keep this header at every size.
 *
 * Tablet and desktop: logo left, Discover / Map / Track centered, Notifications / Log in or Profile right.
 */
export default function PublicNav({
  isSticky = true,
  className = '',
  innerClassName = 'max-w-7xl px-4 sm:px-6 lg:px-8',
}: {
  readonly isSticky?: boolean;
  readonly className?: string;
  /** Width and side padding of the header's content; the landing page passes its 960px column so the logo lines up with the sections. */
  readonly innerClassName?: string;
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
  // Bottom-nav pages show this header only from 1024px, where the bottom bar is hidden; sign-in screens never show it.
  const visibility = isAuthPath(pathname) ? 'hidden' : usesBottomNav(pathname) ? 'hidden lg:block' : '';

  return (
    <>
      <header className={`${isSticky ? 'sticky top-0' : 'relative'} z-50 w-full shrink-0 border-b border-line bg-surface text-ink ${visibility} ${className}`}>
        <div className={`relative mx-auto flex h-[52px] items-center justify-between sm:h-[60px] ${innerClassName}`}>
          <Link href="/" aria-label="SUTURA home" className="flex min-h-11 shrink-0 items-center">
            <SuturaLogo className="h-7 w-auto text-espresso sm:h-8" />
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
