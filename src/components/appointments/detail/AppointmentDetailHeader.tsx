'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { AppleBar } from '@/components/jobs/ui/ApplePage';
import { Appointment, TypeBadge, StatusBadge, CheckInBadge } from '../appointmentHelpers';

/** The title row of an appointment, inside the main panel: back, and where it stands. Who it is for is in one place: the customer card. */
export default function AppointmentDetailHeader({ apt, onBack }: Readonly<{ apt: Appointment; onBack: () => void }>) {
  return (
    <AppleBar flush>
      <button type="button" onClick={onBack} aria-label="Back to appointments" className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-espresso/[0.05] hover:text-ink">
        <ArrowLeft size={20} />
      </button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-[28px]">Appointment</h1>
      </div>
      <div className="flex basis-full flex-wrap items-center gap-2 sm:basis-auto">
        <TypeBadge type={apt.appointment_type} label={apt.purpose_label} kind={apt.kind} />
        <StatusBadge status={apt.status} scheduledAt={apt.scheduled_at} jobOrderId={apt.job_order_id} jobStatus={apt.job_order?.status} kind={apt.kind} type={apt.appointment_type} />
        <CheckInBadge checkedInAt={apt.checked_in_at} scheduledAt={apt.scheduled_at} />
      </div>
    </AppleBar>
  );
}
