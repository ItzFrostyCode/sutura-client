import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import type { PublicTrack } from './useTrackLookup';

/**
 * What the public tracker may show (DSD-02 WF-8): the stage and the day it last changed. Price, payments and fittings
 * stay in the customer's own account after signing in.
 */
export default function TrackResultCard({ code, order }: { readonly code: string; readonly order: PublicTrack }) {
  const updated = order.updated_on ? new Date(`${order.updated_on}T00:00:00`).toLocaleDateString('en-PH', { dateStyle: 'long' }) : null;

  return (
    <section aria-live="polite" aria-labelledby="track-result-stage" className="card-soft p-5 sm:p-8">
      <p className="mobile-overline text-ink-muted">Order {code} is now</p>
      <h2 id="track-result-stage" className="mobile-h1 sm:tablet-h1 mt-2 flex items-center gap-3 text-ink">
        <PackageCheck size={28} className="shrink-0 text-taupe-dark" aria-hidden /> {order.stage}
      </h2>
      {updated && <p className="mobile-body-md mt-3 text-ink-muted">Last updated {updated}</p>}
      <p className="mobile-body-sm mt-6 border-t border-line pt-4 text-ink-muted">
        For the price, payments and fitting schedule, <Link href="/login" className="font-medium text-ink underline">sign in</Link> to your account.
      </p>
    </section>
  );
}
