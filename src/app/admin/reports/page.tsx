'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import PageHeader from '@/components/shared/PageHeader';
import { ListState } from '@/components/admin/ui/AdminPrimitives';
import SubscriptionActivityReport, { type SubscriptionReport } from '@/components/admin/reports/SubscriptionActivityReport';
import ShopRevenueReport, { type RevenueReport } from '@/components/admin/reports/ShopRevenueReport';
import { PERIODS, type ReportRange } from '@/components/admin/reports/reportUi';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time

// Thesis objective: the admin's real-time visual reports on subscription
// activity, monthly sales revenue, outstanding customer balances and
// individual shop productivity — all on one page, one period selector
// (the last 3/6/12 months, or a custom date range).
export default function AdminReportsPage() {
  const [range, setRange] = useState<ReportRange>({ months: 6 });
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [subscriptions, setSubscriptions] = useState<SubscriptionReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [error, setError] = useState('');

  // A custom range applies once both ends are picked and in order.
  useEffect(() => {
    if (from && to && from <= to) setRange({ from, to });
  }, [from, to]);

  const params = 'months' in range ? { months: range.months } : { from: range.from, to: range.to };
  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([
      adminApi.get('/admin/reports/subscriptions', { params }),
      adminApi.get('/admin/reports/revenue', { params }),
    ])
      .then(([subs, rev]) => {
        if (cancelled) return;
        setSubscriptions(subs.data.data);
        setRevenue(rev.data.data);
      })
      .catch(() => { if (!cancelled) setError('Could not load the reports.'); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const pickMonths = (months: (typeof PERIODS)[number]) => {
    setFrom('');
    setTo('');
    setRange({ months });
  };
  const custom = !('months' in range);
  const dateInput = 'h-9 min-w-0 bg-transparent text-sm tabular-nums text-[#1E1A17] focus:outline-none';

  return (
    <div className="space-y-10">
      <PageHeader
        title="Reports"
        description="Subscription activity and shop revenue across the platform."
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <div className="admin-field flex p-1 shadow-2xs" role="group" aria-label="Report period">
              {PERIODS.map((p) => {
                const on = 'months' in range && range.months === p;
                return (
                  <button key={p} type="button" aria-pressed={on} onClick={() => pickMonths(p)}
                    className={`min-h-9 rounded-lg px-3.5 text-sm transition-colors ${on ? 'bg-ink font-semibold text-white' : 'text-[#4A423C] hover:bg-sunken'}`}>
                    {p} months
                  </button>
                );
              })}
            </div>
            <div
              className={`admin-field flex items-center gap-1.5 px-3 shadow-2xs ${custom ? 'border-ink!' : ''}`}
              role="group"
              aria-label="Custom date range"
            >
              <input type="date" aria-label="Start date" value={from} max={to || today()} onChange={(e) => setFrom(e.target.value)} className={dateInput} />
              <span className="text-[#A8A19A]" aria-hidden="true">–</span>
              <input type="date" aria-label="End date" value={to} min={from || undefined} max={today()} onChange={(e) => setTo(e.target.value)} className={dateInput} />
              {(from || to) && (
                <button type="button" onClick={() => pickMonths(6)} aria-label="Clear date range" className="flex h-7 w-7 items-center justify-center rounded-md text-[#6E655F] hover:bg-sunken hover:text-ink">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      />

      {!subscriptions || !revenue ? (
        <ListState loading={!error} error={error} empty={false} emptyText="" />
      ) : (
        <>
          <SubscriptionActivityReport report={subscriptions} range={range} />
          <ShopRevenueReport report={revenue} range={range} />
        </>
      )}
    </div>
  );
}
