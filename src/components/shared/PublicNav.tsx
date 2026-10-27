'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { usePublicNav } from './publicNav/usePublicNav';
import NavMenuDrawer from './publicNav/NavMenuDrawer';
import NavActionButtons from './publicNav/NavActionButtons';
import FeatureNav from './FeatureNav';
import SuturaLogo from '@/components/brand/SuturaLogo';
import { getSavedLocation, requestCurrentLocation } from '@/lib/customerLocation';

export default function PublicNav({
  hideMenu = false,
  isSticky = true,
  className = '',
  featureNav = false,
}: {
  readonly hideMenu?: boolean;
  readonly isSticky?: boolean;
  readonly className?: string;
  /** Show the Map / Measurements / Tracking / Ask feature bar (fixed to the bottom of the screen). */
  readonly featureNav?: boolean;
} = {}) {
  const {
    menuOpen,
    screen,
    setScreen,
    openSection,
    unreadCount,
    notificationsHref,
    notificationsTitle,
    trackOrderHref,
    trackOrderTitle,
    trackOrderLabel,
    accountHref,
    userTitle,
    userDrawerLabel,
    user,
    isAuthenticated,
    toggleMenu,
    closeMenu,
    goBack,
    openCategory,
    toggleSection,
  } = usePublicNav();

  return (
    <header className={`${isSticky ? 'sticky top-0' : 'relative'} z-50 w-full shrink-0 bg-surface border-b border-line text-ink ${className}`}>
      <div className="relative h-[52px] sm:h-[64px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* MOBILE (< md): Hamburger Button */}
        {!hideMenu && (
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden shrink-0 w-11 h-11 flex items-center justify-center text-ink active:opacity-75 transition-opacity cursor-pointer -ml-2 rounded-full hover:bg-sunken"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        {/* MOBILE (< md): Center SUTURA Logo */}
        <div className="md:hidden flex-1 flex justify-center">
          <Link
            href="/"
            onClick={closeMenu}
            aria-label="SUTURA home"
            className="flex items-center justify-center group"
          >
            <SuturaLogo className="h-8" title="" />
          </Link>
        </div>

        {/* DESKTOP/TABLET (>= md): empty left slot — the category links moved
            to Discover (the feature bar → /categories); this keeps the action
            icons on the right with the logo centred. */}
        <div className="hidden md:block w-[120px]" aria-hidden="true" />

        {/* DESKTOP/TABLET (>= md): SUTURA Logo Centered */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <Link
            href="/"
            onClick={closeMenu}
            aria-label="SUTURA home"
            className="flex items-center justify-center group"
          >
            <SuturaLogo className="h-9 sm:h-10 group-hover:opacity-80 transition-opacity" title="" />
          </Link>
        </div>

        {/* RIGHT: [Track Order] + [Notifications] + [User Account] (Dynamic by Customer Profile vs Guest Account) */}
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
          onActionClick={closeMenu}
        />
      </div>

      {featureNav && <FeatureNav />}

      {/* Mobile Drawer (Clean White Background, Black Text, Zero Descriptions) */}
      <NavMenuDrawer
        isOpen={menuOpen}
        screen={screen}
        openSection={openSection}
        onClose={closeMenu}
        onGoBack={goBack}
        onSelectGroup={(group) => setScreen({ level: 1, group })}
        onOpenCategory={openCategory}
        onToggleSection={toggleSection}
        trackOrderHref={trackOrderHref}
        trackOrderLabel={trackOrderLabel}
        accountHref={accountHref}
        userDrawerLabel={userDrawerLabel}
        user={user}
        isAuthenticated={isAuthenticated}
      />
    </header>
  );
}
