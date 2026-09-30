'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Pencil } from 'lucide-react';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';

interface StoreOwnerTopBarProps {
  /** Full store_owner only — a branch manager/staff also lands here via
   * isShopView but can't edit the store's own profile. */
  readonly canEditProfile: boolean;
  readonly onEditProfile: () => void;
}

// Shown instead of PublicNav whenever the owner, a branch manager, or staff
// is looking at their own Store Profile page — Dashboard + Edit used to
// live buried inside the scrolling hero section and disappeared the moment
// you scrolled past it. Pinned here (sticky, same shell as PublicNav) so
// they're always reachable, with the same notification bell + account menu
// the rest of the app already uses.
export default function StoreOwnerTopBar({ canEditProfile, onEditProfile }: StoreOwnerTopBarProps) {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 bg-surface border-b border-line text-ink">
      <div className="h-[52px] sm:h-[64px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-4 flex items-center gap-1.5 bg-ink hover:bg-black text-white text-xs sm:text-sm font-semibold transition-colors"
          >
            <LayoutDashboard size={15} />
            <span>Dashboard</span>
          </Link>
          {canEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              className="min-h-[40px] sm:min-h-[44px] px-3.5 sm:px-4 flex items-center gap-1.5 bg-sunken hover:bg-line border border-line text-ink text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Pencil size={14} />
              <span>Edit</span>
            </button>
          )}
        </div>

        <AccountHeaderMenu />
      </div>
    </header>
  );
}
