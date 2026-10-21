import React from 'react';
import { SHOP_STAGES, shopStageOf, stageNote } from '../jobStage';
import type { Job } from '../jobHelpers';

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : null);

/** Where the order is, in the same five stages the customer sees, plus what it is waiting for. */
export default function StepsHeader({ job }: Readonly<{ job: Job }>) {
  const stage = shopStageOf(job);
  const index = SHOP_STAGES.findIndex((s) => s.key === stage);
  const received = day(job.created_at);

  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-4">
      <ol className="grid grid-cols-5 gap-1" aria-label="Order stage">
        {SHOP_STAGES.map((s, i) => (
          <li key={s.key} className="text-center" aria-current={i === index ? 'step' : undefined}>
            <span className={`block h-1.5 rounded-full ${index < 0 ? 'bg-line' : i <= index ? (i === index ? 'bg-espresso' : 'bg-sage') : 'bg-line'}`} />
            <span className={`mt-1.5 block text-[11px] leading-tight ${i === index ? 'font-bold text-ink' : 'text-ink-muted'}`}>{s.label}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-base font-bold text-ink">{stageNote(job)}</p>
      {received && <p className="mt-0.5 text-xs text-ink-muted">Received {received}</p>}
    </div>
  );
}
