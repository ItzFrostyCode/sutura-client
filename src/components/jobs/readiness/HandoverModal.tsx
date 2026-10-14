import React, { useState } from 'react';
import Modal from '@/components/Modal';

interface HandoverModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly remaining: number;
  readonly busy: boolean;
  readonly onSave: (body: Record<string, unknown>) => Promise<boolean>;
}

const field = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';
const label = 'block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted';

/** Record the garments the customer is taking. Releasing only some keeps the order open. */
export default function HandoverModal({ isOpen, onClose, remaining, busy, onSave }: HandoverModalProps) {
  const [quantity, setQuantity] = useState(String(remaining));
  const [receivedBy, setReceivedBy] = useState('');
  const [note, setNote] = useState('');
  const qty = Number(quantity);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record handover"
      maxWidth="max-w-md"
      footer={(
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-sm font-medium text-ink-body hover:text-ink">Cancel</button>
          <button type="button" disabled={busy || !(qty >= 1 && qty <= remaining)} onClick={async () => { if (await onSave({ quantity: qty, received_by: receivedBy.trim() || null, note: note.trim() || null })) onClose(); }} className="h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">Confirm handover</button>
        </div>
      )}
    >
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">{remaining} garment{remaining === 1 ? '' : 's'} left to hand over. If only some are released, the order stays open until the rest are done and corrected.</p>
        <label className={label}>Garments handed over now
          <input type="number" inputMode="numeric" min={1} max={remaining} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${field} font-normal`} />
        </label>
        <label className={label}>Received by
          <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} maxLength={120} placeholder="Customer or who collected" className={`${field} font-normal normal-case tracking-normal`} />
        </label>
        <label className={label}>Note (optional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={`${field} resize-none font-normal normal-case tracking-normal`} />
        </label>
      </div>
    </Modal>
  );
}
