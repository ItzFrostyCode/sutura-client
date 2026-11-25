'use client';

import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { PILL } from '@/components/admin/ui/PlanPill';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import { formatDate, useAdminList, useStableListHeight, useDebounced } from '@/components/admin/useAdminList';

type ActorRole = 'admin' | 'store_owner' | 'branch_manager' | 'staff' | 'customer' | 'guest';

interface AuditRow {
  id: number;
  action: string;
  actor_role: ActorRole | null;
  created_at: string;
  ip_address: string | null;
  payload: { name?: string; reason?: string | null; description?: string } | null;
  user: { name: string; email: string } | null;
  store: { name: string } | null;
}

const ROLE_LABELS: Record<ActorRole, string> = {
  admin: 'Admin',
  store_owner: 'Shop owner',
  branch_manager: 'Branch manager',
  staff: 'Staff',
  customer: 'Customer',
  guest: 'Guest',
};

// One hue per role so a row's actor reads at a glance. The two Tailoring staff
// roles share the green family (teal / emerald) so they read as one group.
const ROLE_TONE: Record<ActorRole, string> = {
  admin: 'bg-violet-50 text-violet-700 border-violet-200',
  store_owner: 'bg-amber-50 text-amber-800 border-amber-200',
  branch_manager: 'bg-teal-50 text-teal-700 border-teal-200',
  staff: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  customer: 'bg-sky-50 text-sky-700 border-sky-200',
  guest: 'bg-stone-100 text-stone-600 border-stone-200',
};

// Filter tabs. Branch managers and staff are one tab, "Tailoring staff" (the
// system's Tailoring Staff role); the server matches both for `tailoring_staff`.
// Each row's badge still says which of the two it was.
const ROLES = [
  { value: '', label: 'Everyone' },
  { value: 'admin', label: ROLE_LABELS.admin },
  { value: 'store_owner', label: ROLE_LABELS.store_owner },
  { value: 'tailoring_staff', label: 'Tailoring staff' },
  { value: 'customer', label: ROLE_LABELS.customer },
  { value: 'guest', label: ROLE_LABELS.guest },
];

const humanize = (action: string) => action.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
const capitalize = (text: string) => text.replace(/^\w/, (c) => c.toUpperCase());

// Every action anyone takes on SUTURA — admin, shop owner, branch manager,
// staff, customer or guest — recorded server-side by ActivityRecorder.
// Page views aren't logged, only things people do.
export default function AdminActivityPage() {
  const [role, setRole] = useState('');
  const [storeId, setStoreId] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const query = useDebounced(search);
  const { items, meta, raw, loading, error } = useAdminList<AuditRow>('/admin/audit-logs', { role, store_id: storeId, search: query, from, to, page, per_page: 10 });
  // A shorter last page keeps the list's height, so the card doesn't shrink on Next.
  const stable = useStableListHeight<HTMLDivElement>(`${role}|${storeId}|${query}|${from}|${to}`);
  const stores = (raw.stores ?? []) as { id: number; name: string }[];
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="Everything people do on SUTURA — sign-ins, bookings, orders, payments, edits and admin decisions — across every role and shop.">
        <FilterTabs options={ROLES} value={role} onChange={resetPage(setRole)} />
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <SearchInput bold onCanvasBackground value={search} onChange={resetPage(setSearch)} placeholder="Search action, person, or shop" className="sm:max-w-sm" />
        <label className="text-sm text-ink-muted">Shop
          <select value={storeId} onChange={(e) => resetPage(setStoreId)(e.target.value)} className="mt-1 block min-h-11 w-full border border-line-strong bg-surface px-3 text-base text-ink sm:w-56">
            <option value="">All shops</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </label>
        <label className="text-sm text-ink-muted">From
          <input type="date" value={from} onChange={(e) => resetPage(setFrom)(e.target.value)} className="mt-1 block min-h-11 border border-line-strong bg-surface px-3 text-base text-ink" />
        </label>
        <label className="text-sm text-ink-muted">To
          <input type="date" value={to} onChange={(e) => resetPage(setTo)(e.target.value)} className="mt-1 block min-h-11 border border-line-strong bg-surface px-3 text-base text-ink" />
        </label>
      </div>

      <div className="admin-card overflow-hidden">
        <div ref={stable.ref} style={stable.style}>
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No activity matches." />
        {!loading && !error && items.length > 0 && (
          <ul className="admin-divide">
            {items.map((row) => (
              <li key={row.id} className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3">
                <div className="min-w-0 flex-1 basis-72">
                  <p className="font-semibold text-ink">
                    {row.payload?.description ? capitalize(row.payload.description.replace(/^System Admin: /, '')) : (
                      <>{humanize(row.action)}{row.payload?.name && <span className="font-normal text-ink-body"> — {row.payload.name}</span>}</>
                    )}
                  </p>
                  {row.payload?.reason && <p className="mt-0.5 text-sm text-ink-body">Reason: {row.payload.reason}</p>}
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                    <span className={`${PILL} ${ROLE_TONE[row.actor_role ?? 'guest']}`}>{ROLE_LABELS[row.actor_role ?? 'guest']}</span>
                    <span className="min-w-0 truncate">
                      {row.user?.name ?? (row.actor_role === 'guest' || !row.actor_role ? 'Guest' : 'System')}
                      {row.store && ` · ${row.store.name}`}
                      {row.ip_address && ` · ${row.ip_address}`}
                    </span>
                  </p>
                </div>
                <time dateTime={row.created_at} className="shrink-0 text-sm text-ink-muted">{formatDate(row.created_at, true)}</time>
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
