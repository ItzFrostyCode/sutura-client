'use client';

import React from 'react';
import { StoreSettings } from '../types';

interface BookingStep1PolicyProps {
  readonly storeSettings: StoreSettings | null;
}

export default function BookingStep1Policy({ storeSettings }: BookingStep1PolicyProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-sm font-bold text-ink">Service Details & Policy</h2>

      <div className="prose prose-invert max-w-none text-xs text-ink-body bg-surface border border-line p-4 rounded-xl leading-relaxed">
        {storeSettings?.booking_policy ? (
          <div className="whitespace-pre-wrap">{storeSettings.booking_policy}</div>
        ) : (
          <p className="italic text-ink-faint">
            No specific booking policy provided by this store. Walk-in consultations and fittings are welcome during operating hours.
          </p>
        )}
      </div>
    </div>
  );
}
