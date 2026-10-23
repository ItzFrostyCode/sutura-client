import React from 'react';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { consultationFacts, consultationMissing } from './consultationInfo';

/** The facts line (muted) and, when something the order form needs is not known yet, an amber "Missing: ..." line. */
export default function ConsultationFacts({ appointment }: Readonly<{ appointment: Appointment }>) {
  const facts = consultationFacts(appointment);
  const missing = consultationMissing(appointment);
  return (
    <>
      {facts.length > 0 && <p className="text-[13px] text-ink-muted">{facts.join(' · ')}</p>}
      {missing.length > 0 && <p className="text-[13px] text-amber-700">Missing: {missing.join(', ')}</p>}
    </>
  );
}
