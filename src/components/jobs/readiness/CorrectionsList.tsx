import React from 'react';
import { Check, X } from 'lucide-react';
import { CORRECTION_KIND_LABELS, peso } from './readinessFormat';
import type { Correction } from './readinessTypes';

interface CorrectionsListProps {
  readonly corrections: Correction[];
  readonly canApprove: boolean;
  readonly busy: boolean;
  readonly onResolve: (id: number) => void;
  readonly onCancel: (id: number) => void;
  readonly onApprove: (c: Correction) => void;
}

const TONE = {
  open: 'bg-amber-500/10 text-amber-700',
  awaiting_approval: 'bg-espresso/[0.06] text-ink-body',
  done: 'bg-sage/10 text-sage',
  cancelled: 'bg-sunken text-ink-muted',
} as const;
const TEXT = { open: 'To fix', awaiting_approval: 'Waiting for customer', done: 'Fixed', cancelled: 'Cancelled' } as const;

/** Everything that had to be fixed or added after production started, and who has it. */
export default function CorrectionsList({ corrections, canApprove, busy, onResolve, onCancel, onApprove }: CorrectionsListProps) {
  const rows = corrections.filter((c) => c.status !== 'cancelled');
  if (rows.length === 0) return null;

  return (
    <ul className="divide-y divide-line border-y border-line" aria-label="Corrections">
      {rows.map((c) => (
        <li key={c.id} className="flex flex-wrap items-start gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{CORRECTION_KIND_LABELS[c.kind]}{c.affected_quantity ? ` · ${c.affected_quantity} pc` : ''}</p>
            <p className="text-[13px] text-ink-body">{c.description}</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              {c.assignee_name ? `Assigned to ${c.assignee_name}` : 'Nobody assigned yet'}
              {c.target_date ? ` · by ${new Date(c.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
              {c.kind !== 'change_request' && c.shop_fault ? ' · shop error, no charge' : ''}
              {c.kind === 'change_request' && c.additional_amount != null ? ` · +${peso(c.additional_amount)}` : ''}
            </p>
            {c.status === 'awaiting_approval' && (
              <p className="mt-0.5 text-[13px] font-medium text-amber-700">Waiting for the customer to approve{c.additional_amount != null ? ` ${peso(c.additional_amount)}` : ''}</p>
            )}
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[c.status]}`}>{TEXT[c.status]}</span>
          <div className="flex gap-1.5">
            {c.status === 'open' && (
              <button type="button" disabled={busy} onClick={() => onResolve(c.id)} className="flex h-10 items-center gap-1 rounded-lg bg-sage/10 px-3 text-xs font-semibold text-sage hover:bg-sage/15 disabled:opacity-50 sm:h-9"><Check size={13} />Fixed</button>
            )}
            {c.status === 'awaiting_approval' && canApprove && (
              <button type="button" disabled={busy} onClick={() => onApprove(c)} className="h-10 rounded-lg bg-espresso px-3 text-xs font-semibold text-white hover:bg-espresso/90 disabled:opacity-50 sm:h-9">Record approval</button>
            )}
            {(c.status === 'open' || c.status === 'awaiting_approval') && canApprove && (
              <button type="button" aria-label="Cancel this correction" disabled={busy} onClick={() => onCancel(c.id)} className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-sunken hover:text-rose-600 sm:h-9 sm:w-9"><X size={14} /></button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
