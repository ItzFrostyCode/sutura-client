'use client';

import React from 'react';
import AccountHeaderMenu from '@/components/AccountHeaderMenu';

// Shown instead of PublicNav whenever the owner, a branch manager, or staff
// is looking at their own Store Profile page: just the notification bell +
// account menu the rest of the app uses. Dashboard / Edit live once, in the
// hero under the store name (StoreHeroHeader) — repeating them up here
// showed the same two buttons twice on one screen.
export default function StoreOwnerTopBar() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 bg-surface border-b border-line text-ink">
      <div className="h-[52px] sm:h-[64px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-end gap-3">
        <AccountHeaderMenu />
      </div>
    </header>
  );
}
