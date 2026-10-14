'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Package } from 'lucide-react';
import { BOTTOM_NAV_PATHS, usesBottomNav } from './bottomNavPaths';
import { useTrackOrderLink } from './useTrackOrderLink';
import { usePublicNav } from './usePublicNav';
import NotificationsPopover from '@/components/notifications/inbox/NotificationsPopover';
import SuturaLogo from '@/components/brand/SuturaLogo';

interface PageBrandRowProps {
  /** Adds the page side margins, for placing it outside a margined container. */
  readonly standalone?: boolean;
  readonly className?: string;
}

/**
 * The SUTURA logo, then Notifications (with the unread count, as on Facebook) beside Order Tracking, at the top of the page content,
 * in place of a header bar.
 * The row is only as tall as its content (32px); the 44px+ tap areas are drawn outside it so they add no space.
 */
export default function PageBrandRow({ standalone = false, className = '' }: PageBrandRowProps) {
  const pathname = usePathname() ?? '/';
  const track = useTrackOrderLink();
  const { notificationsHref, notificationsTitle, unreadCount } = usePublicNav();
  const main = BOTTOM_NAV_PATHS.includes(pathname);
  // Pages inside the profile have their own back row on a phone; from 768px (where that row is hidden) they show this one.
  if (!main && !usesBottomNav(pathname)) return null;

  return (
    <div className={`flex h-8 items-center justify-between ${standalone ? 'mobile-screen-margins mt-3' : ''} ${main ? '' : 'max-md:hidden'} ${className}`}>
      <Link href="/" aria-label="SUTURA home" className="relative flex items-center before:absolute before:-inset-x-2 before:-inset-y-3">
        <SuturaLogo className="h-8 w-auto text-espresso" />
      </Link>
      <div className="flex items-center gap-3">
      {notificationsHref === '/notifications' ? (
        <NotificationsPopover unreadCount={unreadCount} title={notificationsTitle} />
      ) : (
        <Link href={notificationsHref} aria-label={notificationsTitle} title={notificationsTitle} className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink-muted before:absolute before:-inset-2 hover:bg-sunken hover:text-ink">
          <Bell size={22} />
        </Link>
      )}
      <Link
        href={track.href}
        aria-label={track.title}
        title={track.title}
        className="relative -mr-1 flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors before:absolute before:-inset-2 hover:bg-sunken hover:text-ink"
      >
        <Package size={22} />
      </Link>
      </div>
    </div>
  );
}
