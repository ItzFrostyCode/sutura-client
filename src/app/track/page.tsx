'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { HOME_COLUMN } from '@/components/home/homeLayout';
import TrackCodeForm from '@/components/track/TrackCodeForm';
import TrackResultCard from '@/components/track/TrackResultCard';
import { normalizeTrackingCode, useTrackLookup, type TrackFound } from '@/components/track/useTrackLookup';

/**
 * Track Order. `/track?code=…` (what Discover's "Track your order" opens after the code checks out) shows the code in
 * the box and the order under it; the box works the same way here (useTrackLookup): empty or wrong code → message
 * under the box, the previous result is cleared; right code → the result, and the address bar updates so the page
 * can be shared or reloaded.
 */
function TrackPageInner() {
  const router = useRouter();
  const param = normalizeTrackingCode(useSearchParams().get('code') ?? '');
  const { user, isAuthenticated, hydrated } = useAuthStore();
  const lookup = useTrackLookup(param);
  const [result, setResult] = useState<TrackFound | null>(null);
  const shown = useRef('');

  // A code in the address (from Discover, a reload, or a shared link): check it once and show the answer.
  const { check, setCode } = lookup;
  useEffect(() => {
    if (!param || param === shown.current) return;
    shown.current = param;
    setCode(param);
    void check(param).then(setResult);
  }, [param, check, setCode]);

  const submit = async () => {
    setResult(null);
    const found = await lookup.check();
    if (!found) return;
    shown.current = found.code;
    setResult(found);
    router.replace(`/track?code=${encodeURIComponent(found.code)}`, { scroll: false });
  };

  const isCustomer = user?.roles?.some((r) => r.name === 'customer') ?? false;

  return (
    <main className={`${HOME_COLUMN} flex-1 space-y-6 py-6 sm:py-10`}>
      <section aria-labelledby="track-title" className="card-soft p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunken text-taupe-dark" aria-hidden>
            <Package size={22} />
          </span>
          <div className="min-w-0">
            <h1 id="track-title" className="mobile-h1 sm:tablet-h1 text-ink">Track your order</h1>
            <p className="mobile-body-md mt-1 text-ink-muted">Enter the tracking code from your shop to see your garment&rsquo;s stage, from cutting to pickup.</p>
          </div>
        </div>
        <div className="mt-5">
          <TrackCodeForm id="track-code" code={lookup.code} onCodeChange={lookup.onCodeChange} error={lookup.error} checking={lookup.checking} onSubmit={submit} />
        </div>
        {hydrated && isAuthenticated && user && (
          <Link href={isCustomer ? '/account/orders' : '/dashboard/jobs'} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-taupe-dark hover:underline">
            {isCustomer ? 'See all my orders' : 'Open the job orders'} <ChevronRight size={16} aria-hidden />
          </Link>
        )}
      </section>

      {result && <TrackResultCard code={result.code} order={result.order} />}
    </main>
  );
}

export default function TrackLandingPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      {/* useSearchParams needs a Suspense boundary (Next 16 build rule). */}
      <Suspense fallback={<main className="flex-1" />}>
        <TrackPageInner />
      </Suspense>
    </div>
  );
}
