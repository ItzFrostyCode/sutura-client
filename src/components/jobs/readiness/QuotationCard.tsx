import React from 'react';
import { Check, Pencil, Receipt } from 'lucide-react';
import { BTN } from '@/components/shared/plainForm';
import SectionHeader from '../ui/SectionHeader';
import { perPiece } from './quotationBasis';
import { peso } from './readinessFormat';
import type { ReadinessData } from './readinessTypes';

interface QuotationCardProps {
  readonly data: ReadinessData;
  /** How many pieces the order has, to show the price per piece when the saved price divides evenly. */
  readonly pieces?: number;
  /** Opens the quotation editor; leave out when the viewer may not edit or the order is closed. */
  readonly onEdit?: () => void;
}

const ROW = 'flex justify-between text-sm';

/** The agreed price, how it was built, and where the customer's approval and deposit stand. */
export default function QuotationCard({ data, pieces = 1, onEdit }: QuotationCardProps) {
  const q = data.quotation;
  const lines = q?.data;
  const money = data.permissions.can_see_money;
  const dep = data.deposit;
  const unit = lines ? perPiece(Number(lines.base_price), pieces) : null;
  const editLabel = !q?.status ? 'Prepare quotation' : q.status === 'final' ? 'Edit quotation' : 'Edit estimate';

  return (
    <section className="h-full rounded-2xl border border-line bg-surface shadow-2xs">
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <SectionHeader
          icon={Receipt}
          title="Quotation"
          as="h3"
          badge={q?.status ? (
            <span className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider ${q.status === 'final' ? 'bg-sage/10 text-sage' : 'bg-espresso/[0.06] text-ink-muted'}`}>{q.status === 'final' ? 'Final' : 'Estimate'}</span>
          ) : undefined}
        />
      </header>
      <div className="space-y-4 px-5 py-4 sm:px-6">
        {money && lines ? (
          <dl className="space-y-1.5">
            <div className={ROW}><dt className="text-ink-muted">{unit !== null ? `${peso(unit)} × ${pieces} pcs` : 'Service price'}</dt><dd>{peso(lines.base_price)}</dd></div>
            {lines.quantity_adjustment !== 0 && <div className={ROW}><dt className="text-ink-muted">{lines.quantity_adjustment > 0 ? 'Quantity pricing' : 'Bulk discount'}</dt><dd>{lines.quantity_adjustment > 0 ? '+' : '−'}{peso(Math.abs(lines.quantity_adjustment))}</dd></div>}
            {lines.additional_charges.map((r, i) => <div key={`a${i}`} className={ROW}><dt className="text-ink-muted">+ {r.label}</dt><dd>{peso(r.amount)}</dd></div>)}
            {lines.customer_provided_deduction.map((r, i) => <div key={`d${i}`} className={ROW}><dt className="text-ink-muted">− {r.label}</dt><dd>−{peso(r.amount)}</dd></div>)}
            <div className="flex justify-between border-t border-line pt-2.5 text-[17px] font-semibold text-ink"><dt>Total</dt><dd>{peso(lines.total)}</dd></div>
          </dl>
        ) : money ? (
          <p className="text-sm text-ink-muted">No quotation yet. The current total is {peso(q?.total)}.</p>
        ) : (
          <p className="text-sm text-ink-muted">Prices are handled by the owner or branch manager.</p>
        )}

        {money && data.terms && <p className="border-t border-line pt-4 text-[13px] italic text-ink-muted">Terms: {data.terms.text}{data.terms.locked ? ' (agreed, locked)' : ''}</p>}
        {data.decision?.value === 'changes_requested' && <p className="rounded-xl bg-amber-500/[0.08] px-3.5 py-3 text-[13px] text-amber-800">The customer asked for changes: {data.decision.note || '—'}</p>}
        {data.decision?.valid_until && <p className="text-[13px] text-ink-muted">Price valid until {new Date(data.decision.valid_until).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}.</p>}

        {/* Whether the customer answered and the deposit came in is told once, by the steps beside this card. Only facts they do not show are here. */}
        {(q?.approved_at || (money && (dep?.required ?? 0) > 0)) && (
          <dl className="space-y-1.5 border-t border-line pt-4">
            {q?.approved_at && <div className={ROW}><dt className="text-ink-muted">Customer approval</dt><dd className="font-medium text-sage">{q.approval_channel === 'online' ? 'Approved online' : 'Approved in person'}</dd></div>}
            {money && (dep?.required ?? 0) > 0 && (
              <div className={ROW}>
                <dt className="text-ink-muted">Deposit</dt>
                {dep?.met ? <dd className="inline-flex items-center gap-1 font-medium text-sage"><Check size={14} /> {peso(dep.paid)} verified</dd> : <dd>{peso(dep?.paid)} of {peso(dep?.required)}</dd>}
              </div>
            )}
          </dl>
        )}
        {money && (q?.versions?.length ?? 0) > 1 && (
          <details className="border-t border-line pt-3 text-[13px]">
            <summary className="cursor-pointer font-medium text-ink-body">Earlier prices ({(q?.versions?.length ?? 1) - 1})</summary>
            <ul className="mt-2 space-y-1.5">
              {[...(q?.versions ?? [])].reverse().map((v) => (
                <li key={v.version} className="text-ink-muted">
                  <span className="font-medium text-ink">v{v.version} · {peso(v.total)}</span>{v.status === 'estimate' ? ' (estimate)' : ''} — {new Date(v.at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}{v.by ? `, ${v.by}` : ''}{v.reason ? `. ${v.reason}` : ''}
                </li>
              ))}
            </ul>
          </details>
        )}
        {onEdit && <button type="button" onClick={onEdit} className={`${BTN} w-full`}><Pencil size={15} /> {editLabel}</button>}
      </div>
    </section>
  );
}
