import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { useStoreStaff } from './useStoreStaff';
import { CORRECTION_KIND_LABELS } from './readinessFormat';
import type { CorrectionKind } from './readinessTypes';

interface CorrectionModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly storeId: number;
  readonly kind: CorrectionKind;
  readonly busy: boolean;
  readonly onSave: (body: Record<string, unknown>) => Promise<boolean>;
}

const field = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';
const label = 'block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted';
const plain = 'normal-case tracking-normal font-normal';

const HELP: Record<CorrectionKind, string> = {
  defect: 'Say what does not match the approved design, measurements or specs. The order goes to Adjustment / Correction and comes back to Quality Check afterwards.',
  fitting_issue: 'Say what the customer found at the fitting or inspection. The order goes to Adjustment / Correction and back through Quality Check.',
  change_request: 'A change is quoted and approved before any work is done. Enter the additional price; the customer approves it, then it is added to the order.',
};

/** Record a defect, a fitting issue, or a customer change request. */
export default function CorrectionModal({ isOpen, onClose, storeId, kind, busy, onSave }: CorrectionModalProps) {
  const people = useStoreStaff(storeId);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [assignee, setAssignee] = useState('');
  const [target, setTarget] = useState('');
  const [amount, setAmount] = useState('');
  const [shopFault, setShopFault] = useState(true);
  const isChange = kind === 'change_request';

  const save = async () => {
    const ok = await onSave({
      description: description.trim(),
      affected_quantity: quantity ? Number(quantity) : null,
      assigned_user_id: assignee ? Number(assignee) : null,
      target_date: target || null,
      ...(isChange ? { kind, additional_amount: Number(amount) || 0 } : { shop_fault: shopFault }),
    });
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={CORRECTION_KIND_LABELS[kind]}
      maxWidth="max-w-lg"
      footer={(
        <div className="flex w-full justify-end gap-2">
          <button type="button" onClick={onClose} className="h-11 rounded-lg px-4 text-sm font-medium text-ink-body hover:text-ink">Cancel</button>
          <button type="button" disabled={busy || description.trim().length < 3 || (isChange && amount === '')} onClick={save} className="h-11 rounded-lg bg-espresso px-4 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-50">
            {isChange ? 'Quote change' : 'Record correction'}
          </button>
        </div>
      )}
    >
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">{HELP[kind]}</p>
        <label className={label}>{isChange ? 'What the customer wants added or changed' : 'What needs correcting'}
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={1000} className={`${field} ${plain} resize-none`} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={label}>Garments affected
            <input type="number" inputMode="numeric" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="All" className={`${field} ${plain}`} />
          </label>
          <label className={label}>{isChange ? 'Additional price (₱)' : 'Target date'}
            {isChange
              ? <input type="number" inputMode="decimal" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${field} ${plain}`} />
              : <input type="date" value={target} onChange={(e) => setTarget(e.target.value)} className={`${field} ${plain}`} />}
          </label>
        </div>
        <label className={label}>Assigned tailor
          <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={`${field} ${plain}`}>
            <option value="">Not assigned yet</option>
            {people.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.role}</option>)}
          </select>
        </label>
        {!isChange && (
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={shopFault} onChange={(e) => setShopFault(e.target.checked)} className="mt-0.5 h-4 w-4 accent-taupe" />
            The shop&apos;s mistake — corrected at no charge.
          </label>
        )}
      </div>
    </Modal>
  );
}
