'use client';

import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import Modal from '@/components/Modal';
import AuthImage from '@/components/shared/AuthImage';
import { FilterTabs, ListState, Pager } from '@/components/admin/ui/AdminPrimitives';
import { formatDate, useAdminList } from '@/components/admin/useAdminList';
import adminApi from '@/lib/adminApi';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

interface UpgradeRow {
  id: number;
  billing_cycle: string;
  quoted_price: string;
  payment_reference: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  store: { id: number; name: string } | null;
  plan: { name: string } | null;
  requester: { name: string; email: string; contact_email: string | null } | null;
  reviewer: { name: string } | null;
}

const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const peso = (n: string | number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function AdminUpgradesPage() {
  const toast = useToast();
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const { items, meta, raw, loading, error, reload } = useAdminList<UpgradeRow>('/admin/upgrade-requests', { status, page });
  const counts = (raw.counts ?? {}) as Record<string, number>;

  const [open, setOpen] = useState<UpgradeRow | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => { setOpen(null); setRejecting(false); setReason(''); };

  const act = async (kind: 'approve' | 'reject') => {
    if (!open) return;
    setBusy(true);
    try {
      const res = await adminApi.post(`/admin/upgrade-requests/${open.id}/${kind}`, kind === 'reject' ? { reason } : {});
      toast.success(res.data.message);
      close();
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save your decision.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Plan Payments" description="Check the GCash receipt, then approve to switch the shop's plan.">
        <FilterTabs options={STATUSES.map((s) => ({ ...s, count: counts[s.value] ?? 0 }))} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      </PageHeader>

      <div className="border border-line bg-surface">
        <ListState loading={loading} error={error} empty={items.length === 0} emptyText={status === 'pending' ? 'No payments are waiting for review.' : `No ${status} payments.`} />
        {!loading && !error && items.length > 0 && (
          <ul className="divide-y divide-line">
            {items.map((row) => (
              <li key={row.id}>
                <button type="button" onClick={() => setOpen(row)} className="grid w-full min-h-16 grid-cols-[1fr_auto] items-center gap-4 px-5 py-3 text-left hover:bg-canvas sm:grid-cols-[2fr_1.2fr_1fr_auto] cursor-pointer">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{row.store?.name}</p>
                    <p className="truncate text-sm text-ink-muted">{row.requester?.name} · {row.requester?.contact_email ?? row.requester?.email}</p>
                  </div>
                  <p className="hidden text-sm text-ink-body sm:block">{row.plan?.name} · {row.billing_cycle}</p>
                  <p className="text-sm font-semibold text-ink">{peso(row.quoted_price)}</p>
                  <p className="hidden text-sm text-ink-muted sm:block">{formatDate(row.created_at)}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Pager meta={meta} onPage={setPage} />
      </div>

      <Modal
        isOpen={open !== null}
        onClose={close}
        title="Review payment"
        maxWidth="max-w-lg"
        footer={
          open?.status === 'pending' ? (
            rejecting ? (
              <>
                <button type="button" onClick={() => setRejecting(false)} disabled={busy} className="h-11 px-5 border border-line-strong bg-white text-sm font-medium cursor-pointer">Back</button>
                <button type="button" onClick={() => act('reject')} disabled={busy || !reason.trim()} className="h-11 px-5 bg-danger text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {busy && <Loader2 size={16} className="animate-spin" />} Reject payment
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setRejecting(true)} disabled={busy} className="h-11 px-5 border border-danger/40 bg-white text-danger text-sm font-medium flex items-center gap-2 cursor-pointer"><X size={16} /> Reject</button>
                <button type="button" onClick={() => act('approve')} disabled={busy} className="h-11 px-5 bg-ink text-white text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50">
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Approve &amp; switch plan
                </button>
              </>
            )
          ) : undefined
        }
      >
        {open && (
          <div className="space-y-4">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-ink-muted">Shop</dt><dd className="font-semibold text-ink">{open.store?.name}</dd>
              <dt className="text-ink-muted">Plan</dt><dd className="text-ink">{open.plan?.name} · {open.billing_cycle}</dd>
              <dt className="text-ink-muted">Expected amount</dt><dd className="font-semibold text-ink">{peso(open.quoted_price)}</dd>
              {open.payment_reference && (<><dt className="text-ink-muted">Reference</dt><dd className="font-mono text-ink">{open.payment_reference}</dd></>)}
              <dt className="text-ink-muted">Sent</dt><dd className="text-ink">{formatDate(open.created_at)}</dd>
              {open.status !== 'pending' && (<><dt className="text-ink-muted">Decision</dt><dd className="text-ink capitalize">{open.status}{open.reviewer ? ` by ${open.reviewer.name}` : ''}</dd></>)}
              {open.rejection_reason && (<><dt className="text-ink-muted">Reason</dt><dd className="text-danger">{open.rejection_reason}</dd></>)}
            </dl>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink mb-2">GCash receipt</p>
              <AuthImage
                key={open.id}
                alt="GCash receipt"
                className="w-full max-h-[55vh] object-contain border border-line bg-sunken"
                load={() => adminApi.get(`/admin/upgrade-requests/${open.id}/receipt`, { responseType: 'blob' }).then((res) => res.data)}
              />
            </div>

            {rejecting && (
              <div>
                <label htmlFor="reject-reason" className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">Why is it being rejected?</label>
                <textarea id="reject-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="e.g. The amount sent does not match the plan price." className="w-full px-3 py-2 border border-line-strong bg-surface text-base text-ink focus:outline-none focus:border-ink" />
                <p className="text-xs text-ink-muted mt-1">The owner sees this and can send a new receipt.</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
