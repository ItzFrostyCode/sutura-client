import React, { useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

interface QuotationDecisionProps {
  readonly orderId: number;
  readonly expired: boolean;
  readonly onDone: () => void;
}

type Mode = 'idle' | 'decline';

// Real buttons, the same shape as the order form's: solid ink for the main answer, an outline for the other.
const BTN = 'flex h-[52px] flex-1 cursor-pointer items-center justify-center rounded-xl px-4 text-base font-semibold transition-opacity active:opacity-80 disabled:cursor-not-allowed disabled:opacity-40';
const PRIMARY = `${BTN} bg-ink text-white`;
const OUTLINE = `${BTN} border border-line-strong bg-surface text-ink hover:bg-sunken`;

/** The two answers to a price: approve it, or decline it. */
export default function QuotationDecision({ orderId, expired, onDone }: QuotationDecisionProps) {
  const toast = useToast();
  const [accepted, setAccepted] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const send = async (decision: 'accept' | 'decline') => {
    setSaving(true);
    try {
      const res = await api.post(`/my-orders/${orderId}/decision`, { decision, note: note.trim() || undefined, accepted_terms: decision === 'accept' ? true : undefined });
      toast.success(res.data?.message ?? 'Saved.');
      onDone();
    } catch (err) {
      toast.error(getErrorMessage(err, 'We could not save your answer. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (expired) {
    return <p className="mobile-body-sm mt-4 rounded-xl bg-amber-50 p-3 font-normal text-amber-800">This price is no longer valid. Please ask the shop for a new one.</p>;
  }

  if (mode === 'decline') {
    return (
      <div className="mt-4">
        <label htmlFor="decision-note" className="mobile-body-sm font-semibold text-ink">Why are you declining? (optional)</label>
        <textarea id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-base text-ink focus:border-taupe focus:outline-none" />
        <div className="mt-3 flex gap-3">
          <button type="button" disabled={saving} onClick={() => setMode('idle')} className={OUTLINE}>Back</button>
          <button type="button" disabled={saving} onClick={() => send('decline')} className={PRIMARY}>{saving ? 'Saving…' : 'Decline price'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <label className="flex min-h-[44px] cursor-pointer items-start gap-3">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-5 w-5 accent-taupe" />
        <span className="mobile-body-sm font-normal text-ink">I agree to the price, the payment terms, the date and the cancellation policy.</span>
      </label>
      <div className="mt-3 flex gap-3">
        <button type="button" disabled={saving} onClick={() => setMode('decline')} className={OUTLINE}>Decline</button>
        <button type="button" disabled={!accepted || saving} onClick={() => send('accept')} className={PRIMARY}>{saving ? 'Saving…' : 'Approve price'}</button>
      </div>
    </div>
  );
}
