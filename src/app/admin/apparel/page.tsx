'use client';

import { useState } from 'react';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/shared/PageHeader';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import ReasonModal from '@/components/admin/ui/ReasonModal';
import ApparelTypeRow, { type ApparelType } from '@/components/admin/apparel/ApparelTypeRow';
import { useAdminList } from '@/components/admin/useAdminList';

// "Validate apparel categories": picking from the fixed apparel list is
// instant, but a name a shop types in waits here. Designs using it stay off
// the storefront until approved; an approved name is reused by every shop.
export default function AdminApparelPage() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [rejecting, setRejecting] = useState<ApparelType | null>(null);
  const { items, meta, raw, loading, error, reload } = useAdminList<ApparelType>('/admin/apparel-types', { status, page });
  const counts = (raw.counts ?? {}) as Record<string, number>;

  const tabs = [
    { value: 'pending', label: 'To check', count: counts.pending },
    { value: 'approved', label: 'Approved', count: counts.approved },
    { value: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

  const changeTab = (value: string) => { setStatus(value); setPage(1); };

  const approve = async (type: ApparelType) => {
    try {
      await adminApi.put(`/admin/apparel-types/${type.id}/approve`);
      toast.success(`“${type.label}” approved. Designs using it are now visible.`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not approve this apparel name.'));
    }
  };

  const reject = async (reason: string) => {
    if (!rejecting) return;
    try {
      await adminApi.put(`/admin/apparel-types/${rejecting.id}/reject`, { reason });
      toast.success(`“${rejecting.label}” rejected. The shop was told why.`);
      setRejecting(null);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject this apparel name.'));
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Apparel categories" description="Apparel names shops typed in themselves. Designs using a name stay hidden from customers until you approve it; once approved, any shop can use it.">
        <FilterTabs options={tabs} value={status} onChange={changeTab} />
      </PageHeader>

      <div className="border-2 border-line-strong bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText={status === 'pending' ? 'No apparel names waiting for review.' : 'Nothing here yet.'} />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y-2 divide-line-strong">
            {items.map((t) => <ApparelTypeRow key={t.id} type={t} onApprove={approve} onReject={setRejecting} />)}
          </ul>
        )}
        <Pager meta={meta} onPage={setPage} />
      </div>

      <ReasonModal
        isOpen={rejecting !== null}
        title={`Reject “${rejecting?.label ?? ''}”?`}
        description="Designs using this name stay hidden, and no shop can use it again. Every shop using it is notified with your reason."
        confirmLabel="Reject name"
        placeholder="e.g. Not an apparel type / offensive wording"
        onClose={() => setRejecting(null)}
        onConfirm={reject}
      />
    </div>
  );
}
