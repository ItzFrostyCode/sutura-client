import React from 'react';
import { SHOP_STAGES, shopStageOf, stageNote } from '../jobStage';
import { getDueStatus, type Job } from '../jobHelpers';

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : null);

/** Where the order is, in the same five stages the customer sees, plus what it is waiting for. */
export default function StepsHeader({ job }: Readonly<{ job: Job }>) {
  const stage = shopStageOf(job);
  const index = SHOP_STAGES.findIndex((s) => s.key === stage);
  const received = day(job.created_at);
  const due = day(job.due_date);
  const dueLabel = job.due_date && stage !== 'done' ? getDueStatus(job.due_date, job.status)?.label : undefined;
  const dueTone = dueLabel === 'Overdue' ? 'bg-rose-500/10 text-rose-700' : dueLabel === 'Due Soon' ? 'bg-amber-500/10 text-amber-700' : 'bg-espresso/[0.06] text-ink-body';

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-2xs">
      <ol className="grid grid-cols-5 gap-2" aria-label="Order stage">
        {SHOP_STAGES.map((s, i) => (
          <li key={s.key} className="text-center" aria-current={i === index ? 'step' : undefined}>
            <span className={`block h-1.5 rounded-full ${index < 0 ? 'bg-espresso/[0.08]' : i < index ? 'bg-sage' : i === index ? 'bg-espresso' : 'bg-espresso/[0.08]'}`} />
            <span className={`mt-2 block text-[13px] leading-tight ${i === index ? 'font-semibold text-ink' : 'text-ink-muted'}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line pt-4">
        <div className="sm:flex sm:items-baseline sm:gap-3">
          <p className="text-[17px] font-semibold text-ink">{stageNote(job)}</p>
          {received && <p className="text-[13px] text-ink-muted">Received {received}</p>}
        </div>
        {due && stage !== 'done' && <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${dueTone}`}>Due {due}</span>}
      </div>
    </div>
  );
}
