'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Package } from 'lucide-react';
import { useTrackOrderLink } from '@/components/shared/publicNav/useTrackOrderLink';
import TrackCodeForm from '@/components/track/TrackCodeForm';
import { useTrackLookup } from '@/components/track/useTrackLookup';

/**
 * Thesis objective "Order Tracking: customers monitor their order progress from placement to pickup" — the system's
 * title feature — on Discover itself. The code is checked HERE first (same rules as /track, useTrackLookup): an empty
 * or wrong code stays on this card with a message to enter the right one; a code that finds an order clears this box
 * and opens /track?code=…, which shows the code in its box and the order's stage under it.
 */
export default function HomeTrackStrip() {
  const router = useRouter();
  const track = useTrackOrderLink();
  const lookup = useTrackLookup();

  const submit = async () => {
    const found = await lookup.check();
    if (!found) return;
    lookup.setCode('');
    router.push(`/track?code=${encodeURIComponent(found.code)}`);
  };

  return (
    <section aria-labelledby="home-track-title" className="card-soft p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sunken text-taupe-dark" aria-hidden>
          <Package size={22} />
        </span>
        <div className="min-w-0">
          <h2 id="home-track-title" className="mobile-h3 sm:tablet-h3 text-ink">Track your order</h2>
          <p className="mobile-body-sm mt-1 text-ink-muted">Enter the code from your shop to see your garment&rsquo;s stage, from cutting to pickup.</p>
        </div>
      </div>
      <div className="mt-4">
        <TrackCodeForm id="home-track-code" code={lookup.code} onCodeChange={lookup.onCodeChange} error={lookup.error} checking={lookup.checking} onSubmit={submit} />
      </div>
      {track.href !== '/track' && (
        <Link href={track.href} className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-taupe-dark hover:underline">
          {track.isCustomer ? 'See all my orders' : 'Open the job orders'} <ChevronRight size={16} aria-hidden />
        </Link>
      )}
    </section>
  );
}
