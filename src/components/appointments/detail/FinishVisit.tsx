'use client';

import React, { useState } from 'react';
import type { Appointment } from '../appointmentHelpers';
import { useShopRole } from '@/hooks/useShopRole';
import ConfirmClose from './ConfirmClose';

const BTN = 'flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-3 rounded-xl border px-4 text-center text-[15px] font-semibold transition-colors disabled:opacity-50';

interface Props {
  readonly apt: Appointment;
  readonly busy: boolean;
  /** "Consultation only": the visit is done and no order is made yet. */
  readonly onFinish: (apt: Appointment, result: 'completed' | 'no_show', notes: string) => Promise<void>;
  /** Opens Create Job Order; making the order closes the visit. */
  readonly onCreateJob: (apt: Appointment) => void;
}

/** The whole "Done" in place: a note, then how the visit ended. No pop-up. */
export default function FinishVisit({ apt, busy, onFinish, onCreateJob }: Props) {
  const [notes, setNotes] = useState('');
  const { isOwnerOrManager } = useShopRole();
  // A fitting or pick-up a job order made closes on its own and never starts another order.
  const madeByOrder = apt.kind === 'production' || apt.appointment_type === 'fitting' || apt.appointment_type === 'pickup';

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="visit-notes" className="mb-1.5 block text-[13px] font-medium text-ink-muted">Notes from the visit <span className="font-normal text-ink-faint">(optional)</span></label>
        <textarea id="visit-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full resize-none rounded-lg border border-espresso/[0.12] bg-white px-3 py-2 text-base sm:text-sm text-ink focus:border-taupe focus:outline-none focus:ring-2 focus:ring-taupe/20" />
      </div>
      <p className="text-sm font-semibold text-ink">How did it end?</p>
      {!madeByOrder && isOwnerOrManager && (
        <button type="button" disabled={busy} onClick={() => onCreateJob(apt)} className={`${BTN} border-taupe bg-espresso text-white hover:bg-espresso/90`}>
          Create Job Order
        </button>
      )}
      <ConfirmClose
        label={madeByOrder ? 'Done' : 'Consultation only — no order yet'}
        busy={busy}
        order={!madeByOrder}
        onConfirm={() => onFinish(apt, 'completed', notes)}
        className={`${BTN} border-espresso/[0.12] bg-white text-ink hover:border-taupe/50`}
      />
      {!madeByOrder && isOwnerOrManager && <p className="text-xs text-ink-faint">Creating the Job Order closes this visit for you.</p>}
      {!madeByOrder && !isOwnerOrManager && <p className="text-xs text-ink-faint">The owner or a branch manager makes the job order.</p>}
    </div>
  );
}
