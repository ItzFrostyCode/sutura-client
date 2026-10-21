'use client';

import React from 'react';
import Link from 'next/link';
import { getDueStatus, type Job } from '../jobHelpers';
import { needsShop, nextTask, stageNote } from '../jobStage';
import { flowChip } from '../kanban/flowChip';
import { jobPieces } from '@/lib/orderSize';

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

const day = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

/** One order: who, what, what it is waiting on, when it is due, what is owed, and the next step as one tap. */
export default function BoardCard({ job, rank, canSeeMoney, canDecline, busy, onAdvance, onDecline }: BoardCardProps) {
  const due = getDueStatus(job.due_date, job.status);
  const next = nextTask(job);
  const attention = needsShop(job);
  const item = job.catalog_item?.name ?? job.service?.name ?? 'Tailoring Order';
  const balance = Number.parseFloat(String(job.balance)) || 0;
  const waiting = flowChip(job)?.label ?? stageNote(job);
  const late = due?.label === 'Overdue';
  const released = !!job.released_with_balance_at && balance > 0.005;
  const payLate = released && !!job.balance_due_by && new Date(job.balance_due_by) < new Date(new Date().toDateString());

  return (
    <li className="rounded-xl border border-espresso/[0.08] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <Link href={`/dashboard/jobs/${job.id}`} className="block space-y-1.5 p-3.5">
        <div className="flex items-center justify-between gap-2 text-[13px] text-ink-muted">
          <span>{job.order_number ?? `ORD-${job.id}`}{rank !== null && ` · #${rank}`}</span>
          <span className="flex items-center gap-2">
            {job.batch_no && job.batch_no > 0 && <span className="rounded-full bg-taupe/10 px-2 text-[11px] font-medium text-taupe">{job.group_kind === 'set' ? 'Order' : 'Batch'} {job.batch_no}</span>}
            {job.is_rush && <span className="font-medium text-danger">Rush</span>}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[15px] font-semibold leading-snug text-ink">
          <span className="truncate">{job.customer?.name ?? 'Walk-in Customer'}</span>
          {job.customer?.suki_tag && <span className="shrink-0 rounded-full bg-espresso/[0.06] px-1.5 text-[11px] font-medium text-ink-muted">Suki</span>}
        </p>
        <p className="truncate text-[13px] text-ink-body">{item}{jobPieces(job) > 1 ? ` · ${jobPieces(job)} pcs` : ''}</p>
        <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${attention ? 'bg-amber-500' : 'bg-espresso/20'}`} />
          <span className="truncate">{waiting}</span>
        </p>
        <div className="flex items-center justify-between gap-2 border-t border-espresso/[0.06] pt-2 text-[13px]">
          <span className={late ? 'font-medium text-danger' : 'text-ink-muted'}>{job.due_date ? `Due ${day(job.due_date)}` : `Received ${day(job.created_at)}`}</span>
          {canSeeMoney && <span className={payLate ? 'font-medium text-danger' : balance > 0 ? 'font-medium text-ink' : 'text-sage'}>{released ? `Picked up · ₱${balance.toLocaleString()} due${job.balance_due_by ? ` by ${day(job.balance_due_by)}` : ''}` : balance > 0 ? `₱${balance.toLocaleString()} due` : 'Paid'}</span>}
        </div>
      </Link>
      {(next || (canDecline && job.status === 'pending')) && (
        <div className="flex items-center gap-2 border-t border-espresso/[0.06] p-2">
          {next && (
            <button type="button" disabled={busy} onClick={() => onAdvance(job, next.status)} className="h-10 flex-1 cursor-pointer rounded-lg bg-taupe/10 text-sm font-semibold text-taupe hover:bg-taupe/15 disabled:opacity-50">
              {busy ? 'Moving…' : `Next: ${next.label}`}
            </button>
          )}
          {canDecline && job.status === 'pending' && (
            <button type="button" disabled={busy} onClick={() => onDecline(job.id)} className="h-10 cursor-pointer rounded-lg px-3 text-sm font-medium text-ink-muted hover:bg-espresso/[0.05] hover:text-danger">
              Decline
            </button>
          )}
        </div>
      )}
    </li>
  );
}
