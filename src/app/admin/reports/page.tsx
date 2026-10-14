'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import PageHeader from '@/components/shared/PageHeader';
import { ListState } from '@/components/admin/ui/AdminPrimitives';
import SubscriptionActivityReport, { type SubscriptionReport } from '@/components/admin/reports/SubscriptionActivityReport';
import ShopRevenueReport, { type RevenueReport } from '@/components/admin/reports/ShopRevenueReport';
import { PERIODS, type Period } from '@/components/admin/reports/reportUi';

// Thesis objective: the admin's real-time visual reports on subscription
// activity, monthly sales revenue, outstanding customer balances and
// individual shop productivity — all on one page, one period selector.
export default function AdminReportsPage() {
  const [period, setPeriod] = useState<Period>(6);
  const [subscriptions, setSubscriptions] = useState<SubscriptionReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([
      adminApi.get('/admin/reports/subscriptions', { params: { months: period } }),
      adminApi.get('/admin/reports/revenue', { params: { months: period } }),
    ])
      .then(([subs, rev]) => {
        if (cancelled) return;
        setSubscriptions(subs.data.data);
        setRevenue(rev.data.data);
      })
      .catch(() => { if (!cancelled) setError('Could not load the reports.'); });
    return () => { cancelled = true; };
  }, [period]);

  return (
    <div className="space-y-10">
      <PageHeader
        title="Reports"
        description="Subscription activity and shop revenue across the platform."
        actions={(
          <div className="flex border border-line" role="group" aria-label="Report period">
            {PERIODS.map((p) => (
              <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}
                className={`min-h-11 px-4 text-sm ${period === p ? 'bg-ink font-semibold text-surface' : 'text-ink-muted hover:text-ink'}`}>
                {p} months
              </button>
            ))}
          </div>
        )}
      />

      {!subscriptions || !revenue ? (
        <ListState loading={!error} error={error} empty={false} emptyText="" />
      ) : (
        <>
          <SubscriptionActivityReport report={subscriptions} period={period} />
          <ShopRevenueReport report={revenue} period={period} />
        </>
      )}
    </div>
  );
}
