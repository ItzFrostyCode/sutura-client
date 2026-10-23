import React, { useState } from 'react';
import { Check, Loader2, ShieldCheck } from 'lucide-react';
import { Payment } from '../jobTypes';
import { BTN, BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';

const FIELD = `${PLAIN_FIELD} h-10`;

interface EditProps {
  readonly editMethod: string;
  readonly setEditMethod: (m: string) => void;
  readonly editReference: string;
  readonly setEditReference: (r: string) => void;
  readonly editNotes: string;
  readonly setEditNotes: (n: string) => void;
  readonly savingEdit: boolean;
  readonly onSaveEdit: () => Promise<void>;
  readonly onCancelEdit: () => void;
}

/** Flat edit form for a logged payment's method, reference and notes. */
export function PaymentEditPanel({ editMethod, setEditMethod, editReference, setEditReference, editNotes, setEditNotes, savingEdit, onSaveEdit, onCancelEdit }: EditProps) {
  // Old online records may be bank transfers; keep that option only for them so it is not silently changed.
  const [wasBankTransfer] = useState(editMethod === 'bank_transfer');
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-sunken/70 p-3.5">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select value={editMethod} onChange={(e) => setEditMethod(e.target.value)} aria-label="Payment method" className={FIELD}>
          <option value="cash">Cash</option>
          <option value="gcash">GCash</option>
          <option value="paymaya">Maya</option>
          <option value="other">Other</option>
          {wasBankTransfer && <option value="bank_transfer">Bank transfer</option>}
        </select>
        {editMethod !== 'cash' && (
          <input type="text" value={editReference} onChange={(e) => setEditReference(e.target.value)} placeholder="Reference #" aria-label="Reference number" className={FIELD} />
        )}
      </div>
      <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." aria-label="Internal notes" className={FIELD} />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancelEdit} className={BTN_SM}>Cancel</button>
        <button type="button" disabled={savingEdit} onClick={onSaveEdit} className={`${BTN_SM} !bg-espresso !text-white hover:!bg-espresso/90`}>
          <Check size={14} /> {savingEdit ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/** Owner / branch manager confirms the GCash / Maya proof before it counts toward the balance. */
export function PaymentVerifyPanel({ methodLabel, verifying, onVerify }: Readonly<{ methodLabel: string; verifying: boolean; onVerify: () => void }>) {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-amber-500/[0.07] px-3.5 py-3">
      <p className="text-[13px] text-amber-800">Confirm the {methodLabel} receipt before this counts toward the balance.</p>
      <button type="button" disabled={verifying} onClick={onVerify} className={`${BTN_SM} !border-emerald-600 !bg-emerald-600 !text-white hover:!bg-emerald-700`}>
        {verifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
        {verifying ? 'Verifying…' : 'Verify'}
      </button>
    </div>
  );
}

interface RejectProps {
  readonly rejectReason: string;
  readonly setRejectReason: (r: string) => void;
  readonly submittingReject: boolean;
  readonly onSubmitReject: () => Promise<void>;
  readonly onCancelReject: () => void;
}

export function PaymentRejectPanel({ rejectReason, setRejectReason, submittingReject, onSubmitReject, onCancelReject }: RejectProps) {
  return (
    <div className="mt-3 space-y-2 rounded-xl bg-rose-500/[0.07] p-3.5">
      <p className="text-[13px] font-medium text-rose-800">Reason for rejecting this transaction:</p>
      <input type="text" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. GCash screenshot forged / reference invalid" aria-label="Rejection reason" className={FIELD} />
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancelReject} className={BTN}>Cancel</button>
        <button type="button" disabled={submittingReject || !rejectReason.trim()} onClick={onSubmitReject} className={`${BTN} !border-rose-600 !bg-rose-600 !text-white hover:!bg-rose-700`}>
          {submittingReject ? 'Rejecting…' : 'Confirm Rejection'}
        </button>
      </div>
    </div>
  );
}

export function PaymentRejectedNote({ payment }: Readonly<{ payment: Payment }>) {
  if (!payment.rejected_at) return null;
  return (
    <div className="mt-3 rounded-xl bg-rose-500/[0.07] px-3.5 py-3 text-[13px] text-rose-700">
      <p className="font-medium">
        Rejected on {new Date(payment.rejected_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
        {payment.rejected_by && ` by ${payment.rejected_by.name}`}
      </p>
      {payment.rejected_reason && <p className="mt-0.5 italic">{payment.rejected_reason}</p>}
    </div>
  );
}
