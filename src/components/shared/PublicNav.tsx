'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X, Bell, User, Package } from 'lucide-react';
import { usePublicNav } from './publicNav/usePublicNav';
import NavMenuDrawer from './publicNav/NavMenuDrawer';
import WebHoverNav from './publicNav/WebHoverNav';

export default function PublicNav({
  hideMenu = false,
  isSticky = true,
  className = '',
}: {
  readonly hideMenu?: boolean;
  readonly isSticky?: boolean;
  readonly className?: string;
} = {}) {
  const {
    menuOpen,
    screen,
    setScreen,
    openSection,
    unreadCount,
    accountHref,
    toggleMenu,
    closeMenu,
    goBack,
    openCategory,
    toggleSection,
  } = usePublicNav();

  return (
    <header className={`${isSticky ? 'sticky top-0' : 'relative'} z-50 w-full shrink-0 bg-surface border-b border-line text-ink ${className}`}>
      <div className="relative h-[52px] sm:h-[64px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

        {/* MOBILE/TABLET (< lg): Hamburger Button. Kept until lg (1024px) —
            below that, the 5-item department nav has nowhere near enough
            room next to the centered SUTURA logo and visibly collides
            with it. */}
        {!hideMenu && (
          <button
            type="button"
            onClick={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="lg:hidden shrink-0 w-11 h-11 flex items-center justify-center text-ink active:opacity-75 transition-opacity cursor-pointer -ml-2 rounded-full hover:bg-sunken"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        )}

        {/* MOBILE/TABLET (< lg): Center SUTURA Logo */}
        <div className="lg:hidden flex-1 flex justify-center">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center justify-center group"
          >
            <span className="text-[20px] font-serif font-bold text-ink tracking-widest leading-none">
              SUTURA
            </span>
          </Link>
        </div>

        {/* DESKTOP (>= lg): All 5 Categories on the LEFT SIDE */}
        <WebHoverNav />

        {/* DESKTOP (>= lg): SUTURA Logo Centered */}
        <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 pointer-events-auto">
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center justify-center group"
          >
            <span className="text-[20px] sm:text-[24px] font-serif font-bold text-ink tracking-widest leading-none group-hover:opacity-80 transition-opacity whitespace-nowrap">
              SUTURA
            </span>
          </Link>
        </div>

        {/* RIGHT: [Track Order] + [Notifications] + [User Account] */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end">
          {/* 1. Track Order (Box) Icon */}
          <Link
            href="/track"
            aria-label="Track Order"
            onClick={closeMenu}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-ink hover:bg-sunken rounded-full transition-colors"
          >
            <Package size={19} />
          </Link>

          {/* 2. Notifications (Bell) Icon */}
          <Link
            href="/notifications"
            aria-label="Notifications"
            onClick={closeMenu}
            className="relative shrink-0 w-10 h-10 flex items-center justify-center text-ink hover:bg-sunken rounded-full transition-colors"
          >
            <Bell size={19} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-[#E41E3F] text-white text-[8px] font-bold rounded-full border border-canvas">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* 3. User Account Icon */}
          <Link
            href={accountHref}
            aria-label="Account"
            onClick={closeMenu}
            className="shrink-0 w-10 h-10 flex items-center justify-center text-ink hover:bg-sunken rounded-full transition-colors"
          >
            <User size={19} />
          </Link>
        </div>
      </div>

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
      />
    </header>
  );
}
