'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { BOTTOM_NAV_PATHS, usesBottomNav } from './bottomNavPaths';
import { usePublicNav } from './usePublicNav';
import NotificationsPopover from '@/components/notifications/inbox/NotificationsPopover';
import SuturaLogo from '@/components/brand/SuturaLogo';
import LoginButton from './LoginButton';
import { useAuthStore } from '@/store/useAuthStore';

interface PageBrandRowProps {
  /** Adds the page side margins, for placing it outside a margined container. */
  readonly standalone?: boolean;
  readonly className?: string;
}

/**
 * Phones and tablets: the SUTURA logo, then Notifications (with the unread count) and, for a visitor who isn't signed
 * in, a "Log in" button — at the top of the page content, in place of a header bar. Order tracking is a tab of the
 * bottom bar. From 1024px PublicNav's header takes over, so this row hides.
 * The row is only as tall as its content (32px); the 44px+ tap areas are drawn outside it so they add no space.
 */
export default function PageBrandRow({ standalone = false, className = '' }: PageBrandRowProps) {
  const pathname = usePathname() ?? '/';
  const { notificationsHref, notificationsTitle, unreadCount, isAuthenticated } = usePublicNav();
  // Wait for the saved session before offering "Log in", so a signed-in person never sees it flash.
  const hydrated = useAuthStore((s) => s.hydrated);
  const main = BOTTOM_NAV_PATHS.includes(pathname);
  // Pages inside the profile have their own back row on a phone; from 768px (where that row is hidden) they show this one.
  if (!main && !usesBottomNav(pathname)) return null;

  return (
    <div className={`flex h-11 items-center justify-between lg:hidden ${standalone ? 'mobile-screen-margins mt-3' : ''} ${main ? '' : 'max-md:hidden'} ${className}`}>
      <Link href="/" aria-label="SUTURA home" className="relative flex items-center before:absolute before:-inset-x-2 before:-inset-y-3">
        <SuturaLogo className="h-8 w-auto text-espresso" />
      </Link>
      <div className="flex items-center gap-3">
        {notificationsHref === '/notifications' ? (
          <NotificationsPopover unreadCount={unreadCount} title={notificationsTitle} />
        ) : (
          <Link href={notificationsHref} aria-label={notificationsTitle} title={notificationsTitle} className="relative flex h-8 w-8 items-center justify-center rounded-full text-espresso before:absolute before:-inset-2 hover:bg-sunken">
            <Bell size={22} />
          </Link>
        )}
        {hydrated && !isAuthenticated && (
          <LoginButton />
        )}
      </div>
    </div>
  );
}
