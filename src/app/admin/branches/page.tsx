'use client';

import { useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import { FilterTabs, ListState } from '@/components/admin/ui/AdminPrimitives';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import BranchRow, { type PendingBranch } from '@/components/admin/branches/BranchRow';
import { useAdminList } from '@/components/admin/useAdminList';

// A branch a shop adds (or moves) stays off the public map, search and booking
// form until the admin has opened its pin and confirmed the address matches.
export default function AdminBranchesPage() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [rejecting, setRejecting] = useState<PendingBranch | null>(null);
  const { raw, loading, error, reload } = useAdminList<PendingBranch>('/admin/branches', { status });
  const data = (raw.data ?? {}) as { branches?: PendingBranch[]; counts?: Record<string, number> };
  const items = data.branches ?? [];
  const counts = data.counts ?? {};

  const tabs = [
    { value: 'pending', label: 'To check', count: counts.pending },
    { value: 'verified', label: 'Verified', count: counts.verified },
    { value: 'rejected', label: 'Rejected', count: counts.rejected },
    { value: 'all', label: 'All' },
  ];

  const verify = async (branch: PendingBranch) => {
    try {
      await adminApi.put(`/admin/branches/${branch.id}/verify`);
      toast.success(`${branch.name} is now visible to customers.`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not verify this branch.'));
    }
  };

  const reject = async (reason: string) => {
    if (!rejecting) return;
    try {
      await adminApi.put(`/admin/branches/${rejecting.id}/reject`, { reason });
      toast.success(`${rejecting.name} was sent back to the owner.`);
      setRejecting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject this branch.'));
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Branch locations" description="Open each pin, confirm it matches the address, then verify. Unverified branches stay off the map and booking form.">
        <FilterTabs options={tabs} value={status} onChange={setStatus} />
      </PageHeader>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText="No branches here." />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((b) => <BranchRow key={b.id} branch={b} onVerify={verify} onReject={setRejecting} />)}
          </ul>
        )}
      </div>

      <ReasonModal
        isOpen={rejecting !== null}
        title={`Send ${rejecting?.name ?? 'branch'} back?`}
        description="The branch stays hidden from customers. The owner is notified with your reason and can fix the location and save it to be checked again."
        confirmLabel="Send back"
        placeholder="e.g. The pin is not at the address given"
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      />
    </div>
  );
}
