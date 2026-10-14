'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User as UserIcon } from 'lucide-react';
import { GUEST_MENU_ITEMS } from './accountTypes';
import HubGroup from './HubGroup';
import HubRow from './HubRow';

export default function GuestAccountHub() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="w-full">
      {/* Edge-to-edge Header — mobile only. PublicNav (in the shared
          account layout) already has its own back-to-browsing affordance
          and profile icon on md+, so this second back+title bar was pure
          redundant chrome on tablet/desktop. */}
      <div className="md:hidden -mx-4 sm:-mx-6 -mt-4 bg-surface px-2 sm:px-4 h-[52px] sm:h-[56px] flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="btn-icon-mobile text-ink-muted hover:text-ink touch-target-48"
        >
          <ChevronLeft size={24} />
        </button>
        <span className="mobile-h4 text-ink">My Profile</span>
        <div className="w-12 h-12" aria-hidden="true" />
      </div>

      {/* Guest Welcome Card */}
      <div className="card-soft mb-4 px-6 py-8 text-center">
        <UserIcon size={28} className="mx-auto mb-3 text-ink-faint" />
        <h2 className="mobile-h4 text-ink">You&apos;re browsing as a guest</h2>
        <p className="mobile-body-sm mx-auto mt-1 max-w-xs text-ink-muted">
          Log in or sign up to book appointments, place orders, and track your garment.
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link href="/login" className="flex h-12 max-w-[140px] flex-1 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition-opacity active:opacity-80">
            Log In
          </Link>
          <Link href="/register" className="flex h-12 max-w-[140px] flex-1 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-ink transition-opacity active:opacity-70">
            Sign Up
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
