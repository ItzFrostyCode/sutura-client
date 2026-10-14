import React, { useState } from 'react';
import { HandCoins, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Job } from '../jobTypes';

// Same list as JobOrder::STAGES_REQUIRING_DOWNPAYMENT on the server: once a job is in one of these,
// production has started and the downpayment can no longer be changed.
const PRODUCTION_STAGES = [
  'pattern_making', 'mass_cutting_printing', 'cutting', 'sewing', 'ready_for_fitting', 'final_adjustments',
  'qc_ironing', 'ready_for_pickup', 'balance_handover', 'in_repair', 'qc_check',
];
const CLOSED = ['completed', 'cancelled', 'rejected'];

/**
 * "No downpayment for this order" — for a customer the shop already knows. Owner / branch manager
 * only (this whole Payments tab already is). Saved on the server with the reason in the audit log;
 * "Require it again" puts back the order's old rule.
 */
export function DepositWaiverControl({ job, onChanged }: Readonly<{ job: Job; onChanged: () => Promise<void> | void }>) {
  const { store } = useAuthStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (PRODUCTION_STAGES.includes(job.status) || CLOSED.includes(job.status)) return null;
  const waived = job.payment_policy === 'none';

  const send = async (waive: boolean) => {
    if (!store) return;
    setBusy(true);
    try {
      const res = await api.post(`/stores/${store.id}/jobs/${job.id}/deposit-waiver`, waive ? { waive, reason: reason.trim() } : { waive });
      toast.success(res.data?.message ?? 'Saved.');
      setOpen(false);
      setReason('');
      await onChanged();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Could not change the downpayment.');
    } finally {
      setBusy(false);
    }
  };

  if (waived) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="mobile-body-sm text-ink-body">No downpayment is needed for this order.</p>
        <button
          type="button"
          disabled={busy}
          onClick={() => send(false)}
          className="min-h-11 px-3 text-sm font-medium text-taupe hover:text-ink disabled:opacity-50 cursor-pointer"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : 'Require the downpayment again'}
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-dashed border-line hover:border-taupe text-ink-body hover:text-ink text-xs font-semibold rounded-xl transition-all cursor-pointer"
      >
        <HandCoins size={13} />
        <span>No downpayment for this order</span>
      </button>
    );
  }

  return (
    <div className="space-y-3 border-t border-line pt-4">
      <label htmlFor="deposit-waiver-reason" className="mobile-body-sm block text-ink-body">
        Why is no downpayment needed? <span className="text-ink-faint">(e.g. a regular customer you know)</span>
      </label>
      <input
        id="deposit-waiver-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={500}
        placeholder="Regular customer, pays on pickup"
        className="w-full min-h-12 px-4 bg-canvas border border-line rounded-lg text-base text-ink focus:outline-none focus:border-taupe"
      />
      <p className="text-xs text-ink-faint">Production can start without a deposit. This is saved in the audit log.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => { setOpen(false); setReason(''); }}
          className="flex-1 min-h-11 border border-line rounded-lg text-sm font-medium text-ink-body hover:bg-sunken cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || !reason.trim()}
          onClick={() => send(true)}
          className="flex-1 min-h-11 bg-ink hover:bg-taupe text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {busy && <Loader2 size={14} className="animate-spin" />} Save
        </button>
      </div>
    </div>
  );
}
