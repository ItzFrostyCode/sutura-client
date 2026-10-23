'use client';

import React from 'react';
import type { Appointment } from '@/components/appointments/appointmentHelpers';
import { cleanCustomerNotes } from '@/components/appointments/appointmentHelpers';
import ConsultationActions from './ConsultationActions';
import ConsultationFacts from './ConsultationFacts';

const when = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return iso;
  }
};

interface ConsultationCardProps {
  readonly appointment: Appointment;
  /** Takes the card out of the lane once the visit is marked "No order". */
  readonly onRemove: (id: number) => void;
}

/** A finished consultation with no job order yet, shaped like the order cards: when, who, what, one status pill, the facts and what is missing, and the one main button. */
export default function ConsultationCard({ appointment: a, onRemove }: ConsultationCardProps) {
  const note = cleanCustomerNotes(a.notes);
  const qty = a.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) ?? 0;
  return (
    <li className="space-y-2 rounded-xl border border-line bg-surface p-4 shadow-2xs">
      <p className="text-[13px] text-ink-muted">Consultation · {when(a.scheduled_at)}</p>
      <p className="truncate text-[17px] font-semibold leading-snug text-ink">{a.customer.name}</p>
      <p className="line-clamp-2 text-[13px] text-ink-body">{qty > 1 ? `${qty} × ` : ''}{a.catalog_item?.name ?? a.service?.name ?? 'Custom Tailoring'}</p>
      <p className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 text-xs font-medium text-amber-700">
        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
        <span className="truncate">Visit done — no order yet</span>
      </p>
      <ConsultationFacts appointment={a} />
      {note && <p className="line-clamp-2 text-[13px] text-ink-muted">{note}</p>}
      <div className="pt-1.5">
        <ConsultationActions appointment={a} onRemove={onRemove} />
      </div>
    </li>
  );
}
