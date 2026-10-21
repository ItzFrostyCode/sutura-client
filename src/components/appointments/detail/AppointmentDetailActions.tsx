'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package } from 'lucide-react';
import { realEmail, type Appointment } from '../appointmentHelpers';
import { nextStep } from '../nextStep';
import FinishVisit from './FinishVisit';

interface AppointmentDetailActionsProps {
  readonly apt: Appointment;
  readonly canAssign: boolean;
  readonly actionLoadingId?: number | null;
  readonly onCheckInClick?: (aptId: number) => void;
  readonly onCreateJob?: (apt: Appointment) => void;
  readonly onRescheduleClick?: () => void;
  readonly onFollowUp?: (apt: Appointment) => void;
  readonly onDidntComeClick?: (apt: Appointment) => void;
  readonly onCancelClick?: () => void;
  readonly onCompleteClick?: (apt: Appointment) => void;
  /** Finishes the visit in place (Consultation only / Didn't come), with its note. */
  readonly onFinish?: (apt: Appointment, result: 'completed' | 'no_show', notes: string) => Promise<void>;
  /** A walk-in visit started by mistake: remove it completely. */
  readonly onDiscard?: (apt: Appointment) => void;
  readonly onConfirmReview?: (aptId: number) => Promise<boolean>;
  readonly onRejectClick?: () => void;
}

const PRIMARY = 'w-full inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-espresso px-4 text-sm font-semibold text-white transition-colors hover:bg-espresso/90 disabled:opacity-50';
const SECONDARY = 'w-full inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border border-espresso/30 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-sunken';

/** What to do with this appointment: the one next step on top, the rest below it. */
export default function AppointmentDetailActions({
  apt, canAssign, actionLoadingId, onCheckInClick, onCreateJob, onRescheduleClick, onFollowUp, onDidntComeClick, onCancelClick, onCompleteClick, onFinish, onDiscard, onConfirmReview, onRejectClick,
}: Readonly<AppointmentDetailActionsProps>) {
  const router = useRouter();
  const busy = actionLoadingId === apt.id;
  const step = nextStep(apt, canAssign);
  const open = ['pending', 'confirmed'].includes(apt.status);
  // A follow-up is a visit for later: it needs a way to reach the customer, and a walk-in who is here now has nothing to come back for yet.
  const canFollowUp = Boolean(apt.customer?.phone?.trim() || realEmail(apt.customer?.email)) && !(apt.intake_channel === 'walk_in' && apt.status === 'in_progress');

  const runStep = () => {
    if (!step) return;
    if (step.key === 'approve') onConfirmReview?.(apt.id);
    else if (step.key === 'arrived') onCheckInClick?.(apt.id);
    else if (step.key === 'done') onCompleteClick?.(apt);
    else onCreateJob?.(apt);
  };

  const others = [
    apt.status === 'pending' && canAssign && onRejectClick && { key: 'decline', label: 'Decline request', run: onRejectClick, danger: true },
    open && onRescheduleClick && { key: 'reschedule', label: 'Reschedule', run: onRescheduleClick },
    ['confirmed', 'in_progress', 'completed'].includes(apt.status) && onFollowUp && canFollowUp && { key: 'follow', label: 'Schedule a follow-up visit', run: () => onFollowUp(apt) },
    apt.status === 'confirmed' && onDidntComeClick && { key: 'noshow', label: 'Customer didn’t come', run: () => onDidntComeClick(apt), danger: true },
    open && canAssign && onCancelClick && { key: 'cancel', label: 'Cancel this booking', run: onCancelClick, danger: true },
    // Started by mistake: the customer never really sat down. Only a walk-in with nothing made from it (the server checks too).
    ['confirmed', 'in_progress'].includes(apt.status) && apt.intake_channel === 'walk_in' && apt.kind !== 'production' && !apt.job_order_id && onDiscard && { key: 'discard', label: 'Started by mistake — remove this visit', run: () => onDiscard(apt), danger: true },
    // Another piece of work for the same customer: a fresh job order, not tied to this visit (this visit keeps its own).
    // While the visit is on, Create Job Order is one of the ways to finish it, right above: no second button for it.
  ].filter(Boolean) as { key: string; label: string; run: () => void; danger?: boolean }[];

  if (!step && !apt.job_order_id && others.length === 0) return null;

  return (
    <div className="space-y-3">
      {step && (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">{step.key === 'done' ? 'Finish the visit' : 'Next'}</p>
          {step.key === 'done' && onFinish && onCreateJob ? (
            <FinishVisit apt={apt} busy={busy} onFinish={onFinish} onCreateJob={onCreateJob} />
          ) : (
            <button type="button" disabled={busy} onClick={runStep} className={PRIMARY}>
              {busy && <Loader2 size={17} className="animate-spin" />}
              {step.label}
            </button>
          )}
        </div>
      )}

      {apt.job_order_id && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <span className="flex items-center gap-2 font-semibold"><Package size={15} className="text-emerald-700" />Job order made</span>
          <span className="font-mono font-bold text-emerald-800">#{apt.job_order?.order_number || apt.job_order_id}</span>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-2 border-t border-line pt-3">
          {others.map((o) => (
            <button key={o.key} type="button" onClick={o.run} disabled={busy} className={`${SECONDARY} ${o.danger ? '!border-danger/30 !text-danger hover:!bg-danger/5' : ''}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
