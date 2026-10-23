'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import FollowUpAppointmentModal from '@/components/appointments/FollowUpAppointmentModal';
import { getLocalDateString, minTimeForDate, type Appointment } from '@/components/appointments/appointmentHelpers';
import { BTN_PRIMARY, BTN_SM, PLAIN_FIELD } from '@/components/shared/plainForm';
import { useShopRole } from '@/hooks/useShopRole';
import { newOrderHref } from './newOrderHref';
import { useConsultationActions } from './useConsultationActions';

/** The three things to do with a finished consultation: Create Job Order (owner / manager only, the one main button), No order (asks for an optional reason in place), Book another visit. */
export default function ConsultationActions({ appointment: a, onRemove }: Readonly<{ appointment: Appointment; onRemove: (id: number) => void }>) {
  const x = useConsultationActions(a, onRemove);
  const { isOwnerOrManager } = useShopRole();
  const today = getLocalDateString(new Date());

  return (
    <div className="space-y-2 border-t border-line pt-3">
      {isOwnerOrManager ? (
        <Link href={newOrderHref(a)} className={`${BTN_PRIMARY} w-full`}>
          <Plus size={16} />Create Job Order
        </Link>
      ) : (
        <p className="text-[13px] text-ink-muted">The owner or a branch manager makes the job order.</p>
      )}

      {x.asking ? (
        <div className="space-y-2 rounded-lg bg-sunken/70 p-3">
          <p className="text-[13px] text-ink-body">The customer did not go ahead with an order? This visit leaves the Consultation list.</p>
          <label className="block">
            <span className="mb-1 block text-[13px] text-ink-muted">Reason (optional)</span>
            <input
              type="text"
              value={x.note}
              maxLength={500}
              onChange={(e) => x.setNote(e.target.value)}
              disabled={x.busy}
              placeholder="e.g. Found a cheaper price"
              className={PLAIN_FIELD}
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={x.confirmNoOrder} disabled={x.busy} className={`${BTN_SM} flex-1`}>
              {x.busy ? 'Saving…' : 'Confirm no order'}
            </button>
            <button type="button" onClick={x.cancelNoOrder} disabled={x.busy} className={`${BTN_SM} flex-1`}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => x.setAsking(true)} className={`${BTN_SM} flex-1 whitespace-nowrap`}>No order</button>
          <button type="button" onClick={() => x.setFollowUpOpen(true)} className={`${BTN_SM} flex-1 whitespace-nowrap`}>Book another visit</button>
        </div>
      )}

      {x.followUpOpen && (
        <FollowUpAppointmentModal
          isOpen
          onClose={() => x.setFollowUpOpen(false)}
          todayStr={today}
          minTimeFor={(d) => minTimeForDate(d, today)}
          presetCustomerId={a.customer.id}
          presetCustomerName={a.customer.name}
          onSubmit={x.bookFollowUp}
          isSubmitting={x.followUpBusy}
          error=""
        />
      )}
    </div>
  );
}
