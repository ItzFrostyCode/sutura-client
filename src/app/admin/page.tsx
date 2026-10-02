'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Pending applications" value={pending} hint={pending ? 'Waiting for your review' : 'All caught up'} />
            <Link href="/admin/branches" className="block hover:bg-canvas">
              <StatCard label="Branches to check" value={data.pending_branches} hint={data.pending_branches ? 'Pins waiting for verification' : 'All caught up'} />
            </Link>
            <StatCard label="Live stores" value={data.stores.approved ?? 0} hint={`${data.stores.rejected ?? 0} rejected`} />
            <StatCard label="Active subscriptions" value={data.active_subscriptions} />
            <StatCard label="Accounts" value={data.users.total} hint={`${data.users.customers} customers · ${data.users.store_owners} owners`} />
          </div>

          <section className="border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="tablet-h3 text-ink">Review queue</h2>
              <Link href="/admin/applications" className="inline-flex min-h-11 items-center gap-1 text-sm text-ink underline underline-offset-2">
                All applications <ArrowRight size={14} />
              </Link>
            </div>
            {data.recent_applications.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-muted">No shops are waiting for review.</p>
            ) : (
              <ul className="divide-y divide-line">
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
