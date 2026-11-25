import React, { useState } from 'react';
import { Loader2, Zap } from 'lucide-react';
import Modal from '@/components/Modal';
import type { Job } from './jobHelpers';
import type { Staff } from '@/components/staff/staffHelpers';
import { staffForBranch, staffOptionLabel } from '@/components/staff/staffHelpers';
import { getLocalDateString } from '@/components/appointments/appointmentHelpers';

export interface ApprovePayload {
  due_date: string;
  assigned_staff_id: number | null;
  /** Take it as a rush order; the fee is added to the remaining balance. */
  rush?: boolean;
  rush_fee?: number | null;
}

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: unknown) => Number.parseFloat(String(v ?? 0)) || 0;

interface JobApproveModalProps {
  readonly job: Job | null;
  readonly staffList: Staff[];
  readonly onClose: () => void;
  readonly onConfirm: (jobId: number, payload: ApprovePayload) => Promise<boolean>;
}

// The service's usual turnaround, else a week — the same starting point the walk-in form suggests.
function suggestedDueDate(job: Job): string {
  if (job.due_date) return job.due_date.slice(0, 10);
  const days = Number(job.service?.estimated_days) || 7;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getLocalDateString(d);
}

/**
 * Approving an online order asks for what a walk-in order is created with:
 * a due date (required) and, optionally, who will work on it. When the
 * customer asked for rush, the shop decides here: take it as rush (the fee is
 * added to the remaining balance) or approve it as a normal order.
 */
export default function JobApproveModal({ job, staffList, onClose, onConfirm }: JobApproveModalProps) {
  return (
    <Modal isOpen={!!job} onClose={onClose} title="Approve Order">
      {/* Keyed so each order opens with its own suggested values. */}
      {job && <ApproveForm key={job.id} job={job} staffList={staffList} onClose={onClose} onConfirm={onConfirm} />}
    </Modal>
  );
}

