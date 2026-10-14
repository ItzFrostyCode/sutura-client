import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { peso } from './readinessFormat';
import type { Correction } from './readinessTypes';

interface ApproveChangeModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly change: Correction;
  readonly currentDue: string | null;
  readonly busy: boolean;
  readonly onApprove: (body: Record<string, unknown>) => Promise<boolean>;
}

const field = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';

/** The customer agreed to the extra price: add it to the order, and record any new completion date and why. */
export default function ApproveChangeModal({ isOpen, onClose, change, currentDue, busy, onApprove }: ApproveChangeModalProps) {
  const [due, setDue] = useState(currentDue ?? '');
  const [reason, setReason] = useState('');
  const dateChanged = due !== (currentDue ?? '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve change"
      maxWidth="max-w-md"
      footer={(
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-sm font-medium text-ink-body hover:text-ink">Cancel</button>
          <button type="button" disabled={busy || (dateChanged && !reason.trim())} onClick={async () => { if (await onApprove({ due_date: due || null, reason: reason.trim() || null })) onClose(); }} className="h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
            Customer approved
          </button>
        </div>
      )}
    >
      <div className="space-y-3 text-sm">
        <p className="rounded-lg bg-canvas p-3 text-xs text-ink-body">{change.description}</p>
        <p className="text-ink">Additional price <strong>{peso(change.additional_amount)}</strong> will be added to the total and the balance.</p>
        <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Completion date
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={`${field} font-normal`} />
        </label>
        {dateChanged && (
          <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Why does the date move? (the customer is owed an explanation)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} className={`${field} resize-none font-normal normal-case tracking-normal`} />
          </label>
        )}
      </div>
    </Modal>
  );
}
