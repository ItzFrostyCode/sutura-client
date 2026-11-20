'use client';

import { useState } from 'react';
import { AlertTriangle, X, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';
import type { Subscription } from './billingTypes';

interface CancelSubscriptionModalProps {
  readonly subscription: Subscription | null;
  readonly onClose: () => void;
  readonly onConfirm: () => Promise<boolean>;
}

/**
 * Cancel Subscription Modal with revised Terms & Conditions / Agreements.
 * Outlines retain-until-expiry terms, downgrade behavior, and resubscribe options.
 */
export default function CancelSubscriptionModal({ subscription, onClose, onConfirm }: CancelSubscriptionModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const endsAtFormatted = subscription?.ends_at
    ? new Date(subscription.ends_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'the end of your billing cycle';

  const handleCancel = async () => {
    if (!agreed) return;
    setSubmitting(true);
    const success = await onConfirm();
    setSubmitting(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <ShieldAlert size={24} />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4">
          <h2 className="mobile-h2 font-heading font-bold text-ink sm:text-2xl">
            Cancel SUTURA Subscription
          </h2>
          <p className="mobile-body-sm mt-1 text-ink-muted">
            Are you sure you want to cancel your <strong>{subscription?.plan?.name ?? 'store'}</strong> plan?
          </p>
        </div>

        {/* Revised Terms & Conditions / Agreements */}
        <div className="mt-5 space-y-3 rounded-2xl border border-line bg-sunken/60 p-4 text-xs text-ink-body">
          <p className="font-semibold uppercase tracking-wider text-ink">
            Revised Subscription Agreements &amp; Policy:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="font-bold text-ink">1.</span>
              <span>
                <strong>Retained Access:</strong> You will retain full access to all plan features until{' '}
                <strong className="text-ink">{endsAtFormatted}</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-ink">2.</span>
              <span>
                <strong>Automatic Downgrade:</strong> After {endsAtFormatted}, your account will revert to the{' '}
                <strong>Basic Plan</strong>.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-ink">3.</span>
              <span>
                <strong>Data Protection:</strong> All your orders, client records, and store settings are preserved. No data is deleted.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-ink">4.</span>
              <span>
                <strong>Easy Resubscribe:</strong> You can reactivate your plan or upgrade at any time with a single click.
              </span>
            </li>
          </ul>
        </div>

        {/* Agreement Checkbox */}
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:bg-sunken">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-line text-ink focus:ring-ink"
          />
          <span className="text-xs text-ink-body">
            I understand and accept the revised subscription terms and wish to proceed with cancelling auto-renewal.
          </span>
        </label>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="min-h-12 rounded-xl border border-line px-5 text-sm font-semibold text-ink hover:bg-sunken"
          >
            Keep My Plan
          </button>
          <button
            type="button"
            disabled={!agreed || submitting}
            onClick={handleCancel}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-danger px-6 text-sm font-semibold text-white shadow-sm hover:bg-danger/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            <span>{submitting ? 'Cancelling…' : 'Confirm Cancellation'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
