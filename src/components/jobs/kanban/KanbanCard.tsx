import React from 'react';
import Link from 'next/link';
import { Check, Loader2, Lock, Pause, ShoppingBag, Store, X, Zap } from 'lucide-react';
import { getDueStatus, type Job } from '../jobHelpers';
import CardMoveMenu from './CardMoveMenu';
import { flowChip } from './flowChip';

type Handlers = React.HTMLAttributes<HTMLElement>;

interface KanbanCardProps {
  readonly job: Job;
  /** The card left behind while its copy is being dragged. */
  readonly ghost?: boolean;
  /** The floating copy that follows the pointer. */
  readonly preview?: boolean;
  readonly handlers?: Handlers;
  readonly canReject?: boolean;
  readonly loading?: boolean;
  /** In a production stage with no money in yet. */
  readonly dpLocked?: boolean;
  readonly highlighted?: boolean;
  readonly onApprove?: (id: number) => void;
  readonly onReject?: (id: number) => void;
  readonly onMove?: (job: Job, status: string) => void;
}

function stateClasses(job: Job, ghost: boolean, preview: boolean, highlighted: boolean) {
  if (preview) return 'pointer-events-none rotate-3 scale-[1.03] border-taupe shadow-[0_20px_40px_-4px_rgba(45,42,38,0.3),0_10px_20px_-2px_rgba(45,42,38,0.18)]';
  if (ghost) return 'cursor-grab border-dashed border-line bg-sunken opacity-30 grayscale';
  const border = job.status === 'on_hold' ? 'border-amber-300' : job.status === 'pending' ? 'border-amber-200' : 'border-line';
  const ring = highlighted ? ' ring-2 ring-amber-500 ring-offset-2' : '';
  return `${border}${ring} cursor-grab shadow-2xs hover:-translate-y-px hover:border-taupe hover:shadow-xs active:cursor-grabbing`;
}

export default function KanbanCard({
  job, ghost = false, preview = false, handlers, canReject = false, loading = false,
  dpLocked = false, highlighted = false, onApprove, onReject, onMove,
}: KanbanCardProps) {
  const due = getDueStatus(job.due_date, job.status);
  const balance = Number.parseFloat(String(job.balance ?? '0')) || 0;
  const chip = flowChip(job);
  const legacyPending = job.status === 'pending' && !job.uses_confirmation_flow;
  const service = job.service_package?.name ?? job.service?.name ?? job.catalog_item?.name ?? 'Bespoke garment';
  const suki = job.customer?.suki_tag;

  return (
    <div
      data-kanban-card
      data-job-id={job.id}
      data-dragging={ghost ? 'true' : undefined}
      {...handlers}
      className={`relative box-border flex touch-pan-y select-none flex-col gap-1 rounded-lg border bg-surface px-2.5 py-2 transition-[transform,box-shadow,border-color] duration-150 ${stateClasses(job, ghost, preview, highlighted)}`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link href={`/dashboard/jobs/${job.id}`} className="shrink-0 text-[13px] font-bold leading-none text-ink hover:underline">
            {job.order_number || `#${job.id}`}
          </Link>
          {job.tracking_code && (
            <span className="min-w-0 truncate rounded bg-sunken px-1 font-mono text-[10px] leading-snug text-ink-muted">{job.tracking_code}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span
            title={job.intake_channel === 'online' ? 'Online order' : 'Walk-in order'}
            className={`flex h-5 w-5 items-center justify-center rounded ${job.intake_channel === 'online' ? 'bg-blue-100 text-blue-700' : 'bg-sunken text-ink-muted'}`}
          >
            {job.intake_channel === 'online' ? <ShoppingBag size={11} /> : <Store size={11} />}
          </span>
          {job.is_rush && (
            <span className="inline-flex items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-1 text-[9px] font-bold text-amber-800">
              <Zap size={9} />RUSH
            </span>
          )}
          {!preview && onMove && <CardMoveMenu job={job} onMove={onMove} />}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-semibold text-ink">{job.customer?.name || 'Walk-in'}</span>
          {suki && suki !== 'walk_in_retail' && (
            <span className="rounded bg-amber-50 px-1 text-[9px] font-bold uppercase text-amber-800">{suki === 'b2b_suki' ? 'B2B' : 'Reseller'}</span>
          )}
        </div>
        <span className="truncate text-[11px] font-medium leading-snug text-ink-body">
          {service}{(job.quantity ?? 1) > 1 ? ` ×${job.quantity}` : ''}
        </span>
      </div>

      {job.status === 'on_hold' && job.hold_reason && (
        <p className="flex items-start gap-1 rounded bg-amber-50 px-1.5 py-1 text-[10px] leading-snug text-amber-700">
          <Pause size={10} className="mt-0.5 shrink-0" />{job.hold_reason}
        </p>
      )}

      {chip && <span className={`w-fit rounded border px-1.5 py-0.5 text-[10px] font-bold ${chip.cls}`}>{chip.label}</span>}

      <div className="mt-0.5 flex items-center justify-between gap-1.5 border-t border-dashed border-line pt-1 text-[10px]">
        <div className="flex min-w-0 items-center gap-1 text-ink-muted">
          <span className="truncate">Due: {job.due_date ? new Date(job.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</span>
          {due && <span className={`rounded border px-1 text-[9px] font-bold uppercase ${due.className}`}>{due.label}</span>}
          {dpLocked && <span title="No downpayment on record" className="inline-flex items-center gap-0.5 rounded border border-amber-200 bg-amber-50 px-1 text-[9px] font-bold text-amber-800"><Lock size={8} />DP</span>}
        </div>
        <span className={`shrink-0 text-[11px] font-bold ${balance > 0 ? 'text-taupe-dark' : 'text-emerald-700'}`}>
          {balance > 0 ? `₱${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : 'Settled'}
        </span>
      </div>

      {legacyPending && !preview && !ghost && (
        <div className="flex items-center gap-1.5 border-t border-amber-100 pt-1.5">
          {loading ? (
            <div className="flex flex-1 justify-center"><Loader2 size={13} className="animate-spin text-amber-500" /></div>
          ) : (
            <>
              <button type="button" onClick={() => onApprove?.(job.id)} className="flex flex-1 items-center justify-center gap-1 rounded-md bg-emerald-700 py-1 text-[11px] font-bold text-white hover:bg-emerald-800">
                <Check size={11} />Approve
              </button>
              {canReject && (
                <button type="button" onClick={() => onReject?.(job.id)} className="flex items-center justify-center gap-1 rounded-md border border-rose-300 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50">
                  <X size={11} />Reject
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
