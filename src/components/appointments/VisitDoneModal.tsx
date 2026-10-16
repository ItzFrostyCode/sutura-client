import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { ClipboardList, Loader2, MessageSquare, UserX } from 'lucide-react';
import { Appointment, TypeBadge } from './appointmentHelpers';

export type VisitResult = 'completed' | 'no_show';

interface Props {
  readonly isOpen: boolean;
  readonly apt: Appointment | null;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  /** Consultation only, or Didn't come. */
  readonly onSubmit: (aptId: number, result: VisitResult, notes: string, fittingNotes?: string) => Promise<void>;
  /** Proceed to Production Order: opens the order form; creating the order closes the visit. */
  readonly onProceed: (apt: Appointment) => void;
}

const btn = 'w-full min-h-[52px] px-4 flex items-center gap-3 border text-left text-base font-semibold transition-colors disabled:opacity-50';

/** "Done" for a visit: exactly three results. */
export default function VisitDoneModal({ isOpen, apt, isSubmitting, onClose, onSubmit, onProceed }: Props) {
  const [notes, setNotes] = useState('');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (apt) setNotes('');
  }, [apt]);

  if (!apt) return <Modal isOpen={isOpen} onClose={onClose} title="Done">{null}</Modal>;
  // A fitting or pickup made by a Production Order is closed on its own; it never starts another order.
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
          {!isProduction && (
            <button type="button" disabled={isSubmitting} onClick={() => onProceed(apt)} className={`${btn} bg-taupe text-white border-taupe hover:bg-taupe-hover`}>
              <ClipboardList size={18} /> Proceed to Production Order
            </button>
          )}
          <button type="button" disabled={isSubmitting} onClick={() => onSubmit(apt.id, 'completed', notes, fittingNotes)} className={`${btn} bg-surface text-ink border-line hover:border-taupe/50`}>
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <MessageSquare size={18} />}
            {isProduction ? 'Done' : 'Consultation only'}
          </button>
          <button type="button" disabled={isSubmitting} onClick={() => onSubmit(apt.id, 'no_show', notes)} className={`${btn} bg-surface text-rose-700 border-rose-200 hover:bg-rose-50`}>
            <UserX size={18} /> Didn&apos;t come
          </button>
        </div>
        {!isProduction && (
          <p className="text-xs text-ink-faint">Creating the Production Order closes this visit for you.</p>
        )}
      </div>
    </Modal>
  );
}
