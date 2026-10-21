import React, { useState } from 'react';
import Modal from '@/components/Modal';

interface HandoverModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly remaining: number;
  /** A group order: count the people who take their garments. */
  readonly people?: boolean;
  /** Release with a balance due: who took it is required, and a pay-by date can be set. */
  readonly release?: boolean;
  readonly busy: boolean;
  readonly onSave: (body: Record<string, unknown>) => Promise<boolean>;
}

const field = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';
const label = 'block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted';

/** Record the garments the customer is taking. Releasing only some keeps the order open. */
export default function HandoverModal({ isOpen, onClose, remaining, people, release, busy, onSave }: HandoverModalProps) {
  const [quantity, setQuantity] = useState(String(remaining));
  const [receivedBy, setReceivedBy] = useState('');
  const [note, setNote] = useState('');
  const [payBy, setPayBy] = useState('');
  const qty = Number(quantity);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={release ? 'Release with balance due' : 'Record handover'}
      maxWidth="max-w-md"
      footer={(
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-sm font-medium text-ink-body hover:text-ink">Cancel</button>
          <button type="button" disabled={busy || !(qty >= 1 && qty <= remaining) || (release && !receivedBy.trim())} onClick={async () => { if (await onSave({ quantity: qty, received_by: receivedBy.trim() || null, note: note.trim() || null, ...(release ? { release_with_balance: true, pay_by: payBy || null } : {}) })) onClose(); }} className="h-11 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{release ? 'Release the garments' : 'Confirm handover'}</button>
        </div>
      )}
    >
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">{people ? `${remaining} ${remaining === 1 ? 'person has' : 'people have'} not taken their garments yet.` : `${remaining} garment${remaining === 1 ? '' : 's'} left to hand over.`} If only some are released, the order stays open until the rest are done and corrected.</p>
        <label className={label}>{people ? 'People taking their garments now' : 'Garments handed over now'}
          <input type="number" inputMode="numeric" min={1} max={remaining} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={`${field} font-normal`} />
        </label>
        {release && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">The garments leave before the balance is paid. The order stays open until it is. Use this only when you agreed it with the customer.</p>}
        <label className={label}>{release ? <>Who took them <span className="text-danger">*</span></> : 'Received by'}
          <input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} maxLength={120} placeholder="Customer or who collected" className={`${field} font-normal normal-case tracking-normal`} />
        </label>
        {release && (
          <label className={label}>Balance to be paid by (optional)
            <input type="date" value={payBy} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setPayBy(e.target.value)} className={`${field} font-normal`} />
          </label>
        )}
        <label className={label}>Note (optional)
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={`${field} resize-none font-normal normal-case tracking-normal`} />
        </label>
      </div>
    </Modal>
  );
}
