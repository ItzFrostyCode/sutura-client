'use client';

import React, { useState } from 'react';
import { Clock, Scissors } from 'lucide-react';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { cleanCustomerNotes } from '@/components/appointments/appointmentHelpers';
import ConsultationActions from './ConsultationActions';
import ConsultationFacts from './ConsultationFacts';

const SHOWN = 8;

const when = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
};

/** Consultations with no job order yet. Each one has Create Job Order (form filled in), No order, and Book another visit. */
export default function AppointmentIntakeBanner({ appointments, onRemove }: Readonly<{ appointments: Appointment[]; onRemove: (id: number) => void }>) {
  const [all, setAll] = useState(false);
  if (appointments.length === 0) return null;
  const shown = all ? appointments : appointments.slice(0, SHOWN);

  return (
    <section aria-label="Consultations ready for a job order" className="rounded-xl border border-espresso/[0.08] bg-white">
      <header className="flex items-center gap-2 border-b border-espresso/[0.06] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-ink">Consultations ready for a job order</h2>
        <span className="rounded-full bg-espresso/[0.06] px-2 py-0.5 text-xs font-medium text-ink-muted">{appointments.length}</span>
      </header>
      <ul className="grid divide-y divide-espresso/[0.06] sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
        {shown.map((a) => {
          const note = cleanCustomerNotes(a.notes);
          const qty = a.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 0;
          return (
            <li key={a.id} className="flex flex-col gap-2 p-4 sm:border-b sm:border-r sm:border-espresso/[0.06]">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{a.customer.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-ink-body">
                  <Scissors size={12} className="shrink-0 text-ink-faint" />
                  <span className="truncate">{qty > 1 ? `${qty} × ` : ''}{a.catalog_item?.name ?? a.service?.name ?? 'Custom Tailoring'}</span>
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-muted"><Clock size={12} className="shrink-0" />{when(a.scheduled_at)}</p>
                <div className="mt-1 space-y-1"><ConsultationFacts appointment={a} /></div>
                {note && <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{note}</p>}
              </div>
              <div className="mt-auto"><ConsultationActions appointment={a} onRemove={onRemove} /></div>
            </li>
          );
        })}
      </ul>
      {appointments.length > SHOWN && (
        <button type="button" onClick={() => setAll((v) => !v)} className="h-11 w-full cursor-pointer border-t border-espresso/[0.06] text-sm font-medium text-espresso hover:bg-espresso/[0.03]">
          {all ? 'Show fewer' : `Show all ${appointments.length}`}
        </button>
      )}
    </section>
  );
}
