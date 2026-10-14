import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import ReadinessChecklist from './ReadinessChecklist';
import StepAction from './StepAction';
import QuotationCard from './QuotationCard';
import QuotationModal from './QuotationModal';
import ApprovalModal from './ApprovalModal';
import MaterialsCard from './MaterialsCard';
import TailorsModal from './TailorsModal';
import RefundCard from './RefundCard';
import DeliveryPanel from './DeliveryPanel';
import { useOrderReadiness } from './useOrderReadiness';

interface OrderReadinessTabProps {
  readonly storeId: number;
  readonly jobId: number;
  readonly currentTotal: number;
  /** Tell the page the job changed so its other tabs refresh. */
  readonly onChanged: () => void;
  readonly onStarted: () => void;
  readonly onGoToFinancials?: () => void;
}

type Open = 'quotation' | 'approval' | 'tailors' | null;

const TITLES: Record<string, string> = {
  pending: 'Getting this order ready',
  confirmed: 'Confirmed — queued, not started',
  awaiting_materials: 'Confirmed — waiting for materials',
  cancelled: 'Cancelled',
};

/** Flow 2 on one screen: what must be true before the order is confirmed and before work can start. */
export default function OrderReadinessTab({ storeId, jobId, currentTotal, onChanged, onStarted, onGoToFinancials }: OrderReadinessTabProps) {
  const rd = useOrderReadiness(storeId, jobId, onChanged, onStarted);
  const [open, setOpen] = useState<Open>(null);
  const { data } = rd;

  if (rd.loading) return <div className="flex items-center justify-center py-12 text-ink-faint"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading…</div>;
  if (!data) return <p className="py-8 text-center text-sm text-ink-muted">Could not load the order steps.</p>;
  if (!data.uses_confirmation_flow || !data.checklist) {
    return <p className="rounded-xl border border-line bg-surface p-6 text-sm text-ink-muted">This order was created before the confirmation steps, so it moves through production directly.</p>;
  }

  const closed = ['completed', 'cancelled', 'rejected'].includes(data.status);
  // Once work has started the set-up is done: the delivery stages lead, and the set-up steps fold away.
  const started = Boolean(data.quotation?.production_started_at) || ['completed'].includes(data.status);
  const waiting = data.status === 'pending' ? data.blockers?.confirm : ['confirmed', 'awaiting_materials'].includes(data.status) ? data.blockers?.start : [];
  const closeModal = () => { setOpen(null); rd.clearBlockers(); };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {started && !['cancelled', 'rejected'].includes(data.status) && <DeliveryPanel storeId={storeId} data={data} api={rd} onGoToFinancials={onGoToFinancials} />}
          <details open={!started} className="group overflow-hidden rounded-xl border border-line bg-surface shadow-2xs">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-line px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-bold text-ink">{started ? 'Set-up steps' : (TITLES[data.status] ?? 'Order steps')}</span>
                <span className="block text-xs text-ink-muted">{started ? 'Completed before production started.' : 'Follow the steps in order: specs, measurements, price and deposit, then materials and a tailor.'}</span>
              </span>
              <span aria-hidden className="text-xs text-ink-muted group-open:hidden">Show</span>
            </summary>
            <ReadinessChecklist items={data.checklist} renderAction={(item) => <StepAction item={item} api={rd} onOpen={setOpen} onGoToFinancials={onGoToFinancials} />} />
            {waiting && waiting.length > 0 && !closed && (
              <ul className="list-disc space-y-0.5 border-t border-amber-200 bg-amber-50 py-2.5 pl-9 pr-4 text-xs text-amber-900">
                <li className="-ml-4 list-none font-bold">Still needed:</li>
                {waiting.map((b) => <li key={b.key}>{b.message}</li>)}
              </ul>
            )}
          </details>
          <MaterialsCard data={data} api={rd} locked={started || closed} />
        </div>

        <div className="space-y-4">
          <QuotationCard data={data} />
          <section className="rounded-xl border border-line bg-surface shadow-2xs">
            <header className="border-b border-line px-4 py-3"><h3 className="text-sm font-bold text-ink">Planned tailors</h3></header>
            {data.assignees && data.assignees.length > 0 ? (
              <ul className="divide-y divide-line">
                {data.assignees.map((a) => <li key={a.user_id} className="flex items-center justify-between px-4 py-2 text-sm"><span className="font-medium text-ink">{a.name}</span><span className="text-[11px] capitalize text-ink-muted">{a.role}</span></li>)}
              </ul>
            ) : <p className="px-4 py-4 text-xs text-ink-muted">Nobody planned yet.</p>}
            {data.capacity?.has_conflict && <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">A planned tailor has another order due within a day of this one.</p>}
          </section>
          {data.permissions.can_manage_refund && <RefundCard storeId={storeId} jobId={jobId} data={data} onRecorded={() => { void rd.reload(); onChanged(); }} />}
        </div>
      </div>

      {open === 'quotation' && (
        <QuotationModal isOpen onClose={closeModal} data={data} currentTotal={currentTotal} busy={rd.busy === 'quotation'} blockers={rd.blockers} onSave={rd.actions.saveQuotation} />
      )}
      {open === 'approval' && <ApprovalModal isOpen onClose={closeModal} data={data} busy={rd.busy === 'approval'} onApprove={rd.actions.approveInPerson} />}
      {open === 'tailors' && <TailorsModal isOpen onClose={closeModal} storeId={storeId} current={data.assignees ?? []} capacity={data.capacity} busy={rd.busy === 'tailor'} onSave={rd.actions.saveAssignees} />}
    </div>
  );
}
