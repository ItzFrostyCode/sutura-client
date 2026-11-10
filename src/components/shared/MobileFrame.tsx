'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthPath, usesBottomNav } from './publicNav/bottomNavPaths';
import PublicTopBar from './topbar/PublicTopBar';

/**
 * Breakpoint-aware layout frame:
 *
 * < 640px (Tailwind `sm`) — Mobile column: 599px max-width, centered,
 *            scrolls inside this div (same as before — the "phone preview"
 *            experience).
 *
 * ≥ 640px — Tablet/desktop web layout: full viewport width, mx-auto. Body
 *           scroll instead of div scroll so sticky headers, browser
 *           address-bar auto-hide, and scroll anchoring all work correctly.
 *
 * Deliberately matches `sm:` (640px), not the visually-close 600px this
 * comment used to claim — every other breakpoint on the site (PublicNav's
 * own header padding, `.mobile-screen-margins`) is keyed off Tailwind's
 * real `sm`/`lg` breakpoints, so a custom 600px cutover here would reopen
 * the exact 600–639px "half mobile, half tablet" mismatch this comment's
 * old wording caused.
 *
 * Skips /dashboard entirely — that shell is deliberately desktop-first.
 */
export default function MobileFrame({ children }: { readonly children: React.ReactNode }) {
  const pathname = usePathname();
  const [isEmbed, setIsEmbed] = useState(false);
  useEffect(() => {
    setIsEmbed(new URLSearchParams(window.location.search).get('embed') === '1');
  }, [pathname]);
  // The System Admin console is desktop-first too, same as /dashboard.
  const isDashboard = (pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin')) ?? false;

  if (isDashboard) return <>{children}</>;

  // The top bar (location, header) of every bottom-nav page lives HERE, not in each page: it is drawn once and stays
  // mounted while only the page under it changes, so moving between Discover, Map, Track Order… never redraws it
  // (no address flashing back to "Davao City", no appointment strip popping in, no header jump). Same idea as
  // PublicBottomNav in RootLayout. Pages just fill the rest (`flex-1`).
  const topBar = pathname && usesBottomNav(pathname) && !isEmbed ? <PublicTopBar /> : null;

  if (pathname === '/map' || pathname?.startsWith('/search')) {
    return (
      <div
        id="mobile-frame-container"
        data-mobile-frame="true"
        data-fullscreen="true"
        className="w-full h-dvh overflow-hidden bg-canvas relative flex flex-col"
      >
        {topBar}
        {children}
      </div>
    );
  }

  return (
    <div
      id="mobile-frame-container"
      data-mobile-frame="true"
      className="w-full min-h-dvh bg-canvas relative flex flex-col"
    >
      {topBar}
      {children}
    </div>
  );
}
