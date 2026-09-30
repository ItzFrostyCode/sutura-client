import React from 'react';
import Link from 'next/link';
import { MapPinned, ArrowRight } from 'lucide-react';

// Store-level lat/long was never actually read by the customer map — each
// branch's own coordinates are what places a pin, set on the Branches page.
// Rather than keep an editable field here that silently does nothing,
// this just points the owner to where map location is really managed.
export default function MapLocationInfoCard() {
  return (
    <div className="bg-surface border border-line p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <MapPinned size={16} className="text-taupe shrink-0" />
        <p className="text-sm text-ink-body">
          Your pin on the customer map comes from each branch&apos;s own location, not a store-wide setting.
        </p>
      </div>
      <Link
        href="/dashboard/branches"
        className="shrink-0 inline-flex items-center gap-1.5 min-h-[40px] px-3.5 text-xs font-semibold text-taupe hover:bg-sunken bg-canvas border border-line transition-colors"
      >
        Manage Branches <ArrowRight size={13} />
      </Link>
    </div>
  );
}
