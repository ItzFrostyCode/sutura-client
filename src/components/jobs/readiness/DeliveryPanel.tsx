import React, { useState } from 'react';
import { Check } from 'lucide-react';
import DeliveryActions, { type DeliveryModal } from './DeliveryActions';
import CorrectionsList from './CorrectionsList';
import CorrectionModal from './CorrectionModal';
import HandoverModal from './HandoverModal';
import ApproveChangeModal from './ApproveChangeModal';
import type { OrderReadinessApi } from './useOrderReadiness';
import type { Correction, ReadinessData } from './readinessTypes';

interface DeliveryPanelProps {
  readonly storeId: number;
  readonly data: ReadinessData;
  readonly api: OrderReadinessApi;
  readonly onGoToFinancials?: () => void;
}

const STATE = {
  done: 'border-emerald-600 bg-emerald-600 text-white',
  current: 'border-taupe bg-espresso text-white',
  upcoming: 'border-line bg-surface text-ink-muted',
} as const;

/** Flow 3 on one screen: the stages from production to completed, the next action, and what is still to be fixed. */
export default function DeliveryPanel({ storeId, data, api, onGoToFinancials }: DeliveryPanelProps) {
  const d = data.delivery;
  const [modal, setModal] = useState<DeliveryModal | 'change' | null>(null);
  const [approving, setApproving] = useState<Correction | null>(null);
  if (!d) return null;
  const canQuote = data.permissions.can_approve_change && !['completed', 'cancelled', 'rejected'].includes(data.status);
  const busy = api.busy === 'correction' || api.busy === 'qc' || api.busy === 'handover' || api.busy === 'move';

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-2xs">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-ink">From production to handover</h2>
          <p className="text-xs text-ink-muted">One status for the shop and the customer. Internal tasks and notes stay with the shop.</p>
        </div>
        {canQuote && <button type="button" onClick={() => setModal('change')} className="h-9 rounded-lg border border-line px-3 text-xs font-bold text-ink-body hover:bg-sunken">Customer wants a change</button>}
      </header>

      <ol className="flex flex-wrap gap-x-1 gap-y-2 border-b border-line px-4 py-3" aria-label="Delivery stages">
        {d.stages.filter((s) => s.applicable).map((s, i) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`flex h-6 min-w-6 items-center justify-center rounded-full border px-1.5 text-[11px] font-bold ${STATE[s.state]}`} aria-hidden>{s.state === 'done' ? <Check size={12} /> : i + 1}</span>
            <span className={`text-xs ${s.state === 'current' ? 'font-bold text-ink' : s.state === 'done' ? 'text-ink-body' : 'text-ink-muted'}`}>
              {s.label}<span className="sr-only">{s.state === 'current' ? ' — current stage' : s.state === 'done' ? ' — done' : ''}</span>
            </span>
            <span aria-hidden className="mx-1 text-ink-faint last:hidden">›</span>
          </li>
        ))}
      </ol>

      <div className="space-y-3 px-4 py-4">
        <DeliveryActions data={data} api={api} onOpen={setModal} onGoToFinancials={onGoToFinancials} />
        <CorrectionsList
          corrections={d.corrections}
          canApprove={data.permissions.can_approve_change}
          busy={api.busy !== null}
          onResolve={api.actions.resolveCorrection}
          onCancel={api.actions.cancelCorrection}
          onApprove={setApproving}
        />
      </div>

      {modal === 'qcFail' && <CorrectionModal isOpen onClose={() => setModal(null)} storeId={storeId} kind="defect" busy={busy} onSave={api.actions.failQuality} />}
      {modal === 'fittingIssue' && <CorrectionModal isOpen onClose={() => setModal(null)} storeId={storeId} kind="fitting_issue" busy={busy} onSave={api.actions.fittingIssue} />}
      {modal === 'change' && <CorrectionModal isOpen onClose={() => setModal(null)} storeId={storeId} kind="change_request" busy={busy} onSave={api.actions.addCorrection} />}
      {modal === 'release' && <HandoverModal isOpen release onClose={() => setModal(null)} remaining={d.handover.remaining} people={d.handover.unit === 'people'} busy={busy} onSave={api.actions.recordHandover} />}
      {modal === 'handover' && <HandoverModal isOpen onClose={() => setModal(null)} remaining={d.handover.remaining} people={d.handover.unit === 'people'} busy={busy} onSave={api.actions.recordHandover} />}
      {approving && (
        <ApproveChangeModal isOpen onClose={() => setApproving(null)} change={approving} currentDue={data.order?.due_date ?? null} busy={busy} onApprove={(body) => api.actions.approveChange(approving.id, body)} />
      )}
    </section>
  );
}
