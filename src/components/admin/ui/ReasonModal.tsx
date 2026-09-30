'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

interface ReasonModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly placeholder?: string;
  readonly onClose: () => void;
  /** Resolve to close; throw (or reject) to keep the dialog open. */
  readonly onConfirm: (reason: string) => Promise<void>;
}

// Every destructive admin action (reject an application, suspend an
// account, hide a store) requires a reason server-side — this is the one
// dialog that collects it. The reason is shown to the affected owner.
export default function ReasonModal({ isOpen, title, description, confirmLabel, placeholder, onClose, onConfirm }: ReasonModalProps) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => { setReason(''); onClose(); };
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
    } catch {
      /* caller already surfaced the error; keep the dialog open */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={title}
      footer={(
        <div className="flex justify-end gap-3">
          <button type="button" onClick={close} className="min-h-11 border border-line-strong px-4 text-sm text-ink">Cancel</button>
          <button type="button" disabled={busy || reason.trim().length < 5} onClick={confirm} className="min-h-11 bg-danger px-4 text-sm font-semibold text-white disabled:opacity-40">
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </div>
      )}
    >
      <p className="text-sm text-ink-muted">{description}</p>
      <label htmlFor="reason-input" className="mt-4 mb-2 block text-sm text-ink">Reason</label>
      <textarea id="reason-input" rows={4} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder}
        className="w-full border border-line-strong bg-surface p-3 text-base text-ink focus:border-ink focus:outline-none" />
      <p className="mt-1 text-right text-xs text-ink-faint">{reason.length}/500</p>
    </Modal>
  );
}
