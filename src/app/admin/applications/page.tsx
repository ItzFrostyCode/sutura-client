'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import { formatDate, useAdminList, useDebounced } from '@/components/admin/useAdminList';

interface ApplicationRow {
  id: number;
  name: string;
  city: string;
  created_at: string;
  updated_at: string;
  rejection_reason: string | null;
  owner: { name: string; email: string; contact_email: string | null } | null;
  application: { billing_cycle: string; requested_plan: { name: string } | null } | null;
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
  const query = useDebounced(search);
  const { items, meta, raw, loading, error } = useAdminList<ApplicationRow>('/admin/store-applications', { status, search: query, page });
  const counts = (raw.counts ?? {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      <PageHeader title="Shop Applications" description="Verify each shop's documents and payment before it goes live.">
        <FilterTabs options={STATUSES.map((s) => ({ ...s, count: counts[s.value] ?? 0 }))} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      </PageHeader>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search shop or owner email" />
      </div>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText={status === 'pending' ? 'No shops are waiting for review.' : `No ${status} applications.`} />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((row) => (
              <li key={row.id}>
                <Link href={`/admin/applications/${row.id}`} className="grid min-h-16 grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 hover:bg-canvas sm:grid-cols-[2fr_1fr_1fr_auto]">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{row.name}</p>
                    <p className="truncate text-sm text-ink-muted">{row.owner?.name} · {row.owner?.contact_email ?? row.owner?.email}</p>
                    {status === 'rejected' && row.rejection_reason && <p className="mt-1 truncate text-sm text-danger">{row.rejection_reason}</p>}
                  </div>
                  <p className="hidden text-sm text-ink-body sm:block">
                    {row.application?.requested_plan?.name ?? '—'}
                    {row.application && <span className="text-ink-muted"> · {row.application.billing_cycle}</span>}
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
        <Pager meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
