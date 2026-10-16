import React from 'react';
import { peso } from './readinessFormat';
import type { ReadinessData } from './readinessTypes';

/** The agreed price, how it was built, and where the customer's approval and deposit stand. */
export default function QuotationCard({ data }: { readonly data: ReadinessData }) {
  const q = data.quotation;
  const lines = q?.data;
  const money = data.permissions.can_see_money;
  const dep = data.deposit;

  return (
    <section className="rounded-xl border border-line bg-surface shadow-2xs">
      <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h3 className="text-sm font-bold text-ink">Quotation</h3>
        {q?.status && (
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase ${q.status === 'final' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{q.status === 'final' ? 'Final' : 'Estimate'}</span>
        )}
      </header>
      <div className="space-y-3 px-4 py-3 text-sm">
        {money && lines ? (
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between"><dt className="text-ink-muted">Service price</dt><dd>{peso(lines.base_price)}</dd></div>
            {lines.quantity_adjustment !== 0 && <div className="flex justify-between"><dt className="text-ink-muted">Quantity pricing</dt><dd>{lines.quantity_adjustment > 0 ? '+' : '−'}{peso(Math.abs(lines.quantity_adjustment))}</dd></div>}
            {lines.additional_charges.map((r, i) => <div key={`a${i}`} className="flex justify-between"><dt className="text-ink-muted">+ {r.label}</dt><dd>{peso(r.amount)}</dd></div>)}
            {lines.customer_provided_deduction.map((r, i) => <div key={`d${i}`} className="flex justify-between"><dt className="text-ink-muted">− {r.label}</dt><dd>−{peso(r.amount)}</dd></div>)}
            <div className="flex justify-between border-t border-line pt-1.5 text-sm font-bold text-ink"><dt>Total</dt><dd>{peso(lines.total)}</dd></div>
          </dl>
        ) : money ? (
          <p className="text-xs text-ink-muted">No quotation yet. The current total is {peso(q?.total)}.</p>
        ) : (
          <p className="text-xs text-ink-muted">Prices are handled by the owner or branch manager.</p>
        )}

        {money && data.terms && <p className="border-t border-line pt-3 text-xs text-ink-body">Terms: {data.terms.text}{data.terms.locked ? ' (agreed, locked)' : ''}</p>}
        {data.decision?.value === 'changes_requested' && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">The customer asked for changes: {data.decision.note || '—'}</p>}
        {data.decision?.valid_until && <p className="text-xs text-ink-muted">Price valid until {new Date(data.decision.valid_until).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}.</p>}

        <dl className="space-y-1 border-t border-line pt-3 text-xs">
          <div className="flex justify-between"><dt className="text-ink-muted">Customer approval</dt><dd className={q?.approved_at ? 'font-semibold text-emerald-700' : 'text-ink-muted'}>{q?.approved_at ? (q.approval_channel === 'online' ? 'Approved online' : 'Approved in person') : 'Waiting'}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Deposit</dt><dd className={dep?.met ? 'font-semibold text-emerald-700' : 'text-rose-700'}>{dep?.met ? 'Verified' : 'Not verified yet'}</dd></div>
          {money && dep?.required !== undefined && (
            <>
              <div className="flex justify-between"><dt className="text-ink-muted">Required / paid</dt><dd>{peso(dep.required)} / {peso(dep.paid)}</dd></div>
              {(dep.pending_verification ?? 0) > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Waiting for verification</dt><dd className="text-amber-700">{peso(dep.pending_verification)}</dd></div>}
            </>
          )}
        </dl>
        {money && (q?.versions?.length ?? 0) > 1 && (
          <details className="border-t border-line pt-2 text-xs">
            <summary className="cursor-pointer font-semibold text-ink-body">Earlier prices ({(q?.versions?.length ?? 1) - 1})</summary>
            <ul className="mt-2 space-y-1.5">
              {[...(q?.versions ?? [])].reverse().map((v) => (
                <li key={v.version} className="text-ink-muted">
                  <span className="font-semibold text-ink">v{v.version} · {peso(v.total)}</span>{v.status === 'estimate' ? ' (estimate)' : ''} — {new Date(v.at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}{v.by ? `, ${v.by}` : ''}{v.reason ? `. ${v.reason}` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </section>
  );
}
