'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import adminApi from '@/lib/adminApi';
import PageHeader from '@/components/shared/PageHeader';
import { ListState, StatCard } from '@/components/admin/ui/AdminPrimitives';
import SubscriptionReportPanel from '@/components/admin/SubscriptionReportPanel';
import { formatDate } from '@/components/admin/useAdminList';
import PlanPill, { PILL, PLAN_TEXT } from '@/components/admin/ui/PlanPill';

interface Overview {
  users: { total: number; customers: number; store_owners: number; suspended: number };
  stores: Record<string, number>;
  active_subscriptions: number;
  open_tickets: number;
  pending_branches: number;
  pending_apparel_types: number;
  recent_applications: { id: number; name: string; city: string; created_at: string; owner: { name: string; email: string; contact_email: string | null } | null }[];
  expiring_subscriptions: ExpiringShop[];
  expiring_subscriptions_count: number;
}

interface ExpiringShop {
  id: number;
  name: string;
  owner: { name: string; email: string } | null;
  plan: string | null;
  status: 'active' | 'trial';
  ends_at: string;
  days_left: number;
}

// Overview numbers in the plan badges' hues (PLAN_TEXT): amber = waiting on you
// (stone once it's 0, all caught up), blue = platform health, stone = plain totals.
const todoTone = (n: number) => (n > 0 ? PLAN_TEXT.premium : PLAN_TEXT.basic);

const daysLeftText = (d: number) => (d <= 0 ? 'Expires today' : d === 1 ? 'Expires tomorrow' : `Expires in ${d} days`);

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
            <StatCard label="Pending applications" value={pending} valueTone={todoTone(pending)} hint={pending ? 'Waiting for your review' : 'All caught up'} />
            <Link href="/admin/branches" className="block h-full hover:bg-canvas">
              <StatCard label="Branches to check" value={data.pending_branches} valueTone={todoTone(data.pending_branches)} hint={data.pending_branches ? 'Pins waiting for verification' : 'All caught up'} />
            </Link>
            <Link href="/admin/apparel" className="block h-full hover:bg-canvas">
              <StatCard label="Apparel to review" value={data.pending_apparel_types} valueTone={todoTone(data.pending_apparel_types)} hint={data.pending_apparel_types ? 'Typed-in names waiting' : 'All caught up'} />
            </Link>
            <StatCard label="Live shops" value={data.stores.approved ?? 0} valueTone={PLAN_TEXT.pro} hint={`${data.stores.rejected ?? 0} rejected`} />
            {/* Counts trials too (DashboardController::activeSubscriptions). */}
            <StatCard label="Active subscriptions" value={data.active_subscriptions} valueTone={PLAN_TEXT.pro} hint="Paid or on trial" />
            <StatCard label="Accounts" value={data.users.total} valueTone={PLAN_TEXT.basic} hint={`${data.users.customers} customers · ${data.users.store_owners} owners`} />
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

          <section className="admin-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h2 className="tablet-h3 text-ink">Expiring soon</h2>
                <p className="text-sm text-ink-muted">
                  Subscriptions ending within 7 days
                  {data.expiring_subscriptions_count > 0 && <> · <span className="tabular-nums">{data.expiring_subscriptions_count}</span> {data.expiring_subscriptions_count === 1 ? 'shop' : 'shops'}</>}
                </p>
              </div>
              <Link href="/admin/stores" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm text-ink underline underline-offset-2">
                All shops <ArrowRight size={14} />
              </Link>
            </div>
            {data.expiring_subscriptions.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-ink-muted">No subscriptions end in the next 7 days.</p>
            ) : (
              <ul className="admin-divide">
                {data.expiring_subscriptions.map((s) => (
                  <li key={s.id}>
                    {/* Opens the Shops list searched to this shop (all tabs), like Reports' "See in Shops". */}
                    <Link href={`/admin/stores?search=${encodeURIComponent(s.name)}`} className="flex min-h-16 items-center gap-4 px-5 py-3 hover:bg-canvas">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold text-ink">{s.name}</p>
                          <PlanPill plan={s.plan} />
                          {s.status === 'trial' && <span className={`${PILL} border-orange-200 bg-orange-50 text-orange-700`}>Trial</span>}
                        </div>
                        <p className="truncate text-sm text-ink-muted">{s.owner ? `${s.owner.name} · ${s.owner.email}` : 'No owner on file'}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-sm font-semibold ${s.days_left <= 2 ? 'text-danger' : 'text-ink'}`}>{daysLeftText(s.days_left)}</p>
                        <p className="text-sm tabular-nums text-ink-muted">{formatDate(s.ends_at)}</p>
                      </div>
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
