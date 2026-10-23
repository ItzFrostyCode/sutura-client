import React, { useState } from 'react';
import { Check, PackageCheck } from 'lucide-react';
import { BTN_SM } from '@/components/shared/plainForm';
import SectionHeader from '../ui/SectionHeader';
import DeliveryActions from './DeliveryActions';
import { handOverProgress } from './handover/HandOverSteps';
import CorrectionsList from './CorrectionsList';
import CorrectionModal from './CorrectionModal';
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
  done: 'bg-sage text-white',
  current: 'bg-espresso text-white',
  upcoming: 'border border-line-strong text-ink-muted',
} as const;

/** Until Ready: the stages from production to completed. In Ready: the "Hand over" steps, and nothing else that repeats them. */
export default function DeliveryPanel({ storeId, data, api, onGoToFinancials }: DeliveryPanelProps) {
  const d = data.delivery;
  const [changeOpen, setChangeOpen] = useState(false);
  const [approving, setApproving] = useState<Correction | null>(null);
  if (!d) return null;
  const ready = d.current === 'collection' || d.current === 'fitting' || d.current === 'handover';
  const canQuote = data.permissions.can_approve_change && !['completed', 'cancelled', 'rejected'].includes(data.status);
  const busy = api.busy === 'correction' || api.busy === 'qc' || api.busy === 'handover' || api.busy === 'move';
  // While the order is in Fixing the Work section lists the fixes; here they show once it is past that.
  const fixes = d.current === 'correction' ? [] : d.corrections;

  return (
    <section className="h-full overflow-hidden rounded-2xl border border-line bg-surface shadow-2xs">
      <header className="border-b border-line px-5 py-4 sm:px-6">
        <SectionHeader
          icon={PackageCheck}
          title={ready ? 'Hand over' : 'From production to handover'}
          subtitle={ready ? handOverProgress(data) : 'One status for the shop and the customer. Internal tasks and notes stay with the shop.'}
          actions={canQuote ? <button type="button" onClick={() => setChangeOpen(true)} className={BTN_SM}>Customer wants a change</button> : undefined}
        />
      </header>

      {!ready && (
        <ol className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-5 py-4 sm:px-6" aria-label="Delivery stages">
          {d.stages.filter((s) => s.applicable).map((s, i) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-medium ${STATE[s.state]}`} aria-hidden>{s.state === 'done' ? <Check size={14} strokeWidth={2.5} /> : i + 1}</span>
              <span className={`text-[13px] ${s.state === 'current' ? 'font-semibold text-ink' : s.state === 'done' ? 'text-ink-body' : 'text-ink-muted'}`}>
                {s.label}<span className="sr-only">{s.state === 'current' ? ' — current stage' : s.state === 'done' ? ' — done' : ''}</span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <DeliveryActions data={data} api={api} onGoToFinancials={onGoToFinancials} />

      {fixes.some((c) => c.status !== 'cancelled') && (
        <div className="px-5 py-4 sm:px-6">
          <CorrectionsList corrections={fixes} canApprove={data.permissions.can_approve_change} busy={api.busy !== null} onResolve={api.actions.resolveCorrection} onCancel={api.actions.cancelCorrection} onApprove={setApproving} />
        </div>
      )}

      {changeOpen && <CorrectionModal isOpen onClose={() => setChangeOpen(false)} storeId={storeId} kind="change_request" busy={busy} onSave={api.actions.addCorrection} />}
      {approving && (
        <ApproveChangeModal isOpen onClose={() => setApproving(null)} change={approving} currentDue={data.order?.due_date ?? null} busy={busy} onApprove={(body) => api.actions.approveChange(approving.id, body)} />
      )}
    </section>
  );
}
