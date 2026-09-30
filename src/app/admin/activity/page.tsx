'use client';

import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import { formatDate, useAdminList, useDebounced } from '@/components/admin/useAdminList';

interface AuditRow {
  id: number;
  action: string;
  created_at: string;
  ip_address: string | null;
  payload: { name?: string; reason?: string | null; description?: string } | null;
  user: { name: string; email: string } | null;
  store: { name: string } | null;
}

const SCOPES = [
  { value: '', label: 'Everything' },
  { value: 'admin', label: 'Admin actions' },
  { value: 'stores', label: 'Shop activity' },
];

const humanize = (action: string) => action.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

// sutura2's Audit Log view, across every store plus admin-only events
// (sign-ins, application decisions, suspensions) that have no store.
export default function AdminActivityPage() {
  const [scope, setScope] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const query = useDebounced(search);
  const { items, meta, loading, error } = useAdminList<AuditRow>('/admin/audit-logs', { scope, search: query, from, to, page });
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="Who did what, across the whole platform.">
        <FilterTabs options={SCOPES} value={scope} onChange={resetPage(setScope)} />
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchInput value={search} onChange={resetPage(setSearch)} placeholder="Search action, person, or shop" className="sm:max-w-sm" />
        <label className="text-sm text-ink-muted">From
          <input type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} className="mt-1 block min-h-11 border border-line-strong bg-surface px-3 text-base text-ink" />
        </label>
        <label className="text-sm text-ink-muted">To
          <input type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} className="mt-1 block min-h-11 border border-line-strong bg-surface px-3 text-base text-ink" />
        </label>
      </div>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No activity matches." />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((row) => (
              <li key={row.id} className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3">
                <div className="min-w-0 flex-1 basis-72">
                  <p className="font-semibold text-ink">{humanize(row.action)}{row.payload?.name && <span className="font-normal text-ink-body"> — {row.payload.name}</span>}</p>
                  {row.payload?.reason && <p className="mt-0.5 text-sm text-ink-body">Reason: {row.payload.reason}</p>}
                  <p className="mt-0.5 truncate text-sm text-ink-muted">
                    {row.user?.name ?? 'System'}{row.store && ` · ${row.store.name}`}{row.ip_address && ` · ${row.ip_address}`}
                  </p>
                </div>
                <time dateTime={row.created_at} className="shrink-0 text-sm text-ink-muted">{formatDate(row.created_at, true)}</time>
              </li>
            ))}
          </ul>
        )}
        <Pager meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
