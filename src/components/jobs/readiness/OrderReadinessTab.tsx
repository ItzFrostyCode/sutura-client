import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import StepAction from './StepAction';
import QuotationCard from './QuotationCard';
import QuotationModal from './QuotationModal';
import ApprovalModal from './ApprovalModal';
import MaterialsCard from './MaterialsCard';
import TailorsModal from './TailorsModal';
import RefundCard from './RefundCard';
import DeliveryPanel from './DeliveryPanel';
import { useOrderReadiness } from './useOrderReadiness';
import PreProductionList from '../steps/PreProductionList';
import StepsHeader from '../steps/StepsHeader';
import type { Job } from '../jobHelpers';

interface OrderReadinessTabProps {
  readonly storeId: number;
  readonly jobId: number;
  readonly job: Job;
  readonly currentTotal: number;
  /** Tell the page the job changed so its other tabs refresh. */
  readonly onChanged: () => void;
  readonly onStarted: () => void;
  readonly onGoToFinancials?: () => void;
  /** The work-stage controls, photos and notes. Shown folded once work has started. */
  readonly work?: React.ReactNode;
}

type Open = 'quotation' | 'approval' | 'tailors' | null;

const shell = 'overflow-hidden rounded-xl border border-line bg-surface';
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

/** One screen for an order: where it is, the steps before work starts, then the steps to hand it over. */
export default function OrderReadinessTab({ storeId, jobId, job, currentTotal, onChanged, onStarted, onGoToFinancials, work }: OrderReadinessTabProps) {
  const rd = useOrderReadiness(storeId, jobId, onChanged, onStarted);
  const [open, setOpen] = useState<Open>(null);
  const { data } = rd;

  if (rd.loading) return <div className="flex items-center justify-center py-12 text-ink-faint"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading…</div>;
  if (!data) return <p className="py-8 text-center text-sm text-ink-muted">Could not load the order steps.</p>;
  if (!data.uses_confirmation_flow || !data.pre_production) {
    return <div className="space-y-4"><StepsHeader job={job} />{work}</div>;
  }

  const closed = ['completed', 'cancelled', 'rejected'].includes(data.status);
  const started = Boolean(data.quotation?.production_started_at) || data.status === 'completed';
  const waiting = data.status === 'pending' ? data.blockers?.confirm : ['confirmed', 'awaiting_materials'].includes(data.status) ? data.blockers?.start : [];
  const closeModal = () => { setOpen(null); rd.clearBlockers(); };

  return (
    <div className="space-y-4">
      <StepsHeader job={job} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {started && !['cancelled', 'rejected'].includes(data.status) && <DeliveryPanel storeId={storeId} data={data} api={rd} onGoToFinancials={onGoToFinancials} />}

          <details open={!started && !closed} className={`group ${shell}`}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 border-b border-line px-4 py-3 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-bold text-ink">{started ? 'Steps before work started' : 'Steps before work starts'}</span>
              <span aria-hidden className="text-xs text-ink-muted group-open:hidden">Show</span>
            </summary>
            <PreProductionList data={data} api={rd} onOpen={setOpen} onGoToFinancials={onGoToFinancials} />
            {waiting && waiting.length > 0 && !closed && (
              <ul className="list-disc space-y-0.5 border-t border-amber-200 bg-amber-50 py-2.5 pl-9 pr-4 text-xs text-amber-900">
                <li className="-ml-4 list-none font-bold">Still needed:</li>
                {waiting.map((b) => <li key={b.key}>{b.message}</li>)}
              </ul>
            )}
          </details>

          {!started && !closed && <MaterialsCard data={data} api={rd} locked={false} />}

          {work && started && (
            <details className={`group ${shell}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-bold text-ink">Work stage, photos and notes</span>
                <span aria-hidden className="text-xs text-ink-muted group-open:hidden">Show</span>
              </summary>
              <div className="border-t border-line p-4">{work}</div>
            </details>
          )}
        </div>

        <div className="space-y-4">
          <QuotationCard data={data} />
          <section className={shell}>
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h3 className="text-sm font-bold text-ink">Tailors</h3>
              {data.permissions.can_assign && !closed && (
                <StepAction item={{ key: 'tailor', label: '', done: (data.assignees?.length ?? 0) > 0, detail: null, applicable: true }} api={rd} onOpen={setOpen} />
              )}
            </header>
            {data.assignees && data.assignees.length > 0 ? (
              <ul className="divide-y divide-line">
                {data.assignees.map((a) => <li key={a.user_id} className="flex items-center justify-between px-4 py-2 text-sm"><span className="font-medium text-ink">{a.name}</span><span className="text-[11px] capitalize text-ink-muted">{a.role}</span></li>)}
              </ul>
            ) : <p className="px-4 py-4 text-xs text-ink-muted">Nobody assigned yet.</p>}
            {data.capacity?.has_conflict && <p className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">A tailor on this order has another order due within a day of this one.</p>}
            {(data.assignee_history?.length ?? 0) > 0 && (
              <details className="border-t border-line px-4 py-2 text-xs">
                <summary className="cursor-pointer font-semibold text-ink-body">History ({data.assignee_history?.length})</summary>
                <ul className="mt-2 space-y-1 text-ink-muted">
                  {data.assignee_history?.map((e, i) => (
                    <li key={i}>
                      {day(e.at)} · {e.action === 'replaced' ? `${e.from} → ${e.to}` : e.action === 'added' ? `${e.to} added` : `${e.from} removed`}{e.by ? ` (by ${e.by})` : ''}{e.reason ? `. ${e.reason}` : ''}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
          {data.permissions.can_manage_refund && <RefundCard storeId={storeId} jobId={jobId} data={data} onRecorded={() => { void rd.reload(); onChanged(); }} />}
        </div>
      </div>

      {open === 'quotation' && (
        <QuotationModal isOpen onClose={closeModal} data={data} currentTotal={currentTotal} busy={rd.busy === 'quotation'} blockers={rd.blockers} onSave={rd.actions.saveQuotation} />
      )}
      {open === 'approval' && <ApprovalModal isOpen onClose={closeModal} data={data} busy={rd.busy === 'approval'} onApprove={rd.actions.approveInPerson} />}
      {open === 'tailors' && <TailorsModal isOpen onClose={closeModal} storeId={storeId} current={data.assignees ?? []} capacity={data.capacity} busy={rd.busy === 'tailor'} onSave={rd.actions.saveAssignees} started={started} />}
    </div>
  );
}
