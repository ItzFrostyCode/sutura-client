import React, { useState } from 'react';
import { BTN, BTN_PRIMARY, PLAIN_FIELD, PLAIN_LABEL } from '@/components/shared/plainForm';

interface HoldPanelProps {
  readonly busy: boolean;
  /** Resolves true when the server put the order on hold. */
  readonly onHold: (reason: string) => Promise<boolean>;
  readonly onClose: () => void;
}

/** Put the order on hold, in place: a reason is required, and Resume later brings it back to the same step. */
export default function HoldPanel({ busy, onHold, onClose }: HoldPanelProps) {
  const [reason, setReason] = useState('');
  const ok = reason.trim().length >= 3;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="hold-reason" className={PLAIN_LABEL}>Why is it on hold?</label>
        <textarea
          id="hold-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={2000} autoFocus
          placeholder="e.g. waiting for the customer to confirm a change"
          className={`${PLAIN_FIELD} h-auto resize-none py-2.5`}
        />
        {!ok && <p className="mt-1.5 text-[13px] text-ink-muted">Write a short reason to put the order on hold.</p>}
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!ok || busy} onClick={async () => { if (await onHold(reason.trim())) onClose(); }} className={BTN_PRIMARY}>Hold</button>
        <button type="button" disabled={busy} onClick={onClose} className={BTN}>Keep working</button>
      </div>
    </div>
  );
}
