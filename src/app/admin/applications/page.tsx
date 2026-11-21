'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/shared/Badge';
import FreeTrialTag from '@/components/admin/applications/FreeTrialTag';
import SearchInput from '@/components/shared/SearchInput';
import PlanPill from '@/components/admin/ui/PlanPill';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import { formatDate, useAdminList, useDebounced, useStableListHeight } from '@/components/admin/useAdminList';

interface ApplicationRow {
  id: number;
  name: string;
  city: string;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  owner: { name: string; email: string; contact_email: string | null } | null;
  application: {
    billing_cycle: string;
    requested_plan: { name: string } | null;
    review_state: 'changes_requested' | 'resubmitted' | null;
    /** Asked for a 14-day free trial instead of paying. */
    free_trial?: boolean;
  } | null;
}

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  // '' = the tab's default: pending oldest-applied first (the queue), decided newest first.
  const [dir, setDir] = useState<'' | 'asc' | 'desc'>('');
  const query = useDebounced(search);
  const { items, meta, raw, loading, error } = useAdminList<ApplicationRow>('/admin/store-applications', { status, search: query, page, per_page: 5, dir: dir || undefined });
  const effectiveDir = dir || (status === 'pending' ? 'asc' : 'desc');
  const sortLabel = status === 'pending' ? 'Applied' : 'Decided';
  const counts = (raw.counts ?? {}) as Record<string, number>;
  // A shorter last page keeps the list's height, so pressing Next doesn't jump to the top.
  const stable = useStableListHeight<HTMLDivElement>(`${status}|${query}|${dir}`);

  return (
    <div className="space-y-6">
      <PageHeader title="Shop Applications" description="Verify each shop's documents and payment before it goes live.">
        <FilterTabs options={STATUSES.map((s) => ({ ...s, count: counts[s.value] ?? 0 }))} value={status} onChange={(v) => { setStatus(v); setDir(''); setPage(1); }} />
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchInput bold onCanvasBackground value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search shop or owner email" />
        </div>
        <button type="button" onClick={() => { setDir(effectiveDir === 'asc' ? 'desc' : 'asc'); setPage(1); }}
          aria-label={`Sort by ${sortLabel.toLowerCase()} date: ${effectiveDir === 'asc' ? 'oldest first' : 'newest first'}. Click to reverse.`}
          className="inline-flex min-h-11 items-center gap-2 self-start border border-line-strong bg-surface px-4 text-sm text-ink hover:bg-sunken cursor-pointer sm:self-auto">
          <span className="text-eyebrow">{sortLabel}</span>
          {effectiveDir === 'asc' ? <ArrowUp size={14} aria-hidden="true" /> : <ArrowDown size={14} aria-hidden="true" />}
          {effectiveDir === 'asc' ? 'Oldest first' : 'Newest first'}
        </button>
      </div>

      {/* Bolder outline and row rules so each application reads as its own card. */}
      <div className="admin-card overflow-hidden">
        <div ref={stable.ref} style={stable.style}>
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText={status === 'pending' ? 'No shops are waiting for review.' : `No ${status} applications.`} />
        {!loading && !error && items.length > 0 && (
          <ul className="admin-divide">
            {items.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/applications/${row.id}`} className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 hover:bg-canvas sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-ink">{row.name}</span>
                      {row.application?.free_trial && <FreeTrialTag />}
                      {status === 'pending' && row.application?.review_state === 'changes_requested' && <Badge variant="neutral" className="shrink-0">Waiting on owner</Badge>}
                      {status === 'pending' && row.application?.review_state === 'resubmitted' && <Badge variant="warning" className="shrink-0">Updated</Badge>}
                    </p>
                    <p className="truncate text-sm text-ink-muted">{row.owner?.name} · {row.owner?.contact_email ?? row.owner?.email}</p>
                    {status === 'rejected' && row.rejection_reason && <p className="mt-1 truncate text-sm text-danger">{row.rejection_reason}</p>}
                  </div>
                  <p className="hidden items-center gap-1.5 text-sm sm:flex">
                    {row.application?.requested_plan?.name ? <PlanPill plan={row.application.requested_plan.name} /> : <span className="text-ink-muted">—</span>}
                    {row.application && <span className="capitalize text-ink-muted">{row.application.billing_cycle}</span>}
                  </p>
                  <p className="hidden text-sm text-ink-muted sm:block">
                    {status === 'pending' ? `Applied ${formatDate(row.created_at)}` : `Decided ${formatDate(row.updated_at)}`}
                  </p>
                  <ArrowRight size={16} className="text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
        </div>
        <Pager meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
