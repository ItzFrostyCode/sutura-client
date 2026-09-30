'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Receipt } from 'lucide-react';
import Modal from '@/components/Modal';
import AuthImage from '@/components/shared/AuthImage';
import api from '@/lib/axios';
import type { UpgradeRequest } from './billingTypes';

const STATUS = {
  pending: { label: 'Waiting for confirmation', Icon: Clock, tone: 'text-amber-800 bg-amber-50 border-amber-300' },
  approved: { label: 'Approved', Icon: CheckCircle2, tone: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
  rejected: { label: 'Not accepted', Icon: XCircle, tone: 'text-red-700 bg-red-50 border-red-200' },
} as const;

const peso = (n: string | number) => `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// The owner's payment history for plan changes, with the receipt they attached.
export default function UpgradeRequestsSection({ requests, storeId }: Readonly<{ requests: UpgradeRequest[]; storeId?: number }>) {
  const [viewing, setViewing] = useState<UpgradeRequest | null>(null);
  if (requests.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe flex items-center gap-1.5"><Receipt size={12} /> Your Payments</p>
      <ul className="border border-line bg-white divide-y divide-line">
        {requests.map((r) => {
          const s = STATUS[r.status];
          return (
            <li key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink">{r.plan?.name ?? 'Plan'} · {r.billing_cycle} · {peso(r.quoted_price)}</p>
                <p className="text-xs text-ink-muted mt-0.5">Sent {day(r.created_at)}{r.payment_reference ? ` · Ref ${r.payment_reference}` : ''}</p>
                {r.status === 'rejected' && r.rejection_reason && <p className="text-xs text-red-700 mt-1">{r.rejection_reason}</p>}
              </div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold w-fit ${s.tone}`}><s.Icon size={13} /> {s.label}</span>
              <button type="button" onClick={() => setViewing(r)} className="h-10 px-4 border border-line-strong bg-white text-sm font-medium text-ink hover:bg-sunken cursor-pointer">
                View receipt
              </button>
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
