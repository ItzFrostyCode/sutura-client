'use client';

import Link from 'next/link';
import { User as UserIcon } from 'lucide-react';
import { GUEST_MENU_ITEMS } from './accountTypes';
import HubGroup from './HubGroup';
import HubRow from './HubRow';

export default function GuestAccountHub() {

  return (
    <div className="w-full">
      {/* Profile is a main tab (bottom bar), so there is nothing to go back to: a plain title, no Back button. */}
      <h1 className="mobile-h1 mb-4 text-ink">My Profile</h1>

      {/* Guest Welcome Card */}
      <div className="card-soft mb-4 px-6 py-8 text-center">
        <UserIcon size={28} className="mx-auto mb-3 text-ink-faint" />
        <h2 className="mobile-h4 text-ink">You&apos;re browsing as a guest</h2>
        <p className="mobile-body-sm mx-auto mt-1 max-w-xs text-ink-muted">
          Sign in or create an account to book appointments, place orders, and track your garment.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link href="/login" className="flex h-12 max-w-[140px] flex-1 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-opacity active:opacity-80">
            Sign In
          </Link>
          <Link href="/register" className="flex h-12 max-w-[140px] flex-1 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-ink transition-opacity active:opacity-70">
            Create Account
          </Link>
        </div>
      </div>

      {/* Guest Navigation Rows — every one asks to log in */}
      <HubGroup>
        {GUEST_MENU_ITEMS.map(({ label, Icon }) => (
          <HubRow key={label} href="/login" Icon={Icon} title={label} />
        ))}
      </HubGroup>
    </div>
  );
}
