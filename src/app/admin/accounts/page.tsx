'use client';

import { useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import AccountRow, { type AdminAccount } from '@/components/admin/accounts/AccountRow';
import { useAdminList, useDebounced } from '@/components/admin/useAdminList';

const ROLES = [
  { value: '', label: 'All' },
  { value: 'customer', label: 'Customers' },
  { value: 'store_owner', label: 'Shop Owners' },
  { value: 'branch_manager', label: 'Branch Managers' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admins' },
];

// sutura2's Accounts view. Suspending signs the person out everywhere and
// blocks sign-in until reactivated; roles aren't editable here on purpose
// (see Admin\AccountController).
export default function AdminAccountsPage() {
  const toast = useToast();
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [suspending, setSuspending] = useState<AdminAccount | null>(null);
  const query = useDebounced(search);
  const { items, meta, loading, error, reload } = useAdminList<AdminAccount>('/admin/accounts', { role, status, search: query, page });

  const suspend = async (reason: string) => {
    if (!suspending) return;
    try {
      const res = await adminApi.put(`/admin/accounts/${suspending.id}/suspend`, { reason });
      toast.success(res.data.message);
      setSuspending(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not suspend this account.'));
      throw err;
    }
  };

  const reactivate = async (account: AdminAccount) => {
    try {
      const res = await adminApi.put(`/admin/accounts/${account.id}/reactivate`);
      toast.success(res.data.message);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reactivate this account.'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Accounts" description="Everyone with a SUTURA sign-in.">
        <FilterTabs options={ROLES} value={role} onChange={(v) => { setRole(v); setPage(1); }} />
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search name or email" className="sm:max-w-sm" />
        <select aria-label="Account status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="min-h-11 border border-line-strong bg-surface px-3 text-base text-ink sm:w-44">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No accounts match." />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((a) => <AccountRow key={a.id} account={a} onSuspend={setSuspending} onReactivate={reactivate} />)}
          </ul>
        )}
        <Pager meta={meta} onPage={setPage} />
      </div>

      <ReasonModal
        isOpen={suspending !== null}
        title={`Suspend ${suspending?.name ?? 'account'}?`}
        description="They're signed out on every device right away and can't sign in until you reactivate them."
        confirmLabel="Suspend Account"
        onClose={() => setSuspending(null)}
        onConfirm={suspend}
      />
    </div>
  );
}
