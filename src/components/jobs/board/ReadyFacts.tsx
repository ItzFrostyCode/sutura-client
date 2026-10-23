import React from 'react';
import { getDueStatus, type Job } from '../jobHelpers';
import { handoverTotal } from './readyAction';

const num = (v: unknown) => Number.parseFloat(String(v ?? '0')) || 0;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
const FITTING = { required: 'Fitting required', optional: 'Fitting optional' } as const;

/** The Ready card's facts: "Ready since Oct 22 · Fitting required · Balance ₱250 · 0 of 20 handed over · Due Oct 26" (the balance is for owner / manager). */
export default function ReadyFacts({ job, canSeeMoney }: Readonly<{ job: Job; canSeeMoney: boolean }>) {
  const balance = num(job.balance);
  const since = job.ready_for_pickup_at ?? job.qc_passed_at;
  const fitting = job.fitting_requirement && job.fitting_requirement !== 'none' ? FITTING[job.fitting_requirement] : null;
  const late = getDueStatus(job.due_date, job.status)?.label === 'Overdue';
  const payLate = Boolean(job.released_with_balance_at) && balance > 0.005 && !!job.balance_due_by && new Date(job.balance_due_by) < new Date(new Date().toDateString());
  const facts = [
    since ? { text: `Ready since ${day(since)}`, bad: false } : null,
    fitting ? { text: fitting, bad: false } : null,
    canSeeMoney && balance > 0.005 ? { text: `Balance ₱${balance.toLocaleString()}${payLate ? ' (past due)' : ''}`, bad: payLate } : null,
    { text: `${num(job.handed_over_count)} of ${handoverTotal(job)} handed over`, bad: false },
    job.due_date ? { text: `Due ${day(job.due_date)}`, bad: late } : null,
  ].filter((f): f is { text: string; bad: boolean } => f !== null);

  return (
    <p className="border-t border-line pt-3 text-[13px] text-ink-muted">
      {facts.map((f, i) => (
        <React.Fragment key={f.text}>
          {i > 0 && ' · '}
          <span className={f.bad ? 'font-medium text-danger' : undefined}>{f.text}</span>
        </React.Fragment>
      ))}
    </p>
  );
}
