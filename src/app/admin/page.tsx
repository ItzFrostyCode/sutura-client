'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import PageHeader from '@/components/shared/PageHeader';
import { ListState, StatCard } from '@/components/admin/ui/AdminPrimitives';
import SubscriptionReportPanel from '@/components/admin/SubscriptionReportPanel';
import { formatDate } from '@/components/admin/useAdminList';

interface Overview {
  users: { total: number; customers: number; store_owners: number; suspended: number };
  stores: Record<string, number>;
  active_subscriptions: number;
  open_tickets: number;
  pending_branches: number;
  pending_apparel_types: number;
  expiring_soon?: { id: number; store_id: number; store_name: string; store_slug: string; owner_name: string; owner_email: string; plan_name: string; ends_at: string; days_left: number }[];
  recent_applications: { id: number; name: string; city: string; created_at: string; owner: { name: string; email: string; contact_email: string | null } | null }[];
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get('/admin/dashboard').then((res) => setData(res.data.data)).catch(() => setError('Could not load the overview.'));
  }, []);

  const pending = data?.stores.pending ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="Platform health at a glance." />

      {!data ? <ListState loading={!error} error={error} empty={false} emptyText="" /> : (
        <>
          {/* 2 columns on phones, 3 on tablets, 6 on desktop; cards stretch to one height per row. */}
          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Pending applications" value={pending} hint={pending ? 'Waiting for your review' : 'All caught up'} />
            <Link href="/admin/branches" className="block h-full hover:bg-canvas">
              <StatCard label="Branches to check" value={data.pending_branches} hint={data.pending_branches ? 'Pins waiting for verification' : 'All caught up'} />
            </Link>
            <Link href="/admin/apparel" className="block h-full hover:bg-canvas">
              <StatCard label="Apparel to review" value={data.pending_apparel_types} hint={data.pending_apparel_types ? 'Typed-in names waiting' : 'All caught up'} />
            </Link>
            <StatCard label="Live shops" value={data.stores.approved ?? 0} hint={`${data.stores.rejected ?? 0} rejected`} />
            {/* Counts trials too (DashboardController::activeSubscriptions). */}
            <StatCard label="Active subscriptions" value={data.active_subscriptions} hint="Paid or on trial" />
            <StatCard label="Accounts" value={data.users.total} hint={`${data.users.customers} customers · ${data.users.store_owners} owners`} />
          </div>

          <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="tablet-h3 text-ink">Review queue</h2>
              <Link href="/admin/applications" className="inline-flex min-h-11 items-center gap-1 text-sm text-ink underline underline-offset-2">
                All applications <ArrowRight size={14} />
              </Link>
            </div>
            {data.recent_applications.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-muted">No shops are waiting for review.</p>
            ) : (
              <ul className="admin-divide">
                {data.recent_applications.map((app) => (
                  <li key={app.id}>
                    <Link href={`/admin/applications/${app.id}`} className="flex min-h-16 items-center gap-4 px-5 py-3 hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-ink">{app.name}</p>
                        <p className="truncate text-sm text-ink-muted">{app.owner?.name} · {app.owner?.contact_email ?? app.owner?.email}</p>
                      </div>
                      <span className="hidden shrink-0 text-sm text-ink-muted sm:block">Applied {formatDate(app.created_at)}</span>
                      <ArrowRight size={16} className="shrink-0 text-ink-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Subscriptions Expiring Soon (Within 3 Days) */}
          <section className="border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-600" />
                <h2 className="tablet-h3 text-ink">Subscriptions Expiring in 3 Days</h2>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {data.expiring_soon?.length ?? 0} shop{(data.expiring_soon?.length ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
            {!data.expiring_soon || data.expiring_soon.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-muted">No shop subscriptions expiring within the next 3 days.</p>
            ) : (
              <ul className="divide-y divide-line">
                {data.expiring_soon.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-canvas">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        {item.store_name} <span className="text-xs font-normal text-ink-muted">({item.plan_name})</span>
                      </p>
                      <p className="text-sm text-ink-muted">{item.owner_name} · {item.owner_email}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                        {item.days_left === 0 ? 'Expires today' : `${item.days_left} day${item.days_left === 1 ? '' : 's'} left`}
                      </span>
                      <p className="mt-0.5 text-xs text-ink-muted">Ends {formatDate(item.ends_at)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-sm text-ink-muted">
            {data.open_tickets} open support {data.open_tickets === 1 ? 'ticket' : 'tickets'} ·{' '}
            {data.users.suspended} suspended {data.users.suspended === 1 ? 'account' : 'accounts'}
          </p>

          <SubscriptionReportPanel />
        </>
      )}
    </div>
  );
}
