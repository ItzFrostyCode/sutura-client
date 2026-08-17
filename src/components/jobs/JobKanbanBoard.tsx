import React, { useState } from 'react';
import Link from 'next/link';
import { User, Calendar, Scissors, Check, X, Loader2, AlertTriangle, Lock, Pause, Star, Store, Eye, type LucideIcon } from 'lucide-react';
import { Job as JobItem, columnsForJobs, getDueStatus, TypeBadge, ColumnIcon, STAGES_REQUIRING_DOWNPAYMENT, ON_HOLD_COLUMN } from './jobHelpers';
import CancellationReasonModal from './CancellationReasonModal';
import HoldReasonModal from './HoldReasonModal';

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
}: JobKanbanBoardProps) {
  // DP gate: tracks which job card just triggered the block (shows flash warning)
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

  const handleStatusChange = (job: JobItem, newStatus: string) => {
    // Derived downpayment = total_amount minus current balance.
    // Policy is 50% down, not just "something" — a ₱1 payment on a ₱10,000
    // job shouldn't be enough to unlock production.
    const total = Number.parseFloat(String(job.total_amount ?? '0'));
    const balance = Number.parseFloat(String(job.balance ?? '0'));
    const paidSoFar = total - balance;
    const noDownpayment = total > 0 && paidSoFar < total * 0.5;

    if (STAGES_REQUIRING_DOWNPAYMENT.has(newStatus) && noDownpayment) {
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
    onUpdateStatus(job.id, newStatus);
  };

  // Approving a pending job moves it into 'design' — the first pipeline
  // stage, exempt from the DP gate (no fabric/material is committed yet).
  // No downpayment pre-check needed here anymore; the gate only kicks in
  // once the job actually tries to enter a production stage.
  const handleApprove = (job: JobItem) => {
    onApprove(job.id);
  };
  // Shown first, ahead of the sequential production stages, so a held job
  // isn't buried — kept out of `activeColumns` itself (see ON_HOLD_COLUMN)
  // so the "A → B → C" flow banner elsewhere on the page stays accurate.
  const baseColumns = onHoldJobs.length > 0 ? [ON_HOLD_COLUMN, ...activeColumns] : activeColumns;
  const boardColumns = stageFilter && stageFilter !== 'all'
    ? baseColumns.filter(c => c.id === stageFilter)
    : baseColumns;

  return (
    <>
    <div className="flex gap-3.5 overflow-x-auto pb-4 items-start" style={{ minHeight: 'calc(100vh - 270px)' }}>
      {boardColumns.map(col => {
        const colJobs = col.id === 'on_hold' ? onHoldJobs : (groupedJobs[col.id] ?? []);
        const isCollapsible = col.id === 'completed' && colJobs.length > COMPLETED_COLLAPSE_AT;
        const isExpanded = expandedColumns[col.id] ?? false;
        const visibleJobs = isCollapsible && !isExpanded ? colJobs.slice(0, COMPLETED_COLLAPSE_AT) : colJobs;
        return (
        <div
          key={col.id}
          id={`kanban-col-${col.id}`}
          className="flex-none w-72 sm:w-[300px] bg-canvas/30 border border-line rounded-2xl flex flex-col shadow-2xs overflow-hidden"
          style={{ maxHeight: 'calc(100vh - 270px)' }}
        >
          {/* Column Header */}
          <div className="px-3.5 py-2.5 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <ColumnIcon id={col.id} />
              <h3 className="font-bold text-ink text-xs sm:text-sm">{col.title}</h3>
            </div>
            <span className="bg-sunken text-ink text-[11px] px-2 py-0.5 rounded-full font-black tabular-nums border border-line/60">
              {colJobs.length}
            </span>
          </div>

          {/* Cards */}
          <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1 hide-scrollbar">
            {visibleJobs.map(job => (
              <div key={job.id} id={`job-card-${job.id}`}>
                <div className={`bg-white border p-3.5 rounded-xl transition-all group relative ${
                  highlightedJobId === job.id
                    ? 'ring-2 ring-amber-500 ring-offset-2 scale-[1.02] shadow-md bg-amber-50/40 duration-300'
                    : job.status === 'pending'
                    ? 'border-amber-200 hover:border-amber-300'
                    : job.status === 'on_hold'
                    ? 'border-amber-300 hover:border-amber-400'
                    : 'border-line-strong hover:border-taupe/50'
                }`}>
                  <div className="flex justify-between items-start mb-2 gap-1.5">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap min-w-0">
                      <Link href={`/dashboard/jobs/${job.id}`} className="text-xs font-bold text-ink hover:underline truncate">
                        {job.order_number || `#${job.id}`}
                      </Link>
                      <TypeBadge type={job.intake_channel} />
                    </div>

                    {/* Header Actions: View button + Stage changer/Pending badge */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        title={`View ${job.order_number || 'Job Details'}`}
                        className="h-6 w-6 rounded-md bg-canvas hover:bg-surface text-ink-muted hover:text-ink border border-line flex items-center justify-center transition-colors shadow-2xs active:scale-95"
                      >
                        <Eye size={12} />
                      </Link>

                      {job.status === 'pending' ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 shrink-0 flex items-center gap-1">
                          <AlertTriangle size={9} className="text-amber-700" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job, e.target.value)}
                          title="Change stage"
                          className="text-[10px] font-bold bg-canvas text-ink-body border border-line rounded-md px-1.5 py-0.5 hover:border-taupe/70 focus:border-taupe transition-colors focus:outline-none cursor-pointer shrink-0"
                        >
                          {columnsForJobs([job]).map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                          <option value="on_hold">On Hold</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {job.status === 'on_hold' && job.hold_reason && (
                    <div className="mb-2 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                      <Pause size={11} className="text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-amber-700 leading-snug">{job.hold_reason}</p>
                    </div>
                  )}

                  <Link href={`/dashboard/jobs/${job.id}`} className="block space-y-1.5">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="min-w-0">
                        <h4 className="font-bold text-ink text-sm truncate">{job.customer?.name || 'Walk-in'}</h4>
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
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${payBadge}`}>
                            {job.payment_status}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Scissors size={11} />
                      <span className="truncate">{job.service?.name || 'Custom Sew'}</span>
                    </div>

                    {Number.parseFloat(job.balance as string || '0') > 0 && (
                      <div className="text-[10px] font-bold text-rose-600 mt-1">
                        Bal: ₱{Number.parseFloat(job.balance as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </Link>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-line">
                    <div className="flex items-center gap-1 text-xs text-ink-faint">
                      <User size={11} />
                      <span className="truncate max-w-[100px]">{job.assigned_staff?.name || 'Unassigned'}</span>
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
                  {STAGES_REQUIRING_DOWNPAYMENT.has(job.status) && job.payment_status === 'unpaid' && dpGateJobId !== job.id && (
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
                  {job.status === 'pending' && (
                    <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center gap-2">
                      {actionLoadingId === job.id ? (
                        <div className="flex-1 flex justify-center"><Loader2 size={14} className="animate-spin text-amber-500" /></div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); handleApprove(job); }}
                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors"
                          >
                            <Check size={13} /> <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={e => { e.preventDefault(); e.stopPropagation(); onReject(job.id); }}
                            className="flex-none flex items-center justify-center gap-1 text-xs font-semibold py-2 px-3 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <X size={13} /> <span>Reject</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
            ))}

            {isCollapsible && (
              <button
                type="button"
                onClick={() => setExpandedColumns(prev => ({ ...prev, [col.id]: !isExpanded }))}
                className="w-full text-center py-2 text-xs font-semibold text-taupe hover:underline"
              >
                {isExpanded ? 'Show less' : `Show all ${colJobs.length} completed`}
              </button>
            )}

            {colJobs.length === 0 && (
              <div className="text-center py-6 text-ink-faint border border-dashed border-line/80 rounded-xl bg-surface/40 flex flex-col items-center justify-center">
                <span className="text-[11px] font-medium">No orders in this stage</span>
              </div>
            )}
          </div>
        </div>
        );
      })}
    </div>

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
    </>
  );
}
