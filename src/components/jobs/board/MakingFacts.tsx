import React from 'react';
import { getDueStatus, type Job } from '../jobHelpers';
import { lineView, STEP_LABEL } from '../productionLine';
import { shopStageOf } from '../jobStage';

const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

/** True for a card in the Being made column. */
export const isMakingCard = (job: Job) => shopStageOf(job) === 'making';

/** The tailor who has the order: the lead, else the first planned. */
function tailorName(job: Job): string | null {
  const list = job.assignees ?? [];
  return (list.find((a) => a.role === 'lead') ?? list[0])?.user?.name ?? null;
}

/** The Being made card's facts: "Sewing · step 3 of 4 · Tailor: Ana · Due Oct 26" (the due date is red when overdue; the balance is for owner / manager). */
export default function MakingFacts({ job, canSeeMoney }: Readonly<{ job: Job; canSeeMoney: boolean }>) {
  const held = job.status === 'on_hold';
  const at = held ? { ...job, status: job.status_before_hold ?? '' } : job;
  const v = lineView(at);
  const label = v.index !== null ? `${v.steps[v.index].label} · step ${v.index + 1} of ${v.steps.length}` : (STEP_LABEL[at.status] ?? null);
  const late = getDueStatus(job.due_date, job.status)?.label === 'Overdue';
  const tailor = tailorName(job);
  const balance = Number.parseFloat(String(job.balance)) || 0;
  const parts = [
    label ? { text: held ? `Held at ${label}` : label, bad: false } : null,
    tailor ? { text: `Tailor: ${tailor}`, bad: false } : null,
    job.due_date ? { text: `Due ${day(job.due_date)}`, bad: late } : null,
    canSeeMoney ? { text: balance > 0 ? `₱${balance.toLocaleString()} due` : 'Paid', bad: false } : null,
  ].filter((f): f is { text: string; bad: boolean } => f !== null);

  return (
    <p className="border-t border-line pt-3 text-[13px] text-ink-muted">
      {parts.map((f, i) => (
        <React.Fragment key={f.text}>
          {i > 0 && ' · '}
          <span className={f.bad ? 'font-medium text-danger' : undefined}>{f.text}</span>
        </React.Fragment>
      ))}
    </p>
  );
}
