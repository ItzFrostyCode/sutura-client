'use client';

import { useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import StoreRow, { type DirectoryStore } from '@/components/admin/stores/StoreRow';
import { useAdminList, useDebounced } from '@/components/admin/useAdminList';

const FILTERS = [
  { value: 'approved', label: 'Live' },
  { value: 'hidden', label: 'Hidden' },
  { value: '', label: 'All' },
];

// sutura2's Shop Directory. Hide/Restore reuse the existing post-moderation
// endpoints (Admin\ModerationController), which notify the owner and lock
// the shop so neither the owner nor a renewal can un-hide it.
export default function AdminStoresPage() {
  const toast = useToast();
  const [filter, setFilter] = useState('approved');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hiding, setHiding] = useState<DirectoryStore | null>(null);
  const query = useDebounced(search);
  const params = filter === 'hidden' ? { visibility: 'hidden', search: query, page } : { status: filter, search: query, page };
  const { items, meta, loading, error, reload } = useAdminList<DirectoryStore>('/admin/stores', params);

  const hide = async (reason: string) => {
    if (!hiding) return;
    try {
      await adminApi.put(`/admin/stores/${hiding.id}/hide`, { reason });
      toast.success(`${hiding.name} is hidden from customers.`);
      setHiding(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not hide this store.'));
      throw err;
    }
  };

  const restore = async (store: DirectoryStore) => {
    try {
      const res = await adminApi.put(`/admin/stores/${store.id}/unhide`);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not restore this store.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Stores" description="Every shop on SUTURA, with its plan and branches.">
        <FilterTabs options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} />
      </PageHeader>

      <div className="max-w-sm">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search shop, city, or owner" />
      </div>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No stores match." />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((store) => <StoreRow key={store.id} store={store} onHide={setHiding} onRestore={restore} />)}
          </ul>
        )}
        <Pager meta={meta} onPage={setPage} />
      </div>

      <ReasonModal
        isOpen={hiding !== null}
        title={`Hide ${hiding?.name ?? 'store'}?`}
        description="The store profile disappears from search, the map, and its public page until you restore it. The owner is notified with your reason."
        confirmLabel="Hide Store"
        onClose={() => setHiding(null)}
        onConfirm={hide}
      />
    </div>
  );
}
