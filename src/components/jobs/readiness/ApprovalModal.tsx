import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { peso } from './readinessFormat';
import type { ReadinessData } from './readinessTypes';

interface ApprovalModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly data: ReadinessData;
  readonly busy: boolean;
  readonly onApprove: () => Promise<boolean>;
}

/** The customer is at the counter: read the quotation and policy to them, then record that they agreed. */
export default function ApprovalModal({ isOpen, onClose, data, busy, onApprove }: ApprovalModalProps) {
  const [accepted, setAccepted] = useState(false);
  const q = data.quotation?.data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record customer approval"
      maxWidth="max-w-lg"
      footer={(
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-sm font-medium text-ink-body hover:text-ink">Cancel</button>
          <button type="button" disabled={!accepted || busy} onClick={async () => { if (await onApprove()) onClose(); }} className="h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Record approval</button>
        </div>
      )}
    >
      <div className="space-y-3 text-sm">
        <dl className="divide-y divide-line rounded-lg border border-line">
          <div className="flex justify-between px-3 py-2"><dt className="text-ink-muted">Final quotation</dt><dd className="font-bold text-ink">{peso(q?.total ?? data.quotation?.total)}</dd></div>
          <div className="flex justify-between px-3 py-2"><dt className="text-ink-muted">Required deposit</dt><dd className="font-semibold text-ink">{peso(data.deposit?.required)}</dd></div>
          <div className="flex justify-between px-3 py-2"><dt className="text-ink-muted">Expected completion</dt><dd className="font-semibold text-ink">{data.order?.due_date ? new Date(data.order.due_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</dd></div>
        </dl>
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Cancellation policy</p>
          <p className="rounded-lg bg-canvas p-3 text-xs leading-relaxed text-ink-body">{data.policy}</p>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-taupe" />
          The customer approved the final specifications, this quotation, the completion date and the cancellation policy.
        </label>
      </div>
    </Modal>
  );
}
