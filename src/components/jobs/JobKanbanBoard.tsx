import React, { useEffect, useRef, useState } from 'react';
import { Check, X, Loader2, Lock, Pause, Clock, Scissors, MoreHorizontal } from 'lucide-react';
import { Job as JobItem, columnsForJobs, ON_HOLD_COLUMN, PRODUCTION_COLUMNS, STAGE_STYLE, normalizeJobStatus, GARMENT_CATEGORY_LABELS, needsMeasuring } from './jobHelpers';
import { useAuthStore } from '@/store/useAuthStore';
import { READ_ONLY_HINT, useShopReadOnly } from '@/hooks/useShopReadOnly';
import CancellationReasonModal from './CancellationReasonModal';
import HoldReasonModal from './HoldReasonModal';
import JobQuickViewModal from './JobQuickViewModal';
import { depositBase, depositFraction } from './requirements';
import { requiresDownpayment } from './jobHelpers';
import type { Staff } from '@/components/staff/staffHelpers';
import { staffForBranch, staffOptionLabel } from '@/components/staff/staffHelpers';
import {
  DUE_GROUPS,
  DUE_TONE_CLASS,
  assignedStaffId as staffIdOf,
  byUrgency,
  dueDays,
  dueLabel,
  isOverdue,
  missingDownpayment,
} from './boardAttention';

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

const PAY_CLASS: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-800',
  partial: 'bg-sunken text-ink-body',
  unpaid: 'bg-rose-50 text-rose-700',
};

/** "Polo shirt × 30" — the design, else the garment type, else the service. */
function itemLabel(job: JobItem): string {
  const name = job.catalog_item?.name
    || (job.garment_category ? (GARMENT_CATEGORY_LABELS[job.garment_category] ?? job.garment_category) : '')
    || job.service_package?.name
    || job.service?.name
    || 'Custom garment';
  return (job.quantity ?? 1) > 1 ? `${name} × ${job.quantity}` : name;
}