function ApproveForm({ job, staffList, onClose, onConfirm }: Readonly<{ job: Job } & Omit<JobApproveModalProps, 'job'>>) {
  const currentStaff = job.assigned_staff_id ?? job.assigned_to ?? null;
  const [dueDate, setDueDate] = useState(() => suggestedDueDate(job));
  const [staffId, setStaffId] = useState<string>(currentStaff ? String(currentStaff) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const today = getLocalDateString(new Date());

  // Rush: pre-ticked when the customer asked for it. Default fee matches a walk-in
  // rush order: 30% of the total, 15% for a repeat customer (3+ orders here).
  const data = (job.custom_order_data ?? {}) as Record<string, unknown>;
  const rushRequested = String(data.rush_requested ?? '').toLowerCase() === 'yes';
  const neededBy = typeof data.needed_by === 'string' ? data.needed_by : null;
  const total = num(job.total_amount);
  const balance = num(job.balance);
  const paidSoFar = Math.max(0, total - balance - num(job.discount_amount));
  const defaultRate = ((job as Job & { customer_job_count?: number }).customer_job_count ?? 0) >= 3 ? 0.15 : 0.3;
  const [rush, setRush] = useState(rushRequested && !job.is_rush);
  const [rushFee, setRushFee] = useState(() => (Math.round(total * defaultRate * 100) / 100).toFixed(2));
  const fee = Math.max(0, num(rushFee));

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!dueDate) { setError('Set a due date before approving this order.'); return; }
    if (dueDate < today) { setError("The due date can't be in the past."); return; }
    if (rush && (rushFee.trim() === '' || Number.isNaN(Number(rushFee)) || Number(rushFee) < 0)) {
      setError('Enter the rush fee (₱0 or more).');
      return;
    }
    setError('');
    setSubmitting(true);
    const ok = await onConfirm(job.id, {
      due_date: dueDate,
      assigned_staff_id: staffId ? Number(staffId) : null,
      ...(rush ? { rush: true, rush_fee: Math.round(fee * 100) / 100 } : {}),
    });
    setSubmitting(false);
    if (ok) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-ink-body">
        <strong>{job.order_number ?? `Order #${job.id}`}</strong>
        {job.customer?.name ? ` · ${job.customer.name}` : ''} moves into <strong>Production</strong>.
      </p>

      <div>
        <label htmlFor="approve-due-date" className="block text-sm font-medium text-ink-body mb-1.5">
          Due date <span className="text-danger">*</span>
        </label>
        <input
          id="approve-due-date"
          type="date"
          required
          min={today}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full min-h-11 bg-canvas border border-line rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
        />
      </div>

      <div>
        <label htmlFor="approve-staff" className="block text-sm font-medium text-ink-body mb-1.5">
          Assign staff <span className="text-ink-faint font-normal">(optional)</span>
        </label>
        <select
          id="approve-staff"
          value={staffId}
          onChange={(e) => setStaffId(e.target.value)}
          className="w-full min-h-11 bg-canvas border border-line rounded-lg px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-taupe"
        >
          <option value="">Unassigned</option>
          {staffForBranch(staffList, job.store_branch_id, currentStaff).map((s) => {
            const uid = s.user_id ?? s.user?.id;
            return uid ? <option key={uid} value={uid}>{staffOptionLabel(s)}</option> : null;
          })}
        </select>
      </div>

      {!job.is_rush && (
        <fieldset className={`rounded-xl border p-4 ${rushRequested ? 'border-amber-300 bg-amber-50/60' : 'border-line'}`}>
          <legend className="sr-only">Rush order</legend>
          {rushRequested && (
            <p className="mb-3 flex items-start gap-2 text-sm text-amber-900">
              <Zap size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                The customer asked for <strong>rush</strong>
                {neededBy ? <> and needs it by <strong>{new Date(`${neededBy}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</strong></> : null}.
              </span>
            </p>
          )}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rush}
              onChange={(e) => setRush(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#8A7063]"
            />
            <span className="text-sm">
              <span className="font-semibold text-ink">Take this as a rush order</span>
              <span className="block text-xs text-ink-muted">
                {rushRequested ? 'Untick to approve it as a normal order without a rush fee.' : 'Adds a rush fee and marks the order Rush.'}
              </span>
            </span>
          </label>

          {rush && (
            <div className="mt-3 space-y-2 pl-7">
              <label htmlFor="approve-rush-fee" className="block text-sm font-medium text-ink-body">Rush fee</label>
              <div className="relative max-w-[200px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">₱</span>
                <input
                  id="approve-rush-fee"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={rushFee}
                  onChange={(e) => setRushFee(e.target.value)}
                  className="w-full min-h-11 rounded-lg border border-line bg-canvas pl-7 pr-3 text-sm tabular-nums text-ink focus:border-taupe focus:outline-none"
                />
              </div>
              <p className="text-xs text-ink-muted">
                Suggested {Math.round(defaultRate * 100)}% of {peso(total)}{defaultRate < 0.3 ? ' (repeat customer)' : ''}.
              </p>
              <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg bg-white/70 px-3 py-2 text-xs tabular-nums">
                <dt className="text-ink-muted">Paid so far</dt><dd className="text-right text-ink">{peso(paidSoFar)}</dd>
                <dt className="text-ink-muted">Remaining balance</dt>
                <dd className="text-right text-ink">{peso(balance)} → <strong>{peso(balance + fee)}</strong></dd>
                <dt className="text-ink-muted">Order total</dt>
                <dd className="text-right text-ink">{peso(total)} → <strong>{peso(total + fee)}</strong></dd>
              </dl>
              <p className="text-xs text-ink-muted">The fee is added to what the customer still owes. Their deposit stays as it is.</p>
            </div>
          )}
        </fieldset>
      )}

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}

      <div className="pt-1 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 px-4 py-2 rounded-lg text-sm font-medium text-ink-body hover:bg-sunken transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 bg-ink hover:bg-ink/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Approve order
        </button>
      </div>
    </form>
  );
}
