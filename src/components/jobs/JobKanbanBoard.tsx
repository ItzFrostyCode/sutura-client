import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Job as JobItem, columnsForJobs, requiresDownpayment, ON_HOLD_COLUMN } from './jobHelpers';
import { useAuthStore } from '@/store/useAuthStore';
import CancellationReasonModal from './CancellationReasonModal';
import HoldReasonModal from './HoldReasonModal';
import KanbanCard from './kanban/KanbanCard';
import KanbanColumn from './kanban/KanbanColumn';
import KanbanSwimlanes from './kanban/KanbanSwimlanes';
import MobileStageNav from './kanban/MobileStageNav';
import DragPreview from './kanban/DragPreview';
import { WIP_UNLIMITED, phaseOf, wipLimitFor } from './kanban/kanbanConfig';
import { useKanbanDrag } from './kanban/useKanbanDrag';
import { useJobMove } from './kanban/useJobMove';
import type { KanbanPrefs } from './kanban/useKanbanPrefs';

interface JobKanbanBoardProps {
  readonly groupedJobs: Record<string, JobItem[]>;
  readonly activeColumns: ReturnType<typeof columnsForJobs>;
  readonly onHoldJobs: JobItem[];
  readonly actionLoadingId: number | null;
  readonly onUpdateStatus: (id: number, status: string, cancellationReason?: string) => void;
  readonly onApprove: (id: number) => void;
  readonly onReject: (id: number) => void;
  readonly highlightedJobId?: number | null;
  readonly stageFilter?: string;
  readonly prefs: KanbanPrefs;
  /** Orders per stage across the whole shop — what the WIP limits count. */
  readonly statusCounts: Record<string, number>;
}

// Completed piles up forever; the newest few are enough on the live board.
const COMPLETED_CAP = 5;

const num = (v: unknown) => Number.parseFloat(String(v ?? '0')) || 0;

export default function JobKanbanBoard({
  groupedJobs, activeColumns, onHoldJobs, actionLoadingId, onUpdateStatus, onApprove, onReject,
  highlightedJobId, stageFilter, prefs, statusCounts,
}: JobKanbanBoardProps) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  // POST .../jobs/{id}/reject is owner/branch-manager only; Approve is a plain status update staff may make.
  const canReject = Boolean(useAuthStore((s) => s.user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))));
  const move = useJobMove(onUpdateStatus);

  // On Hold goes first so a paused order isn't buried; it stays out of activeColumns so the
  // "A → B → C" flow banner on the page stays accurate.
  const baseColumns = onHoldJobs.length > 0 ? [ON_HOLD_COLUMN, ...activeColumns] : activeColumns;
  const columns = stageFilter && stageFilter !== 'all' ? baseColumns.filter((c) => c.id === stageFilter) : baseColumns;
  const allJobs = [...Object.values(groupedJobs).flat(), ...onHoldJobs];
  // Consecutive columns in the same phase sit under one label, so the board reads in the workflow's order.
  const phases = columns.reduce<{ phase: string; cols: typeof columns }[]>((acc, col) => {
    const phase = phaseOf(col.id);
    const last = acc[acc.length - 1];
    if (last && last.phase === phase) last.cols.push(col);
    else acc.push({ phase, cols: [col] });
    return acc;
  }, []);

  const { drag, hover, shakeKey, previewEl, cardHandlers } = useKanbanDrag({
    isFull: (colId) => {
      const limit = wipLimitFor(colId);
      return limit < WIP_UNLIMITED && (statusCounts[colId] ?? 0) >= limit;
    },
    onDrop: move.requestMove,
    onOpen: (job) => router.push(`/dashboard/jobs/${job.id}`),
    boardRef,
  });

  const renderCard = (job: JobItem) => (
    <KanbanCard
      job={job}
      ghost={drag?.job.id === job.id}
      handlers={cardHandlers(job, job.status)}
      canReject={canReject}
      loading={actionLoadingId === job.id}
      dpLocked={requiresDownpayment(job, job.status, move.repairRequiresDownpayment) && job.payment_status === 'unpaid'}
      highlighted={highlightedJobId === job.id}
      onApprove={onApprove}
      onReject={onReject}
      onMove={move.requestMove}
    />
  );

  const renderColumn = (col: { id: string; title: string }, laneId: string, jobs: JobItem[]) => (
    <KanbanColumn
      key={`${laneId}-${col.id}`}
      col={col}
      laneId={laneId}
      jobs={jobs}
      totalCount={statusCounts[col.id] ?? jobs.length}
      limit={wipLimitFor(col.id)}
      collapsed={prefs.collapsedColumns.includes(col.id)}
      onToggle={() => prefs.toggleColumn(col.id)}
      hover={hover}
      dragJobId={drag?.job.id ?? null}
      dragHeight={drag?.h ?? 76}
      shaking={shakeKey === `${laneId}:${col.id}`}
      capAt={col.id === 'completed' ? COMPLETED_CAP : undefined}
      renderCard={renderCard}
    />
  );

  return (
    <>
      <MobileStageNav columns={columns} counts={statusCounts} />

      {prefs.view === 'swimlanes' ? (
        <KanbanSwimlanes columns={columns} jobs={allJobs} collapsedLanes={prefs.collapsedLanes} onToggleLane={prefs.toggleLane} renderColumn={renderColumn} />
      ) : (
        <div ref={boardRef} className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-4 sm:snap-none" style={{ minHeight: 'calc(100vh - 300px)' }}>
          {phases.map((g, i) => (
            <div key={`${g.phase}-${i}`} className="flex shrink-0 flex-col gap-1.5">
              <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-ink-muted">{g.phase || 'On hold'}</p>
              <div className="flex items-start gap-2.5">
                {g.cols.map((col) => renderColumn(col, 'unified', col.id === 'on_hold' ? onHoldJobs : (groupedJobs[col.id] ?? [])))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DragPreview drag={drag} previewRef={previewEl} />

      <CancellationReasonModal
        isOpen={move.cancelTarget !== null}
        onClose={() => move.setCancelTarget(null)}
        onConfirm={(reason) => {
          if (move.cancelTarget) onUpdateStatus(move.cancelTarget.id, 'cancelled', reason);
          move.setCancelTarget(null);
        }}
        // A discount lowers the balance, not the total, so total - balance alone overstates cash received.
        collectedAmount={move.cancelTarget ? num(move.cancelTarget.total_amount) - num(move.cancelTarget.balance) - num(move.cancelTarget.discount_amount) : 0}
      />

      <HoldReasonModal
        isOpen={move.holdTarget !== null}
        onClose={() => move.setHoldTarget(null)}
        onConfirm={(reason) => {
          if (move.holdTarget) onUpdateStatus(move.holdTarget.id, 'on_hold', reason);
          move.setHoldTarget(null);
        }}
      />
    </>
  );
}
