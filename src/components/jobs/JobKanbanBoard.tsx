import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { User, Calendar, Scissors, Check, X, Loader2, AlertTriangle, Lock, Pause, Star, Store, Eye, Sparkles, Shirt, Zap, type LucideIcon } from 'lucide-react';
import { Job as JobItem, columnsForJobs, getDueStatus, TypeBadge, ColumnIcon, requiresDownpayment, ON_HOLD_COLUMN, PRODUCTION_COLUMNS, normalizeJobStatus, GARMENT_CATEGORY_LABELS } from './jobHelpers';
import { useAuthStore } from '@/store/useAuthStore';
import CancellationReasonModal from './CancellationReasonModal';
import HoldReasonModal from './HoldReasonModal';
import JobQuickViewModal from './JobQuickViewModal';
import { getMediaUrl } from '@/lib/media';
import { depositFraction } from './requirements';
import type { Staff } from '@/components/staff/staffHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';

/**
 * A plain mouse wheel scrolls the board sideways across the columns. Left
 * alone: trackpad sideways swipes and shift+wheel (already horizontal),
 * ctrl+wheel (zoom), a column whose own card list can still scroll that way
 * (its cards scroll first), and the board's ends (the page scrolls instead).
 */
function useWheelToHorizontal(ref: React.RefObject<HTMLDivElement | null>, active: boolean) {
  useEffect(() => {
    const board = ref.current;
    if (!active || !board) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.deltaY === 0) return;

      // A column list under the pointer that can still scroll vertically keeps the wheel.
      for (let el = e.target as HTMLElement | null; el && el !== board; el = el.parentElement) {
        const { overflowY } = getComputedStyle(el);
        if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) {
          const canScroll = e.deltaY > 0
            ? el.scrollTop + el.clientHeight < el.scrollHeight - 1
            : el.scrollTop > 0;
          if (canScroll) return;
        }
      }

      const atStart = board.scrollLeft <= 0;
      const atEnd = board.scrollLeft + board.clientWidth >= board.scrollWidth - 1;
      if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return; // let the page scroll

      e.preventDefault();
      // Line-based wheels (deltaMode 1, some mice / Firefox) report lines, not pixels.
      board.scrollLeft += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
    };

    // passive: false, or preventDefault() is ignored and the page scrolls too.
    board.addEventListener('wheel', onWheel, { passive: false });
    return () => board.removeEventListener('wheel', onWheel);
  }, [ref, active]);
}

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
  readonly viewMode?: 'kanban' | 'list' | 'columns';
  readonly staffList?: Staff[];
  readonly onAssignStaff?: (id: number, staffUserId: number | null) => Promise<void>;
}

const SUKI_TAG_CONFIG: Record<string, { label: string; cls: string; Icon: LucideIcon }> = {
  b2b_suki:       { label: 'B2B',      cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Star },
  reseller:       { label: 'Reseller', cls: 'bg-purple-50 text-purple-700 border-purple-200', Icon: Store },
  walk_in_retail: { label: 'Walk-in',  cls: 'bg-sunken text-ink-muted border-line', Icon: User },
};

// Completed piles up forever (unlike in-progress stages, which naturally
// drain as jobs move on) — capping it to the most recent few, with a manual
// expand, keeps the board scannable without hiding or deleting any job
// order. Full history for a specific customer/date range is what the
// Custom Jobs search bar is for; this is just about the live board view.
const COMPLETED_COLLAPSE_AT = 5;