function staffNameOf(job: JobItem, staffList: Staff[], id: number | null): string | null {
  return job.assigned_staff?.name
    || (job.assignedTo as { name?: string } | undefined)?.name
    || (job.assignedStaff as { name?: string } | undefined)?.name
    || staffList.find((s) => (s.user_id ?? s.user?.id) === id)?.user?.name
    || null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name.slice(0, 2).toUpperCase();
}

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
  // POST .../jobs/{id}/approve and /reject are role:store_owner,branch_manager-only
  // in routes/api.php (approving commits the shop to the price, due date and deposit).
  // Plain staff see a "waiting for approval" note instead of buttons that would 403.
  const user = useAuthStore((s) => s.user);
  const isOwnerOrManager = Boolean(
    user?.roles?.some((r) => ['store_owner', 'branch_manager', 'super_admin'].includes(r.name))
  );
  const isStaff = Boolean(user?.roles?.some((r) => r.name === 'staff')) && !isOwnerOrManager;
  // Plan ended: the server refuses every stage move (CheckRole), so the controls are disabled, not offered.
  const { readOnly } = useShopReadOnly(useAuthStore((s) => s.store?.id));
  const readOnlyHint = READ_ONLY_HINT;
  // The board view's sideways-scrolling container (absent in list view).
  const boardRef = useRef<HTMLDivElement>(null);
  useWheelToHorizontal(boardRef, viewMode !== 'list');
  // DP gate: which card just tried to skip the downpayment (shows a short warning).
  const [dpGateJobId, setDpGateJobId] = useState<number | null>(null);
  // Balance gate: "No Balance, No Claim" — blocks marking a job Completed/Claimed
  // while money is still owed, so revenue can't quietly slip through the cracks.
  const [balanceGateJobId, setBalanceGateJobId] = useState<number | null>(null);
  // Completed is folded by default: the board is about work still to do.
  const [showCompleted, setShowCompleted] = useState(false);
  // The backend requires a cancellation_reason (enum) whenever status is set
  // to 'cancelled', so "Cancelled" opens the reason modal instead of firing directly.
  const [cancelTargetJob, setCancelTargetJob] = useState<JobItem | null>(null);
  const [holdTargetJob, setHoldTargetJob] = useState<JobItem | null>(null);

  // Quick-View Centered Modal State
  const [quickViewJob, setQuickViewJob] = useState<JobItem | null>(null);
  const openQuickView = (job: JobItem) => setQuickViewJob(job);

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
    // A card moving into folded Completed opens it, so the landing flash is seen.
    if (normalizeJobStatus(to) === 'completed') setShowCompleted(true);
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

  const handleStatusChange = (job: JobItem, newStatus: string) => {
    // The job's own snapshotted payment policy decides how much must be paid
    // (none / full / a percent) — a ₱1 payment on a ₱10,000 job shouldn't
    // unlock production. A discount lowers balance, not total, so subtract it
    // or it would count as cash paid (same formula as JobOrderController@update).
    const total = Number.parseFloat(String(job.total_amount ?? '0'));
    const balance = Number.parseFloat(String(job.balance ?? '0'));
    const discount = Number.parseFloat(String(job.discount_amount ?? '0'));
    const amountDue = total - discount;
    const paidSoFar = total - balance - discount;
    const noDownpayment = amountDue > 0 && paidSoFar + 0.005 < depositBase(job) * depositFraction(job.payment_policy, job.payment_policy_percent);

    if (requiresDownpayment(job, newStatus, repairRequiresDownpayment) && noDownpayment) {
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

  // Approving a pending job moves it into production; the DP gate only kicks
  // in once the job actually tries to enter a production stage.
  const handleApprove = (job: JobItem) => {
    markMoving(job.id, 'production');
    onApprove(job.id);
  };

  // On Hold shows first, ahead of the sequential stages, so a held job isn't buried.
  const baseColumns = onHoldJobs.length > 0 ? [ON_HOLD_COLUMN, ...activeColumns] : activeColumns;
  const boardColumns = stageFilter && stageFilter !== 'all'
    ? baseColumns.filter(c => c.id === stageFilter)
    : baseColumns;
  const jobsOf = (colId: string) => (colId === 'on_hold' ? onHoldJobs : (groupedJobs[colId] ?? []));
  const stageTitle = (status: string) =>
    [ON_HOLD_COLUMN, ...PRODUCTION_COLUMNS].find((c) => c.id === normalizeJobStatus(status))?.title ?? status;

  // ── One-click next step (hovering it lights up where the order will go) ──
  const nextAction = (job: JobItem, compact = false) => {
    const norm = normalizeJobStatus(job.status);
    if (actionLoadingId === job.id) {
      return <div className="flex justify-center py-2"><Loader2 size={14} className="animate-spin text-taupe" /></div>;
    }
    const btn = 'min-h-9 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap transition-colors active:scale-[0.98] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-taupe/40';
    const quiet = `${btn} border border-line-strong bg-surface text-ink hover:bg-ink hover:border-ink hover:text-white`;
    const go = (to: string, label: React.ReactNode, cls = quiet, hint?: string) => (
      <button
        type="button"
        {...previewTarget(to)}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleStatusChange(job, to); }}
        disabled={readOnly}
        title={readOnly ? readOnlyHint : hint}
        className={`${cls} ${compact ? '' : 'flex-1'} disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {label}
      </button>
    );

    if (norm === 'pending') {
      if (!isOwnerOrManager) {
        return (
          <p className="flex items-center gap-1.5 text-xs text-amber-800">
            <Clock size={13} className="shrink-0" aria-hidden="true" /> Waiting for approval
          </p>
        );
      }
      return (
        <>
          <button
            type="button"
            {...previewTarget('production')}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleApprove(job); }}
            disabled={readOnly}
            title={readOnly ? readOnlyHint : undefined}
            className={`${btn} bg-emerald-700 hover:bg-emerald-800 text-white ${compact ? '' : 'flex-1'} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <Check size={14} aria-hidden="true" /> Approve
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onReject(job.id); }}
            disabled={readOnly}
            aria-label={compact ? `Reject ${job.order_number || `order ${job.id}`}` : undefined}
            title={readOnly ? readOnlyHint : compact ? 'Reject' : undefined}
            className={`${btn} border border-rose-200 text-rose-700 hover:bg-rose-50 ${compact ? 'w-9 px-0' : ''} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <X size={14} aria-hidden="true" />{!compact && ' Reject'}
          </button>
        </>
      );
    }
    if (norm === 'production') return go('quality_check', <>{compact ? 'To QC' : 'To quality check'} →</>);
    // Didn't pass QC: send it back to production. The list view has room for one
    // button, so there it stays in the "…" menu (same as Adjustments below).
    if (norm === 'quality_check' && compact) return go('ready_for_fitting', <>To fitting →</>);
    if (norm === 'quality_check') {
      return (
        <>
          {go('production', <>← Production</>, `${btn} border border-line-strong bg-surface text-ink hover:bg-sunken`, "Didn't pass QC? Send it back to production")}
          {go('ready_for_fitting', <>Ready for fitting →</>)}
        </>
      );
    }
    // The list view has room for one button; Adjustments stays in the "…" menu there.
    if (norm === 'ready_for_fitting' && compact) return go('ready_for_pickup', <>Fitting OK →</>);
    if (norm === 'ready_for_fitting') {
      return (
        <>
          {go('adjustments', 'Adjustments', `${btn} border border-line-strong bg-surface text-ink hover:bg-sunken`)}
          {go('ready_for_pickup', <>Fitting OK →</>)}
        </>
      );
    }
    if (norm === 'adjustments') return go('quality_check', <>Back to QC →</>);
    if (norm === 'ready_for_pickup') return go('completed', <><Check size={13} aria-hidden="true" /> Claimed</>, `${btn} bg-emerald-700 hover:bg-emerald-800 text-white`);
    if (norm === 'on_hold') return go('production', <>Resume →</>);
    return null;
  };

  // Stage menu for anything the one-click step doesn't cover (skip ahead, hold, cancel).
  const stageMenu = (job: JobItem) => {
    const norm = normalizeJobStatus(job.status);
    if (norm === 'pending' || norm === 'completed') return null;
    // A native select (keyboard + screen reader friendly) under a "…" icon.
    return (
      <span className={`relative h-9 w-9 shrink-0 rounded-lg border border-line bg-surface text-ink-body inline-flex items-center justify-center hover:border-line-strong focus-within:ring-2 focus-within:ring-taupe/40 ${readOnly ? 'opacity-50' : ''}`}>
        <MoreHorizontal size={16} aria-hidden="true" />
        <select
          value={norm}
          onChange={(e) => handleStatusChange(job, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Move ${job.order_number || `order ${job.id}`} to another stage`}
          disabled={readOnly}
          title={readOnly ? readOnlyHint : 'Move to another stage'}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {(isStaff
            ? PRODUCTION_COLUMNS.filter((c) => ['production', 'quality_check', 'ready_for_fitting', 'adjustments', 'ready_for_pickup'].includes(c.id))
            : PRODUCTION_COLUMNS.filter((c) => c.id !== 'pending')
          ).map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
          {!isStaff && <option value="on_hold">On Hold</option>}
          {!isStaff && <option value="cancelled">Cancelled</option>}
        </select>
      </span>
    );
  };

  const tailor = (job: JobItem) => {
    const id = staffIdOf(job);
    const name = staffNameOf(job, staffList, id);
    const avatar = (
      <span
        aria-hidden="true"
        className={`w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center text-[10px] font-bold ${
          name ? 'bg-taupe/15 text-taupe-dark' : 'border border-dashed border-line-strong text-ink-muted'
        }`}
      >
        {name ? initials(name) : <Scissors size={10} />}
      </span>
    );
    if (!isOwnerOrManager) {
      return (
        <span className="flex items-center gap-1.5 min-w-0 text-xs font-semibold text-ink-body">
          {avatar}<span className="truncate">{name || 'Unassigned'}</span>
        </span>
      );
    }
    return (
      <label className="flex items-center gap-1.5 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
        {avatar}
        <span className="sr-only">Tailor for {job.order_number || `order ${job.id}`}</span>
        <select
          value={id ? String(id) : ''}
          onChange={(e) => onAssignStaff?.(job.id, e.target.value ? Number(e.target.value) : null)}
          disabled={readOnly}
          title={readOnly ? readOnlyHint : undefined}
          className={`min-w-0 w-full bg-transparent text-xs font-semibold truncate cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${name ? 'text-ink-body' : 'text-ink-muted'}`}
        >
          <option value="">Assign tailor</option>
          {staffForBranch(staffList, job.store_branch_id, id).map((s) => {
            const uid = s.user_id ?? s.user?.id;
            return <option key={uid} value={uid}>{staffOptionLabel(s)}</option>;
          })}
        </select>
      </label>
    );
  };

  const gateNotice = (job: JobItem) => {
    if (dpGateJobId === job.id) {
      return (
        <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-2 text-[11px] font-semibold text-rose-700">
          <Lock size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> Downpayment needed before production. Log it in Financials first.
        </p>
      );
    }
    if (balanceGateJobId === job.id) {
      return (
        <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-rose-50 border border-rose-200 px-2.5 py-2 text-[11px] font-semibold text-rose-700">
          <Lock size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> Balance still owed. Collect it before marking claimed.
        </p>
      );
    }
    return null;
  };

  // ── One order card: order no. + due, customer, item, tags, tailor + payment, next step ──
  const renderCard = (job: JobItem) => {
    const due = dueLabel(job);
    const overdue = isOverdue(job);
    const noDp = missingDownpayment(job, repairRequiresDownpayment);
    const measure = needsMeasuring(job);
    const arrivingHere = arriving?.id === job.id && normalizeJobStatus(job.status) === arriving.to;
    const label = job.order_number || `#${job.id}`;
    const payStatus = job.payment_status ?? 'unpaid';
    return (
      <article
        key={job.id}
        id={`job-card-${job.id}`}
        aria-label={`${label}, ${job.customer?.name || 'Walk-in'}`}
        className={`${arrivingHere ? 'kanban-arrive ' : ''}bg-white border rounded-xl px-3 py-2.5 flex flex-col gap-1.5 transition-[border-color,box-shadow] hover:shadow-[0_2px_8px_rgba(45,42,38,0.06)] ${
          highlightedJobId === job.id
            ? 'ring-2 ring-amber-500 ring-offset-2 border-amber-300'
            : overdue ? 'border-rose-200 hover:border-rose-300' : 'border-line hover:border-line-strong'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => openQuickView(job)}
            className="text-xs font-bold text-ink-muted tabular-nums tracking-wide hover:text-ink hover:underline cursor-pointer"
          >
            {label}
          </button>
          {due && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap ${DUE_TONE_CLASS[due.tone]}`}>{due.label}</span>}
        </div>

        <button type="button" onClick={() => openQuickView(job)} className="text-left min-w-0 cursor-pointer group/body">
          <span className="block text-[15px] font-bold text-ink leading-snug truncate group-hover/body:text-taupe-dark">{job.customer?.name || 'Walk-in'}</span>
          <span className="block text-[13px] text-ink-body truncate">{itemLabel(job)}</span>
        </button>

        {(job.is_rush || noDp || measure || (job.status === 'on_hold' && job.hold_reason)) && (
          <div className="flex flex-wrap gap-1">
            {job.is_rush && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-700 text-white">Rush</span>}
            {noDp && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">No downpayment</span>}
            {measure && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-50 text-amber-800">Needs measuring</span>}
            {job.status === 'on_hold' && job.hold_reason && (
              <span className="text-[11px] text-amber-800 flex items-start gap-1 w-full"><Pause size={11} className="mt-0.5 shrink-0" aria-hidden="true" />{job.hold_reason}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 mt-0.5 border-t border-sunken">
          {tailor(job)}
          <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded capitalize shrink-0 ${PAY_CLASS[payStatus] ?? PAY_CLASS.unpaid}`}>{payStatus}</span>
        </div>

        {gateNotice(job)}

        {normalizeJobStatus(job.status) !== 'completed' && (
          <div className="flex items-center gap-1.5 pt-0.5">
            {nextAction(job)}
            {stageMenu(job)}
          </div>
        )}
      </article>
    );
  };

  // Rows in the list view: every visible order, most urgent first.
  const listRows = boardColumns
    .filter((c) => c.id !== 'completed')
    .flatMap((c) => jobsOf(c.id))
    .sort(byUrgency);

  return (
    <>
    {viewMode === 'list' ? (
      <div className="bg-white border border-line rounded-2xl overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-muted bg-canvas">
              <th className="pl-4 pr-3 py-2.5 whitespace-nowrap">Order</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Customer</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Item</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Stage</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Due</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Tailor</th>
              <th className="px-3 py-2.5 whitespace-nowrap">Payment</th>
              <th className="pl-3 pr-4 py-2.5 text-right whitespace-nowrap">Next step</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sunken">
            {listRows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-muted">No orders match.</td></tr>
            )}
            {listRows.map((job) => {
              const due = dueLabel(job);
              const payStatus = job.payment_status ?? 'unpaid';
              const gate = gateNotice(job);
              return (
                <React.Fragment key={job.id}>
                  <tr id={`job-card-${job.id}`} className={`${arriving?.id === job.id ? 'kanban-arrive ' : ''}hover:bg-canvas/50`}>
                    <td className="pl-4 pr-3 py-2 whitespace-nowrap">
                      <button type="button" onClick={() => openQuickView(job)} className="text-xs font-bold text-ink-muted tabular-nums hover:text-ink hover:underline cursor-pointer">
                        {job.order_number || `#${job.id}`}
                      </button>
                    </td>
                    <td className="px-3 py-2 max-w-[200px]">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <button type="button" onClick={() => openQuickView(job)} className="font-bold text-ink truncate text-left hover:text-taupe-dark cursor-pointer">
                          {job.customer?.name || 'Walk-in'}
                        </button>
                        {job.is_rush && <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-700 text-white">Rush</span>}
                      </span>
                    </td>
                    <td className="px-3 py-2 max-w-[180px] truncate text-ink-body">{itemLabel(job)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-md ${(STAGE_STYLE[normalizeJobStatus(job.status)] ?? STAGE_STYLE.completed).chip}`}><span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${(STAGE_STYLE[normalizeJobStatus(job.status)] ?? STAGE_STYLE.completed).dot}`} />{stageTitle(job.status)}</span></td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {due ? <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${DUE_TONE_CLASS[due.tone]}`}>{due.label}</span> : <span className="text-xs text-ink-muted">—</span>}
                    </td>
                    <td className="px-3 py-2 w-[150px] max-w-[150px]">{tailor(job)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><span className={`text-[11px] font-bold px-1.5 py-0.5 rounded capitalize ${PAY_CLASS[payStatus] ?? PAY_CLASS.unpaid}`}>{payStatus}</span></td>
                    <td className="pl-3 pr-4 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {nextAction(job, true)}
                        {stageMenu(job)}
                      </div>
                    </td>
                  </tr>
                  {gate && (
                    <tr><td colSpan={8} className="px-4 pb-2.5 pt-0">{gate}</td></tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    ) : (
      <div
        ref={boardRef}
        // Columns keep a readable width; the board scrolls sideways instead of
        // squeezing every stage into the screen. The mouse wheel scrolls it
        // sideways too (useWheelToHorizontal).
        className="flex gap-3 overflow-x-auto pb-4 items-start select-none overscroll-x-contain"
        style={{ minHeight: 'calc(100vh - 330px)' }}
      >
        {boardColumns.map(col => {
          const colJobs = jobsOf(col.id);
          const isCompleted = col.id === 'completed';
          const folded = isCompleted && !showCompleted;
          const overdueCount = colJobs.filter(isOverdue).length;
          const grouped = col.id !== 'on_hold' && !isCompleted;
          const sorted = isCompleted
            ? [...colJobs].sort((a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime())
            : [...colJobs].sort(byUrgency);
          const groups = grouped
            ? DUE_GROUPS.map((g) => ({ ...g, jobs: sorted.filter((j) => g.test(dueDays(j))) })).filter((g) => g.jobs.length > 0)
            : [{ key: 'all', label: '', tone: '', jobs: sorted }];
          return (
            <section
              key={col.id}
              id={`kanban-col-${col.id}`}
              aria-label={col.title}
              className={`border border-t-[3px] ${(STAGE_STYLE[col.id] ?? STAGE_STYLE.completed).accent} rounded-2xl p-2.5 flex flex-col gap-2 shrink-0 transition-[border-color,box-shadow,background-color] duration-200 ease-out ${
                folded ? 'w-[190px]' : viewMode === 'columns' ? 'w-[260px]' : 'w-[288px]'
              } ${
                targetColumn === col.id
                  ? 'border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-500/70 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  : 'border-x-line/70 border-b-line/70 bg-[#f6f2ee]'
              }`}
              data-move-target={targetColumn === col.id ? 'true' : undefined}
              style={{ maxHeight: 'calc(100vh - 330px)' }}
            >
              <div className="px-2 pt-1.5 pb-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-ink text-sm tracking-tight flex items-center gap-2"><span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full shrink-0 ${(STAGE_STYLE[col.id] ?? STAGE_STYLE.completed).dot}`} />{col.title}</h3>
                  <span className="h-6 min-w-6 px-2 rounded-full bg-white border border-line text-xs font-bold text-ink flex items-center justify-center tabular-nums">
                    {colJobs.length}
                  </span>
                </div>
                {overdueCount > 0 && <p className="text-xs font-semibold text-rose-700 mt-0.5">{overdueCount} overdue</p>}
              </div>

              {folded ? (
                <div className="px-2 pb-1 space-y-2">
                  <p className="text-xs text-ink-muted leading-relaxed">Folded so the board shows work still to do.</p>
                  <button
                    type="button"
                    onClick={() => setShowCompleted(true)}
                    className="w-full h-9 rounded-lg border border-line-strong bg-surface text-xs font-bold text-ink hover:bg-sunken cursor-pointer"
                  >
                    Show completed
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 overflow-y-auto flex-1 hide-scrollbar">
                  {colJobs.length === 0 && (
                    <p className="border border-dashed border-line-strong rounded-xl py-10 px-3 text-center text-xs text-ink-muted">No orders in this stage</p>
                  )}
                  {groups.map((g) => (
                    <React.Fragment key={g.key}>
                      {g.label && (
                        <p className={`px-2 pt-2 pb-0.5 text-[11px] font-bold uppercase tracking-wider ${g.tone}`}>
                          {g.label} · {g.jobs.length}
                        </p>
                      )}
                      {g.jobs.map(renderCard)}
                    </React.Fragment>
                  ))}
                  {isCompleted && (
                    <button type="button" onClick={() => setShowCompleted(false)} className="py-2 text-xs font-semibold text-taupe-dark hover:underline cursor-pointer">
                      Fold completed
                    </button>
                  )}
                </div>
              )}
            </section>
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
