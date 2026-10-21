'use client';

import React from 'react';
import type { Appointment, StaffData } from './appointmentHelpers';
import { cleanCustomerNotes } from './appointmentHelpers';
import AppointmentDetailHeader from './detail/AppointmentDetailHeader';
import AppointmentJourney from './detail/AppointmentJourney';
import RequestStep, { hasRequest } from './detail/RequestStep';
import VisitStep from './detail/VisitStep';
import AfterVisitStep from './detail/AfterVisitStep';
import CustomerCard from './detail/CustomerCard';
import EndedNotice from './detail/EndedNotice';
import AppointmentDetailActions from './detail/AppointmentDetailActions';
import { CARD } from './detail/StepCard';
import { APPOINTMENTS_COLUMN } from './pageColumn';

interface AppointmentDetailPanelProps {
  readonly apt: Appointment;
  readonly onBack: () => void;
  readonly storeSlug?: string;
  readonly storeOwner: { id: number; name: string } | null;
  readonly staff: StaffData[];
  readonly canAssign: boolean;
  readonly onAssign: (aptId: number, staffId: number | null) => Promise<boolean>;
  readonly actionLoadingId: number | null;
  readonly onConfirmReview: (aptId: number) => Promise<boolean>;
  readonly onRejectClick: () => void;
  readonly onRescheduleClick: () => void;
  readonly onCheckInClick?: (aptId: number) => void;
  readonly onCreateJob?: (apt: Appointment) => void;
  readonly onDidntComeClick?: (apt: Appointment) => void;
  readonly onCompleteClick?: (apt: Appointment) => void;
  readonly onFinish?: (apt: Appointment, result: 'completed' | 'no_show', notes: string) => Promise<void>;
  /** A walk-in visit started by mistake: remove it completely. */
  readonly onDiscard?: (apt: Appointment) => void;
  readonly onCancelClick?: () => void;
  readonly onFollowUp?: (apt: Appointment) => void;
  /** The consultation notes saved themselves: refresh the list. */
  readonly onAppointmentUpdated?: () => void;
}

/**
 * One appointment, in the same full-width frame as the list. The path on top, then three numbered steps
 * (Request → Visit → After the visit) on the left; on the right, what to do next and who the customer is.
 */
export default function AppointmentDetailPanel({
  apt, onBack, storeSlug, storeOwner, staff, canAssign, onAssign, actionLoadingId, onConfirmReview, onRejectClick, onRescheduleClick,
  onCheckInClick, onCreateJob, onDidntComeClick, onCompleteClick, onFinish, onCancelClick, onFollowUp, onAppointmentUpdated, onDiscard,
}: Readonly<AppointmentDetailPanelProps>) {
  const ended = ['rejected', 'cancelled', 'no_show'].includes(apt.status);
  const customerNotes = cleanCustomerNotes(apt.notes);
  // A walk-in who just sat down has asked for nothing yet: no Request step, so the Visit is step 1.
  const asked = hasRequest(apt, customerNotes);

  return (
    <div className={`${APPOINTMENTS_COLUMN} pb-10`}>
      <AppointmentDetailHeader apt={apt} onBack={onBack} />
      <div className="space-y-4 pt-3 sm:space-y-6 sm:pt-4">
        <EndedNotice apt={apt} />
        <AppointmentJourney apt={apt} />
      </div>
      <div className="grid items-start gap-4 pt-4 sm:gap-6 sm:pt-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-8">
          {asked && <RequestStep apt={apt} storeSlug={storeSlug} customerNotes={customerNotes} />}
          {!ended && <VisitStep n={asked ? 2 : 1} apt={apt} staff={staff} storeOwner={storeOwner} canAssign={canAssign} onAssign={onAssign} onSaved={onAppointmentUpdated} />}
          {!ended && <AfterVisitStep n={asked ? 3 : 2} apt={apt} />}
        </div>

        <aside className="order-first flex min-w-0 flex-col gap-4 sm:gap-6 lg:sticky lg:top-4 lg:order-none lg:col-span-4">
          {!ended && (
            <section className={`${CARD} p-4 sm:p-5`}>
              <AppointmentDetailActions
                apt={apt}
                canAssign={canAssign}
                actionLoadingId={actionLoadingId}
                onCheckInClick={onCheckInClick}
                onCreateJob={onCreateJob}
                onRescheduleClick={onRescheduleClick}
                onFollowUp={onFollowUp}
                onDidntComeClick={onDidntComeClick}
                onCancelClick={onCancelClick}
                onCompleteClick={onCompleteClick}
                onFinish={onFinish}
                onDiscard={onDiscard}
                onConfirmReview={onConfirmReview}
                onRejectClick={onRejectClick}
              />
            </section>
          )}
          <div className="order-first lg:order-last"><CustomerCard apt={apt} onSaved={onAppointmentUpdated} /></div>
        </aside>
      </div>
    </div>
  );
}
