import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import TailorsCard from './TailorsCard';
import ClientCard from './ClientCard';
import AboutOrder from './AboutOrder';
import PreStepsSection from './PreStepsSection';
import WorkSection from './WorkSection';
import QuotationCard from './QuotationCard';
import GettingReadySection from './GettingReadySection';
import ReadinessModals, { type OpenModal } from './ReadinessModals';
import { GettingReadyFold, HandOverFold } from './FoldedColumns';
import FollowUpLinks from './FollowUpLinks';
import { makingProgress, stepsColumn } from './stepsColumn';
import RefundCard from './RefundCard';
import DeliveryPanel from './DeliveryPanel';
import { useOrderReadiness, type OrderReadinessApi } from './useOrderReadiness';
import StepsHeader from '../steps/StepsHeader';
import CancelOrderPanel from '../detail/CancelOrderPanel';
import CancelledNotice from '../detail/CancelledNotice';
import type { Job } from '../jobHelpers';
import { jobPieces } from '@/lib/orderSize';

interface OrderReadinessTabProps {
  readonly storeId: number;
  readonly jobId: number;
  readonly job: Job;
  readonly currentTotal: number;
  /** Tell the page the job changed so its other tabs refresh. */
  readonly onChanged: () => void;
  readonly onStarted: () => void;
  readonly onGoToFinancials?: () => void;
  /** Switch the page to its Details tab (team list, measurements). */
  readonly onGoToDetails?: () => void;
  /** The work-stage controls, photos and notes (given the order's steps and actions). Shown in its own section once work has started. */
  readonly work?: (rd: OrderReadinessApi) => React.ReactNode;
  /** Production snapshot and customer-facing status cards (two sibling cards), shown in the people-and-dates row. */
  readonly aside?: React.ReactNode;
  /** The owner picked "Cancel this order" from the menu: show the cancel panel at the top. */
  readonly cancelOpen?: boolean;
  readonly onCancelClose?: () => void;
}

/** One screen for an order: where it is, the steps before work starts, then the steps to hand it over. */
export default function OrderReadinessTab({ storeId, jobId, job, currentTotal, onChanged, onStarted, onGoToFinancials, onGoToDetails, work, aside, cancelOpen, onCancelClose }: OrderReadinessTabProps) {
  const rd = useOrderReadiness(storeId, jobId, onChanged, onStarted);
  const [open, setOpen] = useState<OpenModal>(null);
  /** The inline pieces and sizes editor under the Details & sizes step; the quotation window's "Change" link opens it too. */
  const [piecesOpen, setPiecesOpen] = useState(false);
  const { data } = rd;
  // Something moved the order outside these steps (the phone's Next button): read the steps again.
  const seenStatus = useRef(job.status);
  const { reload } = rd;
  const loadedStatus = data?.status;
  useEffect(() => {
    if (seenStatus.current === job.status) return;
    seenStatus.current = job.status;
    if (loadedStatus !== job.status) void reload();
  }, [job.status, loadedStatus, reload]);
  const cancelledNotice = <CancelledNotice job={job} />;
  const cancelPanel = cancelOpen && onCancelClose && (
    <CancelOrderPanel storeId={storeId} jobId={jobId} job={job} onClose={onCancelClose} onCancelled={() => { void rd.reload(); onChanged(); onCancelClose(); }} />
  );

  if (rd.loading) return <div className="flex items-center justify-center py-12 text-ink-faint"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading…</div>;
  if (!data) return <p className="py-8 text-center text-sm text-ink-muted">Could not load the order steps.</p>;
  if (!data.uses_confirmation_flow || !data.pre_production) {
    return (
      <div className="space-y-4">
        {cancelPanel}
        <StepsHeader job={job} />
        {cancelledNotice}
        {work?.(rd)}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {aside}
          <ClientCard job={job} />
        </div>
      </div>
    );
  }

  const column = stepsColumn(data);
  const closed = ['completed', 'cancelled', 'rejected'].includes(data.status);
  const started = Boolean(data.quotation?.production_started_at) || data.status === 'completed';
  const closeModal = () => { setOpen(null); rd.clearBlockers(); };
  const pieces = { job, open: piecesOpen, setOpen: setPiecesOpen, onGoToDetails };
  const making = makingProgress(job, column);
  const tailorNames = (data.assignees ?? []).map((a) => a.name).filter(Boolean).join(', ');
  // The column the order is in is open; every earlier column folds to its header and "x of y done". All folding is decided here.
  const preSteps = <PreStepsSection data={data} api={rd} folded={column !== 'request'} readOnly={column === 'done'} onOpen={setOpen} onGoToFinancials={onGoToFinancials} pieces={pieces} />;
  const earlier = column === 'being_made' || column === 'hand_over' || column === 'done';

  return (
    <div className="space-y-4">
      {cancelPanel}
      <StepsHeader job={job} />
      {cancelledNotice}

      {/* The column you are in, beside the price. */}
      <div className="grid gap-4 lg:grid-cols-3 lg:items-stretch">
        <div className="lg:col-span-2">
          {(column === 'request' || column === 'closed') && preSteps}
          {column === 'getting_ready' && <GettingReadySection data={data} api={rd} job={job} onOpen={setOpen} onGoToFinancials={onGoToFinancials} />}
          {(column === 'being_made' || column === 'hand_over') && <DeliveryPanel storeId={storeId} data={data} api={rd} onGoToFinancials={onGoToFinancials} />}
          {column === 'done' && <HandOverFold data={data} />}
        </div>
        <QuotationCard data={data} pieces={jobPieces(job)} onEdit={data.permissions.can_edit_quotation && !closed ? () => setOpen('quotation') : undefined} />
      </div>

      {/* Earlier columns, latest first, folded. */}
      <div className="space-y-4">
        {column === 'done' && <FollowUpLinks followUps={job.follow_ups} />}
        {work && started && <WorkSection folded={column !== 'being_made'} done={making.done} total={making.total}>{work(rd)}</WorkSection>}
        {earlier && <GettingReadyFold data={data} />}
        {column !== 'request' && column !== 'closed' && preSteps}
      </div>

      <AboutOrder summary={[started ? (tailorNames ? `Tailors: ${tailorNames}` : 'No tailor yet') : '', `Client: ${job.customer?.name || 'Walk-in Customer'}`].filter(Boolean).join(' · ')}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {started && <TailorsCard data={data} closed={closed} onOpen={setOpen} />}
          {started && aside}
          <ClientCard job={job} />
        </div>
      </AboutOrder>

      {data.permissions.can_manage_refund && <RefundCard storeId={storeId} jobId={jobId} data={data} onRecorded={() => { void rd.reload(); onChanged(); }} />}

      <ReadinessModals open={open} onClose={closeModal} storeId={storeId} job={job} data={data} rd={rd} currentTotal={currentTotal} started={started} onChangePieces={() => setPiecesOpen(true)} />
    </div>
  );
}
