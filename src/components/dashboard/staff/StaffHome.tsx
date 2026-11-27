'use client';

import React from 'react';
import StaffMetricCards from './StaffMetricCards';
import StaffQueue from './StaffQueue';
import StaffFittings from './StaffFittings';
import { useStaffOverview } from './useStaffOverview';

// A plain staff member's Home: shop-floor numbers and their queue — no owner financials.
export default function StaffHome({ storeId, name }: Readonly<{ storeId?: number; name?: string }>) {
  const { data, loading, failed } = useStaffOverview(storeId);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mobile-h2 font-semibold text-ink">Welcome back{name ? `, ${name}` : ''}</h2>
        <p className="mobile-body-sm text-ink-muted mt-1">Here is what is on the floor today.</p>
      </div>
      {loading && <p className="text-sm text-ink-muted animate-pulse">Loading your day…</p>}
      {failed && !data && <p className="text-sm text-rose-700">Could not load your overview. Pull to refresh or try again.</p>}
      {data && (
        <>
          <StaffMetricCards data={data} />
          <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-4">
            <StaffQueue jobs={data.queue} />
            <StaffFittings fittings={data.fittings} />
          </div>
        </>
      )}
    </div>
  );
}
