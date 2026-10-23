import React, { useState } from 'react';
import { BTN, BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import { confirmDialog } from '@/store/useConfirmStore';
import { peso } from '../readinessFormat';

interface HandoverPanelProps {
  readonly remaining: number;
  /** A group order counts the people who take their garments. */
  readonly people: boolean;
  /** Release with the balance still due: who took them and a pay-by date are required. */
  readonly release?: boolean;
  readonly balance: number;
  readonly busy: boolean;
  /** Resolves true when the server took it. */
  readonly onSave: (body: Record<string, unknown>) => Promise<boolean>;
  readonly onClose: () => void;
}

/** Record the garments the customer is taking, in place. With "release" they leave before the balance is paid (owner / branch manager only). */
export default function HandoverPanel({ remaining, people, release, balance, busy, onSave, onClose }: HandoverPanelProps) {
  const [quantity, setQuantity] = useState(String(remaining));
  const [receivedBy, setReceivedBy] = useState('');
  const [payBy, setPayBy] = useState('');
  const [note, setNote] = useState('');
  const qty = Number(quantity);
  const today = new Date().toISOString().slice(0, 10);
  let missing = '';
  if (!(Number.isInteger(qty) && qty >= 1 && qty <= remaining)) missing = `Enter a number from 1 to ${remaining}.`;
  else if (release && !receivedBy.trim()) missing = 'Say who took the garments.';
  else if (release && !payBy) missing = 'Choose the date the balance will be paid by.';

  const send = async () => {
    if (release && !(await confirmDialog({
      title: 'Release with the balance still due?',
      message: `The garments leave before ${peso(balance)} is paid, due by ${new Date(payBy).toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })}. The order stays open until it is paid.`,
      confirmLabel: 'Release the garments',
    }))) return;
    const ok = await onSave({ quantity: qty, received_by: receivedBy.trim() || null, note: note.trim() || null, ...(release ? { release_with_balance: true, pay_by: payBy } : {}) });
    if (ok) onClose();
  };

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-ink-muted">
        {people ? `${remaining} ${remaining === 1 ? 'person has' : 'people have'} not taken their garments yet.` : `${remaining} garment${remaining === 1 ? '' : 's'} left to hand over.`} If only some go now, the order stays open for the rest.
      </p>
      <div className="max-w-xs">
        <label htmlFor="handover-qty" className={PLAIN_LABEL}>{people ? 'People taking their garments now' : 'Garments handed over now'}</label>
        <input id="handover-qty" type="number" inputMode="numeric" min={1} max={remaining} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus className={PLAIN_FIELD} />
      </div>
      <div>
        <label htmlFor="handover-by" className={PLAIN_LABEL}>{release ? 'Who took them' : 'Received by'}{!release && <span className="font-normal text-ink-muted"> (optional)</span>}</label>
        <input id="handover-by" value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} maxLength={120} placeholder="Customer or who collected" className={PLAIN_FIELD} />
      </div>
      {release && (
        <div className="max-w-xs">
          <label htmlFor="handover-payby" className={PLAIN_LABEL}>Balance to be paid by</label>
          <input id="handover-payby" type="date" min={today} value={payBy} onChange={(e) => setPayBy(e.target.value)} className={PLAIN_FIELD} />
        </div>
      )}
      <div>
        <label htmlFor="handover-note" className={PLAIN_LABEL}>Note <span className="font-normal text-ink-muted">(optional)</span></label>
        <textarea id="handover-note" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={`${PLAIN_FIELD} h-auto resize-none py-2.5`} />
      </div>
      {missing && <p className="text-[13px] text-ink-muted">{missing}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={Boolean(missing) || busy} onClick={send} className={BTN_PRIMARY}>{release ? 'Release the garments' : 'Confirm handover'}</button>
        <button type="button" disabled={busy} onClick={onClose} className={BTN}>Cancel</button>
      </div>
    </div>
  );
}
