'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import PublicNav from '@/components/shared/PublicNav';

export default function TrackLandingPage() {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const [code, setCode] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  const isCustomer = user?.roles?.some((r) => r.name === 'customer') ?? false;

  return (
    <div className="min-h-dvh flex flex-col bg-canvas">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center mobile-screen-margins py-10 sm:py-16">
        <div className="w-full max-w-sm sm:max-w-md text-center">
          <div className="w-14 h-14 border border-line flex items-center justify-center mx-auto mb-4">
            <Package size={24} className="text-taupe" />
          </div>
          <h1 className="mobile-h1 sm:tablet-h1 text-ink mb-2">Track Your Order</h1>
          <p className="mobile-body-md sm:tablet-body-md text-ink-muted mb-8 space-headline-para">
            Enter the tracking code given to you at the store counter to check your garment&apos;s progress.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. TNED8K2P"
              className="w-full form-input-mobile bg-surface border border-line text-base text-ink placeholder:text-ink-faint placeholder:text-base placeholder:font-normal text-center tracking-widest font-normal uppercase focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors shadow-none"
              maxLength={12}
            />
            <button
              type="submit"
              disabled={!code.trim()}
              className="btn-primary-mobile w-full bg-taupe hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold shadow-none"
            >
              Track Order
            </button>
          </form>

          {hydrated && isAuthenticated && user && (
            <div className="mt-8 pt-6 border-t border-line text-center">
              <p className="mobile-caption text-ink-muted mb-2 font-normal">
                Logged in as <span className="font-semibold text-ink">{user.name}</span>?
              </p>
              <Link
                href={isCustomer ? '/account/orders' : '/dashboard/jobs'}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-taupe hover:text-taupe-hover transition-colors"
              >
                {isCustomer ? 'View all your Job Orders in My Orders →' : 'View Store Job Orders →'}
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

