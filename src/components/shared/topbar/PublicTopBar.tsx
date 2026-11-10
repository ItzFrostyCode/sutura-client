'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import PublicNav from '@/components/shared/PublicNav';
import PageBrandRow from '@/components/shared/publicNav/PageBrandRow';
import { BOTTOM_NAV_PATHS } from '@/components/shared/publicNav/bottomNavPaths';
import UpcomingAppointmentBar from '@/components/home/UpcomingAppointmentBar';
import { HOME_COLUMN } from '@/components/home/homeLayout';
import TopLocationBar from './TopLocationBar';

const SCROLLBAR_KEY = 'sutura_scrollbar_w';
/** Discover and the pages it opens: the only ones whose header shows the location strip. */
const DISCOVER_PATHS = ['/', '/shops', '/stores', '/categories'];

/**
 * The one top bar of every page that has the bottom navigation — Discover, Map, Track Order, All Shops, All
 * Categories, Notifications, About, Ask SUTURA and the profile pages — so moving between them never shifts anything:
 * the location strip, then (if any) the upcoming-appointment strip, then the SUTURA row. Phones and tablets get the
 * logo row (Notifications, Log in); from 1024px PublicNav's header with Discover / Map / Track in the middle. All of it
 * sits in the same 960px column as the page content (HOME_COLUMN), so the logo and the labels never move.
 * Pinned to the top at every size (phones too), so the SUTURA header is always there.
 *
 * A page inside the profile (/account/orders…) has its own back row on a phone, so the logo row starts at 768px there.
 */
export default function PublicTopBar() {
  const pathname = usePathname() ?? '/';
  // The Map (phone/tablet) has no SUTURA row at all: the logo sits inside its search bar (Google Maps style) and the
  // bell / Log in live on the Profile tab, so the map gets the room. From 1024px the full header shows as everywhere.
  const brandRow = pathname === '/search' ? 'hidden' : BOTTOM_NAV_PATHS.includes(pathname) ? '' : 'max-md:hidden';

  // The room the other pages keep for the scrollbar, for the map screen (which keeps none): see `.public-top-bar` in
  // globals.css. Read from a normal page itself (window width − page width) and remembered; only when the map is the
  // first page opened is it estimated with a throw-away scrolling box.
  useEffect(() => {
    const root = document.documentElement;
    const fullscreen = !!document.querySelector('[data-fullscreen="true"]');
    let width: number | null = fullscreen ? null : window.innerWidth - root.clientWidth;
    try {
      if (width !== null) localStorage.setItem(SCROLLBAR_KEY, String(width));
      else width = Number(localStorage.getItem(SCROLLBAR_KEY) ?? 'NaN');
    } catch { /* storage off: fall through to the estimate */ }
    if (width === null || !Number.isFinite(width)) {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll';
      document.body.appendChild(probe);
      width = probe.offsetWidth - probe.clientWidth;
      probe.remove();
    }
    root.style.setProperty('--scrollbar-w', `${Math.max(0, width)}px`);
  }, [pathname]);

  // How much of the top it covers (it is always pinned), as --topbar-h: jump links scroll to just under it (globals.css
  // scroll-padding-top) instead of sliding beneath it.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const root = document.documentElement;
    const pinned = window.matchMedia('(min-width: 0px)');
    const update = () => root.style.setProperty('--topbar-h', `${el.offsetHeight}px`);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    pinned.addEventListener('change', update);
    return () => { ro.disconnect(); pinned.removeEventListener('change', update); root.style.setProperty('--topbar-h', '0px'); };
  }, []);

  return (
    <>
    {/* The location strip: only on Discover's pages (Discover, All Shops, All Categories), where shops are listed by
        distance — and NOT pinned: it scrolls away, only the SUTURA header below stays at the top. The Map has it in its
        Filter pop-up; Track, Profile, Notifications, About and Ask do not need it. */}
    {DISCOVER_PATHS.includes(pathname) && <TopLocationBar />}
    <div ref={barRef} className="public-top-bar sticky top-0 z-50 shrink-0 bg-surface">
      <UpcomingAppointmentBar />
      {/* White on every device, like the desktop header. */}
      <div className={`border-b border-line bg-surface lg:hidden ${brandRow}`}>
        <div className={`${HOME_COLUMN} flex h-14 items-center`}>
          <PageBrandRow className="w-full" />
        </div>
      </div>
      <PublicNav isSticky={false} innerClassName={HOME_COLUMN} />
    </div>
    </>
  );
}
