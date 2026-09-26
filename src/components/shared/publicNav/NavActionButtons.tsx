'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Package, User as UserIcon } from 'lucide-react';
import type { User } from '@/store/useAuthStore';
import { getMediaUrl } from '@/lib/media';

interface NavActionButtonsProps {
  readonly trackOrderHref: string;
  readonly trackOrderTitle: string;
  readonly notificationsHref: string;
  readonly notificationsTitle: string;
  readonly unreadCount: number;
  readonly accountHref: string;
  readonly userTitle: string;
  readonly user: User | null;
  readonly isAuthenticated: boolean;
  readonly onActionClick?: () => void;
}

export default function NavActionButtons({
  trackOrderHref,
  trackOrderTitle,
  notificationsHref,
  notificationsTitle,
  unreadCount,
  accountHref,
  userTitle,
  user,
  isAuthenticated,
  onActionClick,
}: NavActionButtonsProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-end">
      {/* 1. Track Order: routes to /account/orders for Customers, /track for Guests */}
      <Link
        href={trackOrderHref}
        aria-label={trackOrderTitle}
        title={trackOrderTitle}
        onClick={onActionClick}
        className="shrink-0 w-10 h-10 flex items-center justify-center text-ink hover:bg-sunken rounded-full transition-colors"
      >
        <Package size={19} />
      </Link>

      {/* 2. Notifications: red badge only shown when unreadCount > 0 (strictly 0 for guests) */}
      <Link
        href={notificationsHref}
        aria-label={notificationsTitle}
        title={notificationsTitle}
        onClick={onActionClick}
        className="relative shrink-0 w-10 h-10 flex items-center justify-center text-ink hover:bg-sunken rounded-full transition-colors"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 flex items-center justify-center bg-[#E41E3F] text-white text-[8px] font-bold rounded-full border border-canvas">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      {/* 3. User / Account: Customer avatar/initial when logged in, outline User icon for guests */}
      <Link
        href={accountHref}
        aria-label={userTitle}
        title={userTitle}
        onClick={onActionClick}
        className="shrink-0 w-10 h-10 flex items-center justify-center text-ink hover:bg-sunken rounded-full transition-colors"
      >
        {isAuthenticated && user ? (
          user.profile_picture ? (
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-line">
              <Image
                src={getMediaUrl(user.profile_picture)}
                alt={user.name || 'Account'}
                fill
                sizes="32px"
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-taupe text-white text-[12px] sm:text-[13px] font-bold flex items-center justify-center">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          <UserIcon size={19} />
        )}
      </Link>
    </div>
  );
}
