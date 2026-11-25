'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Receipt, Undo2 } from 'lucide-react';
import Modal from '@/components/Modal';
import AuthImage from '@/components/shared/AuthImage';
import api from '@/lib/axios';
import type { UpgradeRequest } from './billingTypes';

const STATUS = {
  pending: { label: 'Waiting for confirmation', Icon: Clock, tone: 'text-amber-800 bg-amber-50 border-amber-300' },
  approved: { label: 'Paid', Icon: CheckCircle2, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Not accepted', Icon: XCircle, tone: 'text-red-700 bg-red-50 border-red-200' },
  cancelled: { label: 'Cancelled', Icon: XCircle, tone: 'text-ink-muted bg-sunken border-line' },
} as const;

const peso = (n: string | number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// Paid in SUTURA with GCash shows as plain "GCash"; a screenshot upload as "GCash · Receipt".
const method = (r: UpgradeRequest) => (r.channel === 'online' ? 'GCash' : 'GCash · Receipt');

function refundNote(r: UpgradeRequest): string | null {
  if (!r.refund_status || r.refund_amount == null) return null;
  const amount = peso(r.refund_amount);
  if (r.refund_status === 'succeeded') return `${amount} refunded to your GCash${r.refunded_at ? ` on ${day(r.refunded_at)}` : ''}.`;
  if (r.refund_status === 'pending') return `Refund of ${amount} on its way to your GCash.`;
  return `The refund of ${amount} needs attention. The SUTURA team will contact you.`;
}

// The owner's payment history for plan changes, with the receipt they attached (receipt uploads only).
export default function UpgradeRequestsSection({ requests, storeId }: Readonly<{ requests: UpgradeRequest[]; storeId?: number }>) {
  const [viewing, setViewing] = useState<UpgradeRequest | null>(null);
  if (requests.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5"><Receipt size={12} /> Your Payments</p>
      <ul className="border border-line bg-white divide-y divide-line">
        {requests.map((r) => {
          const s = STATUS[r.status] ?? STATUS.pending;
          const refund = refundNote(r);
          return (
            <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{r.plan?.name ?? 'Plan'} · {r.billing_cycle} · {peso(r.quoted_price)}</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  {method(r)}
                  {' · '}
                  {r.type === 'new_shop' ? 'Sent with your shop application' : `${r.channel === 'online' ? 'Paid' : 'Sent'} ${day(r.created_at)}`}
                  {r.payment_reference ? ` · Ref ${r.payment_reference}` : ''}
                  {r.status === 'approved' && r.billing_period_start && r.billing_period_end ? ` · Covers ${day(r.billing_period_start)} – ${day(r.billing_period_end)}` : ''}
                </p>
                {r.status === 'rejected' && r.rejection_reason && <p className="text-xs text-red-700 mt-1">{r.rejection_reason}</p>}
                {refund && <p className="text-xs text-ink-body mt-1 flex items-center gap-1.5"><Undo2 size={12} className="shrink-0 text-taupe" /> {refund}</p>}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold w-fit ${s.tone}`}><s.Icon size={13} /> {s.label}</span>
              {r.channel !== 'online' && (
                <button type="button" onClick={() => setViewing(r)} className="h-10 px-4 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer">
                  View receipt
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Modal isOpen={viewing !== null} onClose={() => setViewing(null)} title="Your receipt" maxWidth="max-w-lg">
        {viewing && storeId && (
          <AuthImage
            key={viewing.id}
            alt="GCash receipt you attached"
            className="w-full max-h-[70vh] object-contain border border-line bg-sunken"
            load={() => api.get(`/stores/${storeId}/subscription/upgrade-requests/${viewing.id}/receipt`, { responseType: 'blob' }).then((res) => res.data)}
          />
        )}
      </Modal>
    </section>
  );
}
