'use client';

import { useEffect, useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterTabs, ListState, PAGER_BTN } from '@/components/admin/ui/AdminPrimitives';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import StoreRow, { type DirectoryStore } from '@/components/admin/stores/StoreRow';
import { useAdminList, useDebounced, useStableListHeight } from '@/components/admin/useAdminList';

const FILTERS = [
  { value: 'approved', label: 'Active' },
  { value: 'hidden', label: 'Hidden' },
  { value: '', label: 'All' },
];

const PER_PAGE = 5;

const PLANS = [
  { value: '', label: 'All plans' },
  { value: 'basic', label: 'Basic' },
  { value: 'pro', label: 'Pro' },
  { value: 'premium', label: 'Premium' },
];

// sutura2's Shop Directory. Hide/Restore reuse the existing post-moderation
// endpoints (Admin\ModerationController), which notify the owner and lock
// the shop so neither the owner nor a renewal can un-hide it.
export default function AdminStoresPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('approved');
  const [plan, setPlan] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hiding, setHiding] = useState<DirectoryStore | null>(null);
  const query = useDebounced(search);
  // "See in Shops" from Reports opens this list already searched (?search=Shop name), across all tabs.
  useEffect(() => {
    const preset = new URLSearchParams(window.location.search).get('search');
    if (preset) {
      setSearch(preset);
      setFilter('');
    }
  }, []);
  // Active = approved and visible to customers; Hidden = hidden by an admin or a lapsed plan.
  const base = { plan, search: query, page, per_page: PER_PAGE };
  const params = filter === 'hidden'
    ? { ...base, visibility: 'hidden' }
    : filter === 'approved'
      ? { ...base, status: 'approved', visibility: 'visible' }
      : base;
  const { items, meta, loading, error, reload } = useAdminList<DirectoryStore>('/admin/stores', params);
  // A shorter last page keeps the list's height, so pressing Next doesn't jump to the top.
  const stable = useStableListHeight<HTMLDivElement>(`${filter}|${plan}|${query}`);

  const hide = async (reason: string) => {
    if (!hiding) return;
    try {
      await adminApi.put(`/admin/stores/${hiding.id}/hide`, { reason });
      toast.success(`${hiding.name} is hidden from customers.`);
      setHiding(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not hide this shop.'));
      throw err;
    }
  };

  const restore = async (store: DirectoryStore) => {
    try {
      const res = await adminApi.put(`/admin/stores/${store.id}/unhide`);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not restore this shop.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shops" description="Every shop on SUTURA, with its plan and branches.">
        <FilterTabs options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} />
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:max-w-sm">
          <SearchInput bold onCanvasBackground value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search shop, city, or owner" />
        </div>
        <div className="flex gap-1 overflow-x-auto hide-scrollbar admin-field p-1 shadow-2xs sm:ml-auto" role="radiogroup" aria-label="Plan">
          {PLANS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="radio"
              aria-checked={plan === p.value}
              onClick={() => { setPlan(p.value); setPage(1); }}
              className={`min-h-9 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-sm transition-colors ${plan === p.value ? 'bg-ink font-semibold text-white' : 'text-ink-body hover:bg-sunken hover:text-ink'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={stable.ref} style={stable.style}>
        {(loading || error || items.length === 0) && (
          <div className="admin-card">
            <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No shops match." />
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <ul className="space-y-3">
            {items.map((store) => <StoreRow key={store.id} store={store} onHide={setHiding} onRestore={restore} />)}
          </ul>
        )}
      </div>

      {meta && meta.last_page > 1 && (
        <nav className="relative flex min-h-11 items-center justify-center" aria-label="Pages">
          <p className="text-sm text-ink-body">
            Page {meta.current_page} of {meta.last_page}
            <span className="text-ink-faint"> · {meta.total} shops</span>
          </p>
          <div className="absolute right-0 flex gap-2">
            <button type="button" aria-label="Previous page" disabled={meta.current_page <= 1} onClick={() => setPage(meta.current_page - 1)} className={PAGER_BTN}>
              <ChevronLeft size={17} />
            </button>
            <button type="button" aria-label="Next page" disabled={meta.current_page >= meta.last_page} onClick={() => setPage(meta.current_page + 1)} className={PAGER_BTN}>
              <ChevronRight size={17} />
            </button>
          </div>
        </nav>
      )}

      <ReasonModal
        isOpen={hiding !== null}
        title={`Hide ${hiding?.name ?? 'store'}?`}
        description="The shop profile disappears from search, the map, and its public page until you restore it. The owner is notified with your reason."
        confirmLabel="Hide Shop"
        onClose={() => setHiding(null)}
        onConfirm={hide}
      />
    </div>
  );
}
