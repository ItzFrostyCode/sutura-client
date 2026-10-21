import React, { useCallback, useEffect, useState } from 'react';
import api from '@/lib/axios';
import { getErrorMessage } from '@/lib/apiError';
import { useToast } from '@/context/ToastContext';
import { peso } from './readinessFormat';
import type { ReadinessData, RefundSuggestion } from './readinessTypes';

interface RefundCardProps {
  readonly storeId: number;
  readonly jobId: number;
  readonly data: ReadinessData;
  readonly onRecorded: () => void;
}

const STAGE_TEXT = {
  no_costs_yet: 'Nothing has been spent on this order yet — a full refund is suggested.',
  costs_incurred: 'The shop already spent money that it cannot recover — the suggestion keeps that amount.',
  production_started: 'Production had started — enter what the shop cannot recover; the suggestion is a starting point, not a rule.',
} as const;

const field = 'w-full px-3 py-2 bg-canvas border border-line rounded-lg text-base sm:text-sm text-ink focus:outline-none focus:border-taupe';

/** Cancelled order: suggested refund with its basis, the owner's decision, and a record of what was handed back. */
export default function RefundCard({ storeId, jobId, data, onRecorded }: RefundCardProps) {
  const toast = useToast();
  const base = `/stores/${storeId}/jobs/${jobId}`;
  const [suggestion, setSuggestion] = useState<RefundSuggestion | null>(null);
  const [costs, setCosts] = useState('0');
  const [costsNote, setCostsNote] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [handedBack, setHandedBack] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback((c: string) => {
    api.get(`${base}/refund-suggestion`, { params: { non_refundable: Number(c) || 0 } })
      .then((res) => { setSuggestion(res.data.data); setAmount(String(res.data.data.suggested_amount)); })
      .catch(() => setSuggestion(null));
  }, [base]);

  useEffect(() => { load('0'); }, [load]);

  const differs = suggestion !== null && Math.abs(Number(amount) - suggestion.suggested_amount) > 0.005;

  const record = async () => {
    setSaving(true);
    try {
      await api.post(`${base}/refunds`, {
        approved_amount: Number(amount), non_refundable: Number(costs) || 0, non_refundable_note: costsNote.trim() || null,
        adjustment_reason: reason.trim() || null, mark_refunded: handedBack,
      });
      toast.success('Refund recorded.');
      onRecorded();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not record the refund.'));
    } finally {
      setSaving(false);
    }
  };

  if (!suggestion) return null;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-2xs">
      <header className="border-b border-line px-4 py-3"><h3 className="text-sm font-bold text-ink">Refund</h3><p className="text-xs text-ink-muted">Recorded here only — SUTURA does not move money.</p></header>
      <div className="space-y-3 px-4 py-3 text-sm">
        <p className="text-xs text-ink-body">{STAGE_TEXT[suggestion.stage]}</p>
        {suggestion.policy && <p className="rounded-lg bg-canvas p-2.5 text-[11px] leading-relaxed text-ink-muted">{suggestion.policy}</p>}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <dt className="text-ink-muted">Paid by the customer</dt><dd className="text-right font-semibold">{peso(suggestion.basis.paid)}</dd>
          <dt className="self-center text-ink-muted">Spent, cannot recover</dt>
          <dd><input aria-label="Costs the shop cannot recover" type="number" inputMode="decimal" min={0} step="0.01" value={costs} onChange={(e) => setCosts(e.target.value)} onBlur={() => load(costs)} className={`${field} text-right`} /></dd>
          <dt className="border-t border-line pt-1 font-bold text-ink">Suggested refund</dt><dd className="border-t border-line pt-1 text-right font-bold text-ink">{peso(suggestion.suggested_amount)}</dd>
        </dl>
        {data.refunds && data.refunds.length > 0 ? (
          <ul className="space-y-1 rounded-lg bg-canvas p-3 text-xs">
            {data.refunds.map((r) => <li key={r.id}>Recorded {peso(r.approved_amount)} (suggested {peso(r.suggested_amount)}){r.refunded_at ? ' · handed back' : ' · not yet handed back'}{r.adjustment_reason ? ` — ${r.adjustment_reason}` : ''}</li>)}
          </ul>
        ) : (
          <div className="space-y-2">
            <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">What was spent (optional note)
              <input value={costsNote} onChange={(e) => setCostsNote(e.target.value)} maxLength={255} placeholder="e.g. fabric already cut" className={`${field} font-normal normal-case tracking-normal`} />
            </label>
            <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Refund amount
              <input type="number" inputMode="decimal" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${field} font-normal normal-case tracking-normal`} />
            </label>
            {differs && (
              <label className="block space-y-1 text-xs font-bold uppercase tracking-wide text-ink-muted">Why is it different from the suggestion?
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} className={`${field} resize-none font-normal normal-case tracking-normal`} />
              </label>
            )}
            <label className="flex items-center gap-2 text-xs text-ink"><input type="checkbox" checked={handedBack} onChange={(e) => setHandedBack(e.target.checked)} className="h-4 w-4 accent-taupe" />Already handed back to the customer</label>
            <button type="button" disabled={saving || (differs && !reason.trim())} onClick={record} className="h-11 rounded-lg bg-espresso px-4 text-sm font-semibold text-white hover:bg-espresso/90 disabled:opacity-50 sm:h-10">Record refund</button>
          </div>
        )}
      </div>
    </section>
  );
}
