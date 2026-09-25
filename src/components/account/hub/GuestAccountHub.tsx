'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { GUEST_MENU_ITEMS } from './accountTypes';

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
      <div className="md:hidden -mx-4 sm:-mx-6 -mt-4 bg-surface border-b border-line px-2 sm:px-4 h-[52px] sm:h-[56px] flex items-center justify-between mb-4">
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
      <div className="bg-surface border border-line p-6 mb-4 text-center">
        <div className="w-12 h-12 rounded-full bg-sunken flex items-center justify-center mx-auto mb-3">
          <UserIcon size={24} className="text-ink-faint" />
        </div>
        <h2 className="mobile-h3 font-semibold text-ink mb-1">You&apos;re browsing as a guest</h2>
        <p className="mobile-body-sm font-normal text-ink-muted mb-6 max-w-xs mx-auto space-headline-para">
          Log in or sign up to book appointments, place orders, and track your garment.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/login"
            className="btn-primary-mobile bg-taupe hover:bg-taupe-hover text-white flex-1 max-w-[140px]"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="btn-secondary-mobile border border-line bg-surface text-ink hover:bg-sunken flex-1 max-w-[140px]"
          >
            Sign Up
          </Link>
        </div>
      </div>

      {/* Guest Navigation Rows */}
      <div className="bg-surface border border-line overflow-hidden divide-y divide-line">
        {GUEST_MENU_ITEMS.map(({ label, Icon }) => (
          <Link
            key={label}
            href="/login"
            className="mobile-nav-row flex items-center gap-3.5 px-4 hover:bg-canvas transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-sunken flex items-center justify-center shrink-0">
              <Icon size={18} className="text-taupe" />
            </div>
            <p className="flex-1 text-base font-normal text-ink">{label}</p>
            <ChevronRight size={18} className="text-ink-faint shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