export default function JobKanbanBoard({
  groupedJobs,
  activeColumns,
  onHoldJobs,
  actionLoadingId,
  onUpdateStatus,
  onApprove,
  onReject,
  highlightedJobId,
  stageFilter,
  viewMode = 'kanban',
  staffList = [],
  onAssignStaff,
}: JobKanbanBoardProps) {
  const repairRequiresDownpayment = Boolean(useAuthStore((s) => s.store?.repair_requires_downpayment));
  // POST .../jobs/{id}/reject is role:store_owner,branch_manager-only in
  // routes/api.php (grouped with pay/discount/destroy as a supervisory
  // action) — Approve is a plain PUT status update staff can already make,
  // but Reject was shown to every role and 403'd for plain staff.
  const user = useAuthStore((s) => s.user);
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );
  const isStaff = Boolean(user?.roles?.some((r) => r.name === 'staff')) && !isOwnerOrManager;
  // DP gate: tracks which job card just triggered the block (shows flash warning)
  // The board view's sideways-scrolling container (absent in list view).
  const boardRef = useRef<HTMLDivElement>(null);
  useWheelToHorizontal(boardRef, viewMode !== 'list');
  const [dpGateJobId, setDpGateJobId] = useState<number | null>(null);
  // Balance gate: "No Balance, No Claim" — blocks marking a job Completed/Claimed
  // while money is still owed, so revenue can't quietly slip through the cracks.
  const [balanceGateJobId, setBalanceGateJobId] = useState<number | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  // The backend requires a cancellation_reason (enum) whenever status is set
  // to 'cancelled' — the dropdown below has no field for that, so selecting
  // "Cancelled" needs to open the same reason modal the Job Detail page's
  // own status dropdown already uses, instead of firing the update directly
  // like every other option does.
  const [cancelTargetJob, setCancelTargetJob] = useState<JobItem | null>(null);
  const [holdTargetJob, setHoldTargetJob] = useState<JobItem | null>(null);

  // Quick-View Centered Modal State
  const [quickViewJob, setQuickViewJob] = useState<JobItem | null>(null);
  const [quickViewSequenceNumber, setQuickViewSequenceNumber] = useState<number | undefined>(undefined);

  const openQuickView = (job: JobItem, seq?: number) => {
    setQuickViewJob(job);
    setQuickViewSequenceNumber(seq);
  };

  // ── Where is this order going? ──
  // Hovering/focusing a one-click action lights up its destination column;
  // after the move, the card gets a single green flash where it lands.
  const [targetColumn, setTargetColumn] = useState<string | null>(null);
  const [arriving, setArriving] = useState<{ id: number; to: string } | null>(null);
  const previewTarget = (colId: string) => ({
    onMouseEnter: () => setTargetColumn(colId),
    onMouseLeave: () => setTargetColumn(null),
    onFocus: () => setTargetColumn(colId),
    onBlur: () => setTargetColumn(null),
  });
  const markMoving = (jobId: number, to: string) => {
    setTargetColumn(null);
    setArriving({ id: jobId, to: normalizeJobStatus(to) });
  };

  useEffect(() => {
    if (!arriving) return;
    const landed = (groupedJobs[arriving.to] ?? []).some((j) => j.id === arriving.id);
    if (!landed) {
      // Never landed (blocked or failed on the server): don't leave it armed.
      const giveUp = setTimeout(() => setArriving(null), 8000);
      return () => clearTimeout(giveUp);
    }
    // Bring the landed card into view if its column is off-screen.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(`job-card-${arriving.id}`)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
    const done = setTimeout(() => setArriving(null), 1600);
    return () => clearTimeout(done);
  }, [arriving, groupedJobs]);

  // Helper to sort jobs within each stage based on creation order / priority
  const getSortedColJobs = (jobsList: JobItem[], colId: string): JobItem[] => {
    if (colId === 'completed') {
      return [...jobsList].sort(
        (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
      );
    }
    return [...jobsList].sort((a, b) => {
      // 1. Rush orders always take first queue priority
      if (Boolean(a.is_rush) !== Boolean(b.is_rush)) {
        return a.is_rush ? -1 : 1;
      }
      // 2. Earliest due date if present
      if (a.due_date && b.due_date && a.due_date !== b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      // 3. FIFO / Creation order: earlier created job comes first
      return a.id - b.id;
    });
  };

  const handleStatusChange = (job: JobItem, newStatus: string) => {
    // Derived downpayment = total_amount minus current balance.
    // The job's own snapshotted payment policy decides how much must be paid
    // (none / full / a percent) — a ₱1 payment on a ₱10,000 job shouldn't
    // unlock production.
    // A discount lowers balance, not total, so subtract it or it would count
    // as cash paid (same formula as JobOrderController@update).
    const total = Number.parseFloat(String(job.total_amount ?? '0'));
    const balance = Number.parseFloat(String(job.balance ?? '0'));
    const discount = Number.parseFloat(String(job.discount_amount ?? '0'));
    const amountDue = total - discount;
    const paidSoFar = total - balance - discount;
    const noDownpayment = amountDue > 0 && paidSoFar + 0.005 < amountDue * depositFraction(job.payment_policy, job.payment_policy_percent);

    if (requiresDownpayment(job, newStatus, repairRequiresDownpayment) && noDownpayment) {
      // Block the move — show flash warning on the card
      setDpGateJobId(job.id);
      setTimeout(() => setDpGateJobId(null), 3500);
      return;
    }

    if (newStatus === 'completed' && balance > 0) {
      setBalanceGateJobId(job.id);
      setTimeout(() => setBalanceGateJobId(null), 3500);
      return;
    }

    if (newStatus === 'cancelled') {
      setCancelTargetJob(job);
      return;
    }

    if (newStatus === 'on_hold') {
      setHoldTargetJob(job);
      return;
    }
    markMoving(job.id, newStatus);
    onUpdateStatus(job.id, newStatus);
  };

  // Approving a pending job moves it into 'design' — the first pipeline
  // stage, exempt from the DP gate (no fabric/material is committed yet).
  // No downpayment pre-check needed here anymore; the gate only kicks in
  // once the job actually tries to enter a production stage.
  const handleApprove = (job: JobItem) => {
    markMoving(job.id, 'production');
    onApprove(job.id);
  };
  // Shown first, ahead of the sequential production stages, so a held job
  // isn't buried — kept out of `activeColumns` itself (see ON_HOLD_COLUMN)
  // so the "A → B → C" flow banner elsewhere on the page stays accurate.
  const baseColumns = onHoldJobs.length > 0 ? [ON_HOLD_COLUMN, ...activeColumns] : activeColumns;
  const boardColumns = stageFilter && stageFilter !== 'all'
    ? baseColumns.filter(c => c.id === stageFilter)
    : baseColumns;

  const allVisibleJobs = boardColumns.flatMap(col => col.id === 'on_hold' ? onHoldJobs : (groupedJobs[col.id] ?? []));

  return (
    <>
    {viewMode === 'list' ? (
      <div className="space-y-3.5">
        {boardColumns.map(col => {
          const colJobs = col.id === 'on_hold' ? onHoldJobs : (groupedJobs[col.id] ?? []);
          return (
            <div
              key={col.id}
              className="bg-[#faf7f4] border border-line/70 rounded-2xl overflow-hidden shadow-2xs"
            >
              {/* Stage Header Card */}
              <div className="bg-white border-b border-line/70 px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-taupe" />
                  <h3 className="font-bold text-ink text-xs sm:text-sm tracking-tight">{col.title}</h3>
                </div>
                <span className="h-5 min-w-[20px] px-2 rounded-full bg-[#f2ede7] text-[11px] font-bold text-ink-muted flex items-center justify-center tabular-nums">
                  {colJobs.length}
                </span>
              </div>

              {/* Stage Items */}
              {colJobs.length === 0 ? (
                <div className="py-6 px-4 text-center text-[11px] font-medium text-ink-muted/70 bg-white/40">
                  No orders in this stage
                </div>
              ) : (
                <div className="divide-y divide-line/60 bg-white">
                  {getSortedColJobs(colJobs, col.id).map((job, idx) => {
                    const sequenceNumber = idx + 1;
                    const assignedStaffId = job.assigned_staff_id ?? job.assigned_to ?? (job.assigned_staff as { id?: number })?.id ?? null;
                    const assignedStaffName =
                      job.assigned_staff?.name ||
                      (job.assignedTo as { name?: string })?.name ||
                      (job.assignedStaff as { name?: string })?.name ||
                      staffList.find((s) => (s.user_id ?? s.user?.id) === assignedStaffId)?.user?.name ||
                      null;

                    return (
                      <div
                        key={job.id}
                        className="p-3 sm:px-4 flex items-center justify-between gap-4 hover:bg-canvas/30 transition-colors flex-wrap sm:flex-nowrap text-xs"
                      >
                        {/* Left: Sequence Badge + Order # & Customer */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <span
                            title={`Queue Position #${sequenceNumber} (Priority: ${job.is_rush ? 'Rush Order' : 'Standard'})`}
                            className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-md font-mono text-[10px] font-black tracking-tight shrink-0 shadow-2xs ${
                              job.is_rush
                                ? 'bg-rose-600 text-white ring-1 ring-rose-400'
                                : 'bg-stone-800 text-amber-300'
                            }`}
                          >
                            #{sequenceNumber}
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => openQuickView(job, sequenceNumber)}
                              className="font-mono text-xs font-black text-ink hover:text-taupe transition-colors cursor-pointer text-left whitespace-nowrap block"
                            >
                              {job.order_number || `#${job.id}`}
                            </button>
                            <div
                              onClick={() => openQuickView(job, sequenceNumber)}
                              className="text-[11px] text-ink-muted cursor-pointer hover:text-ink"
                            >
                              {job.customer?.name ?? 'Walk-in Customer'}
                            </div>
                          </div>
                        </div>

                        {/* Channel & Type */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <TypeBadge type={job.intake_channel} />
                          {job.is_rush && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold uppercase border border-rose-200">
                              Rush
                            </span>
                          )}
                          {job.design_origin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-sunken font-medium uppercase text-ink-muted">
                              {job.design_origin}
                            </span>
                          )}
                        </div>

                        {/* Due Date */}
                        <div className="text-[11px] text-ink-muted shrink-0">
                          {job.due_date ? `Due: ${new Date(job.due_date).toLocaleDateString()}` : 'No due date'}
                        </div>

                        {/* Assigned Tailor */}
                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="w-5 h-5 rounded-full bg-taupe/15 text-taupe font-bold flex items-center justify-center text-[9px] shrink-0">
                            {assignedStaffName ? assignedStaffName.slice(0, 2).toUpperCase() : <Scissors size={9} />}
                          </div>
                          {isOwnerOrManager ? (
                            <select
                              aria-label={`Assign tailor for order ${job.order_number || job.id}`}
                              value={assignedStaffId ? String(assignedStaffId) : ''}
                              onChange={(e) => {
                                const newId = e.target.value ? Number(e.target.value) : null;
                                if (onAssignStaff) onAssignStaff(job.id, newId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-bold bg-canvas border border-line rounded-md px-2 py-1 text-ink focus:outline-none cursor-pointer max-w-[130px] truncate"
                            >
                              <option value="">+ Assign Tailor</option>
                              {staffList.map((s) => {
                                const sUserId = s.user_id ?? s.user?.id;
                                const sName = s.user?.name || `Tailor #${sUserId}`;
                                return (
                                  <option key={sUserId} value={sUserId}>
                                    {sName}
                                  </option>
                                );
                              })}
                            </select>
                          ) : (
                            <span className="text-[11px] font-semibold text-ink truncate max-w-[110px]">
                              {assignedStaffName || 'Unassigned'}
                            </span>
                          )}
                        </div>

                        {/* Financials */}
                        <div className="text-right shrink-0">
                          <div className="font-bold text-ink">
                            ₱{Number(job.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          {Number(job.balance ?? 0) > 0 ? (
                            <div className="text-[10px] text-amber-700 font-semibold">
                              Bal: ₱{Number(job.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700 font-semibold">Fully Paid</div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => openQuickView(job, sequenceNumber)}
                            className="h-7 px-2.5 rounded-lg bg-surface hover:bg-canvas border border-line text-ink text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div
        ref={boardRef}
        // Columns keep a readable width; the board scrolls sideways instead of
        // squeezing all seven stages into the screen. The mouse wheel scrolls
        // it sideways too (useWheelToHorizontal).
        className="flex gap-3 overflow-x-auto pb-4 items-stretch select-none overscroll-x-contain"
        style={{ minHeight: 'calc(100vh - 270px)' }}
      >
        {boardColumns.map(col => {
          const colJobs = col.id === 'on_hold' ? onHoldJobs : (groupedJobs[col.id] ?? []);
          const isCollapsible = col.id === 'completed' && colJobs.length > COMPLETED_COLLAPSE_AT;
          const isExpanded = expandedColumns[col.id] ?? false;
          const sortedJobs = getSortedColJobs(colJobs, col.id);
          const visibleJobs = isCollapsible && !isExpanded ? sortedJobs.slice(0, COMPLETED_COLLAPSE_AT) : sortedJobs;
          return (
            <div
              key={col.id}
              id={`kanban-col-${col.id}`}
              className={`border rounded-2xl p-3 flex flex-col gap-3 shrink-0 transition-[border-color,box-shadow,background-color] duration-200 ease-out ${
                viewMode === 'columns' ? 'w-[280px]' : 'w-[320px]'
              } ${
                targetColumn === col.id
                  ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  : 'border-line/70 bg-[#faf7f4] shadow-2xs'
              }`}
              data-move-target={targetColumn === col.id ? 'true' : undefined}
              style={{ maxHeight: 'calc(100vh - 270px)' }}
            >
              {/* Column Header Card */}
              <div className="bg-white border border-line/80 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs">
                <h3 className="font-bold text-ink text-sm tracking-tight">{col.title}</h3>
                <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-[#f2ede7] text-[11px] font-bold text-ink-muted flex items-center justify-center tabular-nums">
                  {colJobs.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3 overflow-y-auto flex-1 hide-scrollbar">
                {visibleJobs.length === 0 ? (
                  <div className="border border-dashed border-line/80 rounded-xl py-12 px-3 flex items-center justify-center text-center bg-white/40 flex-1">
                    <p className="text-[11px] font-medium text-ink-muted/70">
                      No orders in this stage
                    </p>
                  </div>
                ) : (
                  visibleJobs.map((job, idx) => {
                    const sequenceNumber = idx + 1;
                    const assignedStaffId = job.assigned_staff_id ?? job.assigned_to ?? (job.assigned_staff as { id?: number })?.id ?? null;
                    const assignedStaffName =
                      job.assigned_staff?.name ||
                      (job.assignedTo as { name?: string })?.name ||
                      (job.assignedStaff as { name?: string })?.name ||
                      staffList.find((s) => (s.user_id ?? s.user?.id) === assignedStaffId)?.user?.name ||
                      null;

                    return (
              <div key={job.id} id={`job-card-${job.id}`}>
                <div className={`bg-white border p-4 rounded-xl transition-all group relative ${
                  arriving?.id === job.id && normalizeJobStatus(job.status) === arriving.to ? 'kanban-arrive ' : ''
                }${
                  highlightedJobId === job.id
                    ? 'ring-2 ring-amber-500 ring-offset-2 scale-[1.02] shadow-md bg-amber-50/40 duration-300'
                    : job.status === 'pending'
                    ? 'border-amber-200 hover:border-amber-300'
                    : job.status === 'on_hold'
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-line-strong hover:border-taupe/50'
                }`}>
                  {/* Card Header Row 1: Sequence Badge + Full Order ID (Left) & Quick-View Eye Button (Right) */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Sequence Badge based on creation order / priority */}
                      <span
                        title={`Queue sequence #${sequenceNumber} in this stage${job.is_rush ? ' (Rush Order Priority)' : ''}`}
                        className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[11px] font-black tracking-tight shrink-0 shadow-2xs ${
                          job.is_rush
                            ? 'bg-rose-600 text-white ring-1 ring-rose-400'
                            : 'bg-stone-800 text-amber-300'
                        }`}
                      >
                        #{sequenceNumber}
                      </span>

                      {/* Full Order Number — Completely visible, never truncated or overlapped */}
                      <button
                        type="button"
                        onClick={() => openQuickView(job, sequenceNumber)}
                        title={`Quick View ${job.order_number || `#${job.id}`}`}
                        className="font-mono text-sm font-black text-ink hover:text-taupe transition-colors whitespace-nowrap cursor-pointer text-left focus:outline-none"
                      >
                        {job.order_number || `#${job.id}`}
                      </button>
                    </div>

                    {/* Quick View Eye Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuickView(job, sequenceNumber);
                      }}
                      title={`Quick View ${job.order_number || 'Job Details'}`}
                      aria-label={`Quick view ${job.order_number || 'job details'}`}
                      className="h-8 w-8 rounded-lg bg-canvas hover:bg-surface text-ink-muted hover:text-ink border border-line flex items-center justify-center transition-colors shadow-2xs active:scale-95 cursor-pointer shrink-0"
                    >
                      <Eye size={14} />
                    </button>
                  </div>

                  {/* Card Header Row 2: Intake channel & Rush (Left) + Stage Changer / Status Badge (Right) */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <TypeBadge type={job.intake_channel} />
                      {job.is_rush && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                          Rush
                        </span>
                      )}
                      {job.design_origin && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sunken font-medium uppercase text-ink-muted border border-line/60 shrink-0">
                          {job.design_origin}
                        </span>
                      )}
                    </div>

                    {/* Stage selector or Pending badge */}
                    <div className="shrink-0">
                      {normalizeJobStatus(job.status) === 'pending' ? (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1 shadow-2xs">
                          <AlertTriangle size={11} className="text-amber-700 shrink-0" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <select
                          value={normalizeJobStatus(job.status)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(job, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          title="Change stage"
                          className="text-[11px] font-bold bg-canvas text-ink-body border border-line rounded-md px-2 py-1 hover:border-taupe/70 focus:border-taupe transition-colors focus:outline-none cursor-pointer max-w-[140px] truncate"
                        >
                          {(isStaff
                            ? PRODUCTION_COLUMNS.filter((c) =>
                                ['production', 'quality_check', 'ready_for_fitting', 'adjustments', 'ready_for_pickup'].includes(c.id)
                              )
                            : PRODUCTION_COLUMNS
                          ).map((c) => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                          {!isStaff && <option value="on_hold">On Hold</option>}
                          {!isStaff && <option value="cancelled">Cancelled</option>}
                        </select>
                      )}
                    </div>
                  </div>

                  {job.status === 'on_hold' && job.hold_reason && (
                    <div className="mb-3 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                      <Pause size={11} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-amber-700 leading-snug">{job.hold_reason}</p>
                    </div>
                  )}

                  {/* Card Body — opens Centered Quick-View Modal */}
                  <div
                    onClick={() => openQuickView(job, sequenceNumber)}
                    className="block space-y-3 cursor-pointer group-hover:opacity-95"
                    title="Click to quick-view full job details"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="font-bold text-ink text-base leading-tight truncate">{job.customer?.name || 'Walk-in'}</h4>
                        {job.customer?.suki_tag && SUKI_TAG_CONFIG[job.customer.suki_tag] && (
                          <span className={`inline-flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${SUKI_TAG_CONFIG[job.customer.suki_tag].cls}`}>
                            {(() => {
                              const TagIcon = SUKI_TAG_CONFIG[job.customer.suki_tag].Icon;
                              return <TagIcon size={8} />;
                            })()}
                            {SUKI_TAG_CONFIG[job.customer.suki_tag].label}
                          </span>
                        )}
                      </div>
                      {(() => {
                        let payBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                        if (job.payment_status === 'paid') payBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        else if (job.payment_status === 'partial') payBadge = 'bg-amber-50 text-amber-800 border-amber-200';
                        return (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide shrink-0 ${payBadge}`}>
                            {job.payment_status}
                          </span>
                        );
                      })()}
                    </div>
                    
                    {/* Visual Anchor: Design Thumbnail & Details */}
                    {(() => {
                      const catalogImage =
                        job.catalog_item?.images?.find((i: { is_primary?: boolean | number; image_url: string }) => Boolean(i.is_primary))?.image_url ||
                        job.catalog_item?.images?.[0]?.image_url ||
                        job.catalog_item?.fabric_image_url;
                      const refImage =
                        catalogImage ||
                        (job.reference_images && job.reference_images.length > 0 ? job.reference_images[0] : null);
                      const standardSize = (job.custom_order_data as Record<string, unknown> | null | undefined)?.standard_size;

                      return (
                        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-canvas/40 border border-line/60">
                          {refImage ? (
                            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-sunken shrink-0 border border-line">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getMediaUrl(refImage)}
                                alt="Design Preview"
                                className="w-full h-full object-cover"
                              />
                              {(job.reference_images?.length ?? 0) > 0 && (
                                <span
                                  title={`${job.reference_images!.length} customer reference photo(s)`}
                                  className="absolute bottom-0 right-0 bg-black/70 text-white text-[8px] font-bold leading-none px-1 py-0.5 rounded-tl"
                                >
                                  +{job.reference_images!.length}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-md bg-sunken flex items-center justify-center text-ink-faint shrink-0 border border-line">
                              <Shirt size={18} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            {job.catalog_item ? (
                              <div className="flex items-center gap-1 text-xs font-bold text-taupe truncate">
                                <Sparkles size={11} className="shrink-0" />
                                <span className="truncate">{job.catalog_item.name}</span>
                                {(job.quantity ?? 1) > 1 && <span className="shrink-0 text-ink-muted">×{job.quantity}</span>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs font-bold text-ink-body truncate">
                                <span className="truncate">{job.garment_category ? (GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category) : (job.service?.name || 'Custom Garment')}</span>
                                {(job.quantity ?? 1) > 1 && <span className="shrink-0">×{job.quantity}</span>}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-ink-muted mt-1">
                              {typeof standardSize === 'string' && standardSize ? (
                                <span className="px-1 py-0.2 rounded bg-surface border border-line font-bold text-[9px] text-ink">
                                  Size {standardSize}
                                </span>
                              ) : null}
                              <span className="truncate">{job.service_package?.name || job.service?.name || 'Tailored'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {Number.parseFloat(job.balance as string || '0') > 0 && (
                      <div className="text-xs font-bold text-rose-600 tabular-nums">
                        Balance due: ₱{Number.parseFloat(job.balance as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-line gap-3">
                    {/* Visual Tailor Avatar Badge & Manager Assignment Dropdown */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                      {isOwnerOrManager ? (
                        <div className="relative flex items-center min-w-0 flex-1 max-w-[190px]">
                          <div
                            title={assignedStaffName ? `Assigned to ${assignedStaffName} (Click to reassign)` : 'Click to assign tailor'}
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-2xs w-full ${
                              assignedStaffName
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900'
                                : 'bg-stone-100/90 border-dashed border-stone-300 text-ink-muted hover:border-taupe/60'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-taupe/20 text-taupe font-black flex items-center justify-center text-[8px] shrink-0">
                              {assignedStaffName ? assignedStaffName.slice(0, 2).toUpperCase() : <Scissors size={8} />}
                            </div>
                            <select
                              aria-label={`Assign tailor for order ${job.order_number || job.id}`}
                              value={assignedStaffId ? String(assignedStaffId) : ''}
                              onChange={(e) => {
                                const newId = e.target.value ? Number(e.target.value) : null;
                                if (onAssignStaff) onAssignStaff(job.id, newId);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-transparent font-bold cursor-pointer focus:outline-none w-full truncate text-[11px]"
                            >
                              <option value="">+ Assign Tailor</option>
                              {staffList.map((s) => {
                                const sUserId = s.user_id ?? s.user?.id;
                                const sName = s.user?.name || `Tailor #${sUserId}`;
                                return (
                                  <option key={sUserId} value={sUserId}>
                                    {sName}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                        </div>
                      ) : (
                        /* Staff / Tailor view: avatar badge */
                        <div
                          title={assignedStaffName ? `Assigned to ${assignedStaffName}` : 'Unassigned'}
                          className="flex items-center gap-1.5 text-xs text-ink-faint min-w-0"
                        >
                          <div className="w-4 h-4 rounded-full bg-taupe/20 text-taupe font-bold flex items-center justify-center text-[8px] shrink-0">
                            {assignedStaffName ? assignedStaffName.slice(0, 2).toUpperCase() : <Scissors size={8} />}
                          </div>
                          <span className="truncate max-w-[110px] font-semibold text-ink-body text-[11px]">
                            {assignedStaffName || 'Unassigned'}
                          </span>
                        </div>
                      )}
                    </div>
                    {job.due_date && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-ink-muted">
                          <Calendar size={11} />
                          {new Date(job.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                        {(() => {
                          const dueStatus = getDueStatus(job.due_date, job.status);
                          if (!dueStatus) return null;
                          return (
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${dueStatus.className}`}>
                              {dueStatus.label}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* DP Gate Hard Block — flashes when owner tries to skip DP */}
                  {dpGateJobId === job.id && (
                    <div className="mt-3 pt-2.5 border-t border-red-100 animate-pulse">
                      <div className="flex items-start gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-2">
                        <Lock size={12} className="text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">No DP - Move Blocked!</p>
                          <p className="text-[10px] text-red-600 mt-0.5">50% downpayment must be collected before production starts. Log DP first.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Balance Gate Hard Block — flashes when owner tries to complete/claim with money still owed */}
                  {balanceGateJobId === job.id && (
                    <div className="mt-3 pt-2.5 border-t border-red-100 animate-pulse">
                      <div className="flex items-start gap-2 bg-red-50 border border-red-300 rounded-lg px-3 py-2">
                        <Lock size={12} className="text-red-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wide">Balance Unpaid - Move Blocked!</p>
                          <p className="text-[10px] text-red-600 mt-0.5">Full balance must be settled before marking as Completed/Claimed. Log payment first.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passive DP warning — already in a production stage but unpaid */}
                  {requiresDownpayment(job, job.status, repairRequiresDownpayment) && job.payment_status === 'unpaid' && dpGateJobId !== job.id && (
                    <div className="mt-3 pt-2.5 border-t border-amber-100">
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <Lock size={12} className="text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">DP Gate: Collect Now</p>
                          <p className="text-[10px] text-amber-600 mt-0.5">No downpayment on record. Log DP in the financials tab.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feasibility Review Gate (Pending only) */}
                  {normalizeJobStatus(job.status) === 'pending' && (
                    <div className="mt-4 pt-3 border-t border-amber-100 flex items-center gap-2">
                      {actionLoadingId === job.id ? (
                        <div className="flex-1 flex justify-center"><Loader2 size={14} className="animate-spin text-amber-500" /></div>
                      ) : (
                        <>
                          <button
                            type="button"
                            {...previewTarget('production')}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); handleApprove(job); }}
                            title="Approve to Production"
                            className="flex-1 min-w-0 min-h-10 flex items-center justify-center gap-1.5 whitespace-nowrap text-xs font-bold py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer"
                          >
                            <Check size={14} className="shrink-0" /> <span className="truncate">{viewMode === 'columns' ? 'Approve' : 'Approve to Production'}</span>
                          </button>
                          {isOwnerOrManager && (
                            <button
                              type="button"
                              onClick={e => { e.preventDefault(); e.stopPropagation(); onReject(job.id); }}
                              className="shrink-0 min-h-10 flex items-center justify-center gap-1 whitespace-nowrap text-xs font-semibold py-2 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <X size={14} className="shrink-0" /> <span>Reject</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* 1-Click Quick Advance for Less Clicks & Faster Shop Workflow */}
                  {(() => {
                    const norm = normalizeJobStatus(job.status);
                    if (norm === 'pending' || norm === 'completed') return null;
                    if (actionLoadingId === job.id) {
                      return (
                        <div className="mt-2.5 pt-2 border-t border-line/60 flex justify-center py-1">
                          <Loader2 size={13} className="animate-spin text-taupe" />
                        </div>
                      );
                    }
                    if (norm === 'production') {
                      return (
                        <button
                          type="button"
                          {...previewTarget('quality_check')}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'quality_check'); }}
                          className="w-full mt-3 min-h-10 py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/80 flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span>Move to Quality Check</span>
                          <span className="text-[10px]">→</span>
                        </button>
                      );
                    }
                    if (norm === 'quality_check') {
                      return (
                        <button
                          type="button"
                          {...previewTarget('ready_for_fitting')}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'ready_for_fitting'); }}
                          className="w-full mt-3 min-h-10 py-2 px-3 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold border border-violet-200/80 flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span>Ready for Fitting</span>
                          <span className="text-[10px]">→</span>
                        </button>
                      );
                    }
                    if (norm === 'ready_for_fitting') {
                      return (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            type="button"
                            {...previewTarget('adjustments')}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'adjustments'); }}
                            className="min-h-10 py-2 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200/80 text-center transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Adjustments
                          </button>
                          <button
                            type="button"
                            {...previewTarget('ready_for_pickup')}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'ready_for_pickup'); }}
                            className="min-h-10 py-2 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200/80 text-center transition-all active:scale-[0.98] cursor-pointer"
                          >
                            Ready for Pickup →
                          </button>
                        </div>
                      );
                    }
                    if (norm === 'adjustments') {
                      return (
                        <button
                          type="button"
                          {...previewTarget('quality_check')}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'quality_check'); }}
                          className="w-full mt-3 min-h-10 py-2 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold border border-purple-200/80 flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span>Back to Quality Check</span>
                          <span className="text-[10px]">→</span>
                        </button>
                      );
                    }
                    if (norm === 'ready_for_pickup') {
                      return (
                        <button
                          type="button"
                          {...previewTarget('completed')}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'completed'); }}
                          className="w-full mt-3 min-h-10 py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Mark Completed</span>
                        </button>
                      );
                    }
                    if (norm === 'on_hold') {
                      return (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, 'production'); }}
                          className="w-full mt-3 min-h-10 py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold border border-blue-200/80 flex items-center justify-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span>Resume to Production</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                </div>
              </div>
            );
          }))}

            {isCollapsible && (
              <button
                type="button"
                onClick={() => setExpandedColumns(prev => ({ ...prev, [col.id]: !isExpanded }))}
                className="w-full text-center py-2 text-xs font-semibold text-taupe hover:underline"
              >
                {isExpanded ? 'Show less' : `Show all ${colJobs.length} completed`}
              </button>
            )}

          </div>
        </div>
        );
      })}
    </div>
    )}

    <CancellationReasonModal
      isOpen={cancelTargetJob !== null}
      onClose={() => setCancelTargetJob(null)}
      onConfirm={(reason) => {
        if (cancelTargetJob) {
          onUpdateStatus(cancelTargetJob.id, 'cancelled', reason);
        }
        setCancelTargetJob(null);
      }}
      // Same discount-vs-real-payment fix as the job detail page's own
      // cancellation flow — applyDiscount reduces balance directly, so
      // total_amount - balance alone overstates cash actually received.
      collectedAmount={cancelTargetJob
        ? Number.parseFloat(String(cancelTargetJob.total_amount ?? '0')) - Number.parseFloat(String(cancelTargetJob.balance ?? '0')) - Number.parseFloat(String(cancelTargetJob.discount_amount ?? '0'))
        : 0}
    />

    <HoldReasonModal
      isOpen={holdTargetJob !== null}
      onClose={() => setHoldTargetJob(null)}
      onConfirm={(reason) => {
        if (holdTargetJob) {
          onUpdateStatus(holdTargetJob.id, 'on_hold', reason);
        }
        setHoldTargetJob(null);
      }}
    />

    {/* Centered Quick-View Modal */}
    <JobQuickViewModal
      isOpen={quickViewJob !== null}
      job={quickViewJob}
      sequenceNumber={quickViewSequenceNumber}
      staffList={staffList}
      onAssignStaff={onAssignStaff}
      onClose={() => setQuickViewJob(null)}
      onApprove={(jobId) => {
        onApprove(jobId);
        setQuickViewJob(null);
      }}
      onReject={(jobId) => {
        onReject(jobId);
        setQuickViewJob(null);
      }}
      actionLoadingId={actionLoadingId}
    />
    </>
  );
}
