'use client';

import React from 'react';
import Link from 'next/link';
import type { Job } from '../jobHelpers';
import { needsShop, nextTask, stageNote } from '../jobStage';
import { flowChip } from '../kanban/flowChip';
import { jobPieces } from '@/lib/orderSize';
import { BTN, BTN_PRIMARY } from '@/components/shared/plainForm';
import CardFacts from './CardFacts';
import { isReadyCard, readyAction } from './readyAction';

interface BoardCardProps {
  readonly job: Job;
  /** Place in line within its stage: 1 = came first. */
  readonly rank: number | null;
  readonly canSeeMoney: boolean;
  readonly canDecline: boolean;
  readonly busy: boolean;
  readonly onAdvance: (job: Job) => void;
  /** A one-tap status move from a card (Start fitting, Complete). */
  readonly onMove?: (job: Job, status: string, message: string) => void;
  readonly onDecline: (jobId: number) => void;
}

/** One order: who, what, what it is waiting on, when it is due, what is owed, and the next step as one tap. */
export default function BoardCard({ job, rank, canSeeMoney, canDecline, busy, onAdvance, onMove, onDecline }: BoardCardProps) {
  const next = nextTask(job);
  const ready = isReadyCard(job) ? readyAction(job, canSeeMoney) : null;
  const attention = needsShop(job);
  const item = job.catalog_item?.name ?? job.service?.name ?? 'Tailoring Order';
  const waiting = flowChip(job)?.label ?? stageNote(job);

  return (
    <li className="rounded-xl border border-line bg-surface shadow-2xs transition-shadow hover:shadow-[0_4px_12px_rgba(43,30,26,0.08)]">
      <Link href={`/dashboard/jobs/${job.id}`} className="block space-y-2 p-4">
        <div className="flex items-center justify-between gap-2 text-[13px] text-ink-muted">
          <span>{job.order_number ?? `ORD-${job.id}`}{rank !== null && ` · #${rank}`}</span>
          <span className="flex items-center gap-2">
            {job.batch_no && job.batch_no > 0 && <span className="rounded-full bg-taupe/10 px-2 text-[11px] font-medium text-taupe">{job.group_kind === 'set' ? 'Order' : 'Batch'} {job.batch_no}</span>}
            {job.is_rush && <span className="font-medium text-danger">Rush</span>}
          </span>
        </div>
        <p className="flex items-center gap-1.5 text-[17px] font-semibold leading-snug text-ink">
          <span className="truncate">{job.customer?.name ?? 'Walk-in Customer'}</span>
          {job.customer?.suki_tag && <span className="shrink-0 rounded-full bg-espresso/[0.06] px-1.5 text-[11px] font-medium text-ink-muted">Suki</span>}
        </p>
        <p className="line-clamp-2 text-[13px] text-ink-body">{item}{jobPieces(job) > 1 ? ` · ${jobPieces(job)} pcs` : ''}</p>
        <p className={`inline-flex h-6 max-w-full items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ${attention ? 'bg-amber-500/10 text-amber-700' : 'bg-espresso/[0.06] text-ink-body'}`}>
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${attention ? 'bg-amber-500' : 'bg-espresso/30'}`} />
          <span className="truncate">{waiting}</span>
        </p>
        <CardFacts job={job} canSeeMoney={canSeeMoney} />
      </Link>
      {(next || ready || (canDecline && job.status === 'pending')) && (
        <div className="flex gap-2 px-4 pb-4">
          {next && (
            <button type="button" disabled={busy} onClick={() => onAdvance(job)} className={`${BTN_PRIMARY} min-w-0 flex-1`}>
              <span className="truncate">{busy ? 'Moving…' : `Next: ${next.label}`}</span>
            </button>
          )}
          {ready?.kind === 'move' && (
            <button type="button" disabled={busy} onClick={() => onMove?.(job, ready.status, ready.message)} className={`${BTN_PRIMARY} min-w-0 flex-1`}>
              <span className="truncate">{busy ? 'Moving…' : ready.label}</span>
            </button>
          )}
          {ready?.kind === 'link' && <Link href={ready.href} className={`${BTN_PRIMARY} min-w-0 flex-1`}><span className="truncate">{ready.label}</span></Link>}
          {canDecline && job.status === 'pending' && (
            <button type="button" disabled={busy} onClick={() => onDecline(job.id)} className={`${BTN} flex-1 hover:text-danger`}>
              Decline
            </button>
          )}
        </div>
      )}
    </li>
  );
}
