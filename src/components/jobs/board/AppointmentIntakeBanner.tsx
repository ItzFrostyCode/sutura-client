'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Clock, Scissors } from 'lucide-react';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { cleanCustomerNotes } from '@/components/appointments/appointmentHelpers';
import { newOrderHref } from './newOrderHref';
import { BTN } from '@/components/shared/plainForm';

const SHOWN = 8;

const when = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
};

/** Completed consultations with no job order yet. Every one is listed with a button that opens the Create Job Order form already filled in. */
export default function AppointmentIntakeBanner({ appointments }: Readonly<{ appointments: Appointment[] }>) {
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
                {note && <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{note}</p>}
              </div>
              <Link href={newOrderHref(a)} className={`${BTN} mt-auto w-full`}>
                Create Job Order
              </Link>
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
