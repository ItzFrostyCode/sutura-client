'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import Badge from '@/components/shared/Badge';
import adminApi from '@/lib/adminApi';
import { FilterTabs, ListState } from '@/components/admin/ui/AdminPrimitives';
import { formatDate } from '@/components/admin/useAdminList';
import { formatPeso } from '@/components/store-application/applicationTypes';

interface PlanStore {
  id: number;
  store: { id: number; name: string; slug: string; city: string | null } | null;
  owner: { name: string; email: string } | null;
  status: 'active' | 'trial';
  billing_cycle: 'monthly' | 'yearly' | null;
  starts_at: string | null;
  ends_at: string | null;
  days_left: number | null;
}

interface PlanStoresData {
  plan: { id: number; name: string; price_monthly: string; price_yearly: string };
  counts: { all: number; monthly: number; yearly: number; trial: number };
  stores: PlanStore[];
}

type Cycle = 'all' | 'monthly' | 'yearly';

const CYCLE_LABEL = { monthly: 'Monthly', yearly: 'Yearly' } as const;

// Opened from Reports → "Live stores by plan": who is on this plan right now,
// split by how they pay. Trials have no cycle yet, so they only show under All.
export default function PlanStoresModal({ plan, onClose }: { readonly plan: { id: number; plan: string } | null; readonly onClose: () => void }) {
  const [cycle, setCycle] = useState<Cycle>('all');
  const [data, setData] = useState<PlanStoresData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setCycle('all'); }, [plan?.id]);

  useEffect(() => {
    if (!plan) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    adminApi.get(`/admin/reports/subscriptions/plans/${plan.id}/stores`, { params: { cycle } })
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch(() => { if (!cancelled) setError('Could not load the stores on this plan.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [plan, cycle]);

  // Ignore the previous plan's data while a newly opened plan is loading.
  const current = data && data.plan.id === plan?.id ? data : null;
  const counts = current?.counts;
  const stores = current?.stores ?? [];
  const tabs = [
    { value: 'all', label: 'All', count: counts?.all },
    { value: 'monthly', label: 'Monthly', count: counts?.monthly },
    { value: 'yearly', label: 'Yearly', count: counts?.yearly },
  ];
  const emptyText = cycle === 'all' ? 'No live stores on this plan.' : `No stores pay ${cycle === 'monthly' ? 'monthly' : 'yearly'} for this plan.`;

  return (
    <Modal isOpen={plan !== null} onClose={onClose} title={`${plan?.plan ?? ''} plan — live stores`} maxWidth="max-w-2xl">
      {data && data.plan.id === plan?.id && (
        <p className="-mt-1 mb-3 text-sm text-ink-muted">
          {formatPeso(data.plan.price_monthly)}/mo · {formatPeso(data.plan.price_yearly)}/yr
          {counts && counts.trial > 0 && ` · ${counts.trial} on a free trial (shown under All)`}
        </p>
      )}
      <div className="border-b border-line">
        <FilterTabs options={tabs} value={cycle} onChange={(v) => setCycle(v as Cycle)} />
      </div>

      <ListState loading={loading} error={error} empty={!loading && stores.length === 0} emptyText={emptyText} />
      {!loading && !error && stores.length > 0 && (
        <ul className="divide-y divide-line">
          {stores.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold text-ink">
                  {s.store ? <Link href={`/store/${s.store.slug}`} target="_blank" className="hover:underline">{s.store.name}</Link> : 'Removed store'}
                </p>
                <p className="truncate text-sm text-ink-muted">{[s.owner?.name, s.owner?.email, s.store?.city].filter(Boolean).join(' · ')}</p>
              </div>
              <div className="shrink-0 text-right text-sm">
                <Badge variant={s.status === 'trial' ? 'warning' : 'success'}>
                  {s.status === 'trial' ? 'Free trial' : CYCLE_LABEL[s.billing_cycle ?? 'monthly']}
                </Badge>
                <p className="mt-1 text-ink-muted">
                  {s.status === 'trial' ? 'Trial ends' : 'Renews'} {formatDate(s.ends_at)}
                  {s.days_left !== null && ` · ${s.days_left} ${s.days_left === 1 ? 'day' : 'days'} left`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
