'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Lock } from 'lucide-react';
import Modal from '@/components/Modal';

/** Keep in step with SubscriptionController::CANCEL_TERMS_VERSION. */
export const CANCEL_TERMS_VERSION = '2026-11-24';

const KEEP = [
  'All your orders, customers and payment records',
  'Viewing and exporting them',
  'Billing and Support',
];
const STOPS = [
  'New orders and appointments',
  'Edits to your shop, services and staff',
  'Showing up in search and on the map',
];

/**
 * Cancel the running plan: what happens and when, the agreement link, and an
 * "I understand" box before the destructive button unlocks. Nothing stops until
 * the end date; after it the shop is read-only (server: CheckRole).
 */
export default function CancelSubscriptionModal({ isOpen, planName, endsOn, busy, onClose, onConfirm }: Readonly<{
  isOpen: boolean;
  planName: string;
  /** Formatted end date, e.g. "February 21, 2027". */
  endsOn: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  const [agreed, setAgreed] = useState(false);
  useEffect(() => { if (isOpen) setAgreed(false); }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cancel your subscription?"
      maxWidth="max-w-lg"
      hideScrollbar
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 w-full rounded-xl border border-line-strong bg-white px-4 sm:w-auto text-sm font-semibold text-ink hover:bg-canvas cursor-pointer">
            Keep my plan
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreed || busy}
            className="h-11 w-full rounded-xl bg-danger px-4 sm:w-auto text-sm font-semibold text-white hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            {busy ? 'Cancelling…' : 'Cancel subscription'}
          </button>
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="text-amber-900">
            <strong className="font-semibold">You keep {planName} until {endsOn}.</strong> After that, your shop
            becomes <strong>read-only</strong> until you choose a plan again.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 font-semibold text-ink">Stops after {endsOn}</p>
            <ul className="space-y-1.5">
              {STOPS.map((t) => (
                <li key={t} className="flex gap-2 text-ink-body"><Lock size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-semibold text-ink">Kept, always</p>
            <ul className="space-y-1.5">
              {KEEP.map((t) => (
                <li key={t} className="flex gap-2 text-ink-body"><Check size={14} className="mt-0.5 shrink-0 text-sage" aria-hidden="true" />{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-ink-muted">Paid days aren&apos;t refunded. You can undo this in Billing until {endsOn}.</p>

        <label htmlFor="cancel-agree" className="flex cursor-pointer gap-3 border-t border-line pt-4">
          <input
            id="cancel-agree"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
          />
          <span className="text-ink-body">
            I understand my shop becomes read-only after {endsOn}, and I agree to the{' '}
            <a href="/terms#subscription-agreement" target="_blank" rel="noopener noreferrer" className="font-semibold text-ink underline underline-offset-2">
              Subscription Agreement
            </a>.
          </span>
        </label>
      </div>
    </Modal>
  );
}
