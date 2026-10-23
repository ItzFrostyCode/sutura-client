import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { useShopRole } from '@/hooks/useShopRole';
import ConfirmClose from './detail/ConfirmClose';
import { Appointment, TypeBadge } from './appointmentHelpers';

export type VisitResult = 'completed' | 'no_show';

interface Props {
  readonly isOpen: boolean;
  readonly apt: Appointment | null;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  /** Consultation only. A visit that has started means the customer came, so there is no "didn't come" here. */
  readonly onSubmit: (aptId: number, result: VisitResult, notes: string, fittingNotes?: string) => Promise<void>;
  /** Proceed to Job Order: opens the order form; creating the order closes the visit. */
  readonly onProceed: (apt: Appointment) => void;
}

const btn = 'w-full min-h-[52px] px-4 flex items-center justify-center gap-3 border text-center text-base font-semibold transition-colors disabled:opacity-50';

/** "Done" for a visit: exactly three results. */
export default function VisitDoneModal({ isOpen, apt, isSubmitting, onClose, onSubmit, onProceed }: Props) {
  const [notes, setNotes] = useState('');
  const { isOwnerOrManager } = useShopRole();
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (apt) setNotes('');
  }, [apt]);

  if (!apt) return <Modal isOpen={isOpen} onClose={onClose} title="Done">{null}</Modal>;
  // A fitting or pickup made by a Job Order is closed on its own; it never starts another order.
  const isProduction = apt.kind === 'production' || apt.appointment_type === 'fitting' || apt.appointment_type === 'pickup';
  const fittingNotes = apt.appointment_type === 'fitting' ? notes : undefined;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Done">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-ink truncate">{apt.customer?.name}</p>
            <p className="text-xs text-ink-faint">
              {new Date(apt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })} · {apt.duration_minutes ?? 60} min
            </p>
          </div>
          <TypeBadge type={apt.appointment_type} label={apt.purpose_label} kind={apt.kind} />
        </div>

        <div>
          <label htmlFor="visit-notes" className="block text-sm font-medium text-ink-body mb-1">
            {apt.appointment_type === 'fitting' ? 'What needs adjusting (optional)' : 'Notes from the visit (optional)'}
          </label>
          <textarea
            id="visit-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-canvas border border-line px-4 py-2 text-base text-ink focus:outline-none focus:border-taupe resize-none"
          />
        </div>

        <p className="text-sm font-semibold text-ink">How did it end?</p>
        <div className="space-y-2.5">
          {!isProduction && isOwnerOrManager && (
            <button type="button" disabled={isSubmitting} onClick={() => onProceed(apt)} className={`${btn} bg-espresso text-white border-taupe hover:bg-espresso/90`}>
              Create Job Order
            </button>
          )}
          <ConfirmClose
            label={isProduction ? 'Done' : 'Consultation only — no order yet'}
            busy={isSubmitting}
            order={!isProduction}
            onConfirm={() => onSubmit(apt.id, 'completed', notes, fittingNotes)}
            className={`${btn} justify-center bg-surface text-ink border-line hover:border-taupe/50`}
          />
        </div>
        {!isProduction && (
          <p className="text-xs text-ink-faint">
            {isOwnerOrManager ? 'Creating the Job Order closes this visit for you.' : 'The owner or a branch manager makes the job order.'}
          </p>
        )}
      </div>
    </Modal>
  );
}
