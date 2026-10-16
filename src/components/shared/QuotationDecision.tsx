import React, { useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';

interface QuotationDecisionProps {
  readonly orderId: number;
  readonly expired: boolean;
  readonly onDone: () => void;
}

type Mode = 'idle' | 'changes' | 'decline';

/** The three answers to a price: approve it, ask the shop to change it, or decline it. */
export default function QuotationDecision({ orderId, expired, onDone }: QuotationDecisionProps) {
  const toast = useToast();
  const [accepted, setAccepted] = useState(false);
  const [mode, setMode] = useState<Mode>('idle');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const send = async (decision: 'accept' | 'changes' | 'decline') => {
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

  if (mode !== 'idle') {
    const isDecline = mode === 'decline';
    return (
      <div className="mt-4">
        <label htmlFor="decision-note" className="mobile-body-sm font-semibold text-ink">
          {isDecline ? 'Why are you declining? (optional)' : 'What would you like to change?'}
        </label>
        <textarea id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-3 text-base text-ink focus:border-taupe focus:outline-none" />
        <div className="mt-3 flex gap-3">
          <button type="button" onClick={() => setMode('idle')} className="h-[52px] flex-1 rounded-full border border-line text-base font-medium text-ink">Back</button>
          <button type="button" disabled={saving || (!isDecline && !note.trim())} onClick={() => send(isDecline ? 'decline' : 'changes')} className="h-[52px] flex-1 rounded-full bg-ink text-base font-semibold text-white disabled:opacity-50">
            {saving ? 'Saving…' : isDecline ? 'Decline price' : 'Send to the shop'}
          </button>
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
      <button type="button" disabled={!accepted || saving} onClick={() => send('accept')} className="mt-3 h-[52px] w-full rounded-full bg-ink text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-50">
        {saving ? 'Saving…' : 'Approve price'}
      </button>
      <div className="mt-2 flex gap-3">
        <button type="button" onClick={() => setMode('changes')} className="h-[48px] flex-1 rounded-full text-base font-medium text-taupe">Ask for changes</button>
        <button type="button" onClick={() => setMode('decline')} className="h-[48px] flex-1 rounded-full text-base font-medium text-ink-muted">Decline</button>
      </div>
    </div>
  );
}
