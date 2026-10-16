import Link from 'next/link';
import { Flame } from 'lucide-react';
import { getDueStatus, type Job } from '../jobHelpers';
import { needsShop, nextTask, stageNote } from '../jobStage';

interface BoardCardProps {
  readonly job: Job;
  /** Place in line within its stage: 1 = came first. */
  readonly rank: number | null;
  readonly canSeeMoney: boolean;
  readonly canDecline: boolean;
  readonly busy: boolean;
  readonly onAdvance: (job: Job, status: string) => void;
  readonly onDecline: (jobId: number) => void;
}

const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '');

/** One order. Flat: who, what, when it came in, what it is waiting for. */
export default function BoardCard({ job, rank, canSeeMoney, canDecline, busy, onAdvance, onDecline }: BoardCardProps) {
  const due = getDueStatus(job.due_date, job.status);
  const next = nextTask(job);
  const attention = needsShop(job);
  const item = job.catalog_item?.name ?? job.service?.name ?? 'Order';
  const balance = Number.parseFloat(String(job.balance)) || 0;

  return (
    <li className="rounded-xl border border-line bg-surface p-3">
      <Link href={`/dashboard/jobs/${job.id}`} className="block">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            {rank !== null && <span title={rank === 1 ? 'Came in first' : `Number ${rank} in line`} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sunken px-1 text-[11px] font-bold text-ink">{rank}</span>}
            {job.order_number}
          </span>
          {job.is_rush && <Flame size={14} className="text-danger" aria-label="Rush order" />}
        </div>
        <p className="mt-1.5 truncate text-sm font-bold text-ink">{job.customer?.name ?? 'Customer'}</p>
        <p className="truncate text-xs text-ink-body">{item}{(job.quantity ?? 1) > 1 ? ` × ${job.quantity}` : ''}</p>
        <p className={`mt-2 text-xs font-semibold ${attention ? 'text-amber-700' : 'text-ink-body'}`}>{stageNote(job)}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-ink-muted">
          <span>Received {day(job.created_at)}</span>
          {job.due_date && <span className={due ? 'font-semibold text-danger' : ''}>Due {day(job.due_date)}{due ? ` · ${due.label}` : ''}</span>}
          {canSeeMoney && balance > 0 && <span>₱{balance.toLocaleString()} left</span>}
        </p>
      </Link>

      {(next || (canDecline && job.status === 'pending')) && (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-line pt-2">
          {next ? (
            <button type="button" disabled={busy} onClick={() => onAdvance(job, next.status)} className="h-9 rounded-lg bg-taupe px-3 text-xs font-bold text-white hover:bg-taupe-hover disabled:opacity-50">
              {busy ? 'Moving…' : `Next: ${next.label}`}
            </button>
          ) : <span />}
          {canDecline && job.status === 'pending' && (
            <button type="button" disabled={busy} onClick={() => onDecline(job.id)} className="h-9 px-2 text-xs font-medium text-ink-muted hover:text-danger">Decline</button>
          )}
        </div>
      )}
    </li>
  );
}
