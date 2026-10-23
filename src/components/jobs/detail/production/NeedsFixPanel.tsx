import React, { useState } from 'react';
import { BTN, BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';
import RadioGroup from '../../ui/RadioGroup';
import PesoInput from '../../readiness/PesoInput';

interface NeedsFixPanelProps {
  /** Owner / branch manager only: staff do not see the "customer's request" choice. */
  readonly canCharge: boolean;
  readonly busy: boolean;
  /** Both resolve true when the server took it. */
  readonly onShopFix: (body: Record<string, unknown>) => Promise<boolean>;
  readonly onChargedFix: (body: Record<string, unknown>) => Promise<boolean>;
  readonly onClose: () => void;
}

/** "Needs a fix" at the quality check or from the fitting / handover, in place: what, which pieces, and whose reason it is. */
export default function NeedsFixPanel({ canCharge, busy, onShopFix, onChargedFix, onClose }: NeedsFixPanelProps) {
  const [note, setNote] = useState('');
  const [pieces, setPieces] = useState('');
  const [whose, setWhose] = useState<'shop' | 'customer'>('shop');
  const [amount, setAmount] = useState(0);
  const charged = canCharge && whose === 'customer';
  const missing = note.trim().length < 3 ? 'Say what needs fixing.' : charged && amount <= 0 ? 'Enter the extra charge.' : '';
  const qty = pieces ? Number(pieces) : null;

  const send = async () => {
    const ok = charged
      ? await onChargedFix({ description: note.trim(), affected_quantity: qty, additional_amount: amount })
      // `note` is what the quality check wants, `description` what a fitting issue wants; each ignores the other.
      : await onShopFix({ note: note.trim(), description: note.trim(), affected_quantity: qty, shop_fault: true });
    if (ok) onClose();
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="fix-note" className={PLAIN_LABEL}>What needs fixing?</label>
        <textarea id="fix-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} autoFocus className={`${PLAIN_FIELD} h-auto resize-none py-2.5`} />
      </div>
      <div className="max-w-xs">
        <label htmlFor="fix-pieces" className={PLAIN_LABEL}>Which pieces / people <span className="font-normal text-ink-muted">(optional)</span></label>
        <input id="fix-pieces" type="number" inputMode="numeric" min={1} value={pieces} onChange={(e) => setPieces(e.target.value)} placeholder="All" className={PLAIN_FIELD} />
      </div>
      <RadioGroup
        name="fix-whose" legend="Whose reason?" value={whose} onChange={(v) => setWhose(v === 'customer' ? 'customer' : 'shop')}
        options={[
          { value: 'shop', label: 'Shop’s mistake (free)', hint: 'The shop fixes it at no charge.' },
          ...(canCharge ? [{ value: 'customer', label: 'Customer’s request (charged)', hint: 'The customer approves the extra price first. It is added to the balance once approved.' }] : []),
        ]}
      />
      {charged && (
        <div className="max-w-xs">
          <span className={PLAIN_LABEL}>Extra charge</span>
          <PesoInput ariaLabel="Extra charge" value={amount} onChange={setAmount} />
        </div>
      )}
      {missing && <p className="text-[13px] text-ink-muted">{missing}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={Boolean(missing) || busy} onClick={send} className={BTN_PRIMARY}>{charged ? 'Quote the change' : 'Send to fixing'}</button>
        <button type="button" disabled={busy} onClick={onClose} className={BTN}>Cancel</button>
      </div>
    </div>
  );
}
