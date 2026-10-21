'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * "Consultation only" ends the visit, so one tap is not enough: the first tap asks, the second closes. Someone trying the
 * buttons out for the first time should be able to back out. (An order can still be made from the visit afterwards.)
 */
export default function ConfirmClose({ label, busy, onConfirm, className, order = true }: Readonly<{ label: string; busy: boolean; onConfirm: () => void; className: string; /** False for a fitting or pick-up an order made: there is no "order" to talk about. */ order?: boolean }>) {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return <button type="button" disabled={busy} onClick={() => setAsking(true)} className={className}>{label}</button>;
  }
  return (
    <div role="alertdialog" aria-label="Close this visit?" className="space-y-3 rounded-xl border border-espresso/30 bg-white p-4">
      <p className="text-sm font-semibold text-ink">{order ? 'Close this visit without an order?' : 'Mark this visit done?'}</p>
      <p className="text-[13px] text-ink-muted">{order ? 'The visit ends here. If the customer decides to go ahead, you can still create a job order from this appointment.' : 'The visit closes here.'}</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAsking(false)} className="h-11 flex-1 cursor-pointer rounded-lg border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken">Go back</button>
        <button type="button" disabled={busy} onClick={onConfirm} className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-espresso text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />}{order ? 'Yes, close the visit' : 'Yes, done'}
        </button>
      </div>
    </div>
  );
}
