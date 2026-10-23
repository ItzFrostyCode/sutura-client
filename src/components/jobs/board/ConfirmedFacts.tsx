import React from 'react';
import { getDueStatus, isRepairOnly, type Job } from '../jobHelpers';
import { startBy } from '../startBy';

const num = (v: unknown) => Number.parseFloat(String(v ?? '0')) || 0;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

/** True for an order waiting in the Confirmed column that goes through the ordering flow (repairs skip these checks). */
export function isConfirmedCard(job: Job): boolean {
  return Boolean(job.uses_confirmation_flow) && ['confirmed', 'awaiting_materials'].includes(job.status) && !isRepairOnly(job);
}

/** Materials are ready: marked by the shop, and the customer's own fabric (if any) judged suitable. Same rule as OrderReadiness::materialsReady. */
const materialsReady = (job: Job) => Boolean(job.materials_verified_at) && (job.material_source !== 'customer_supplied' || job.customer_items_assessment === 'suitable');

/** The Confirmed card's facts line ("Deposit ₱X paid · Due Oct 26 · Start by Oct 23", money for owner / manager only) and its two checks. */
export default function ConfirmedFacts({ job, canSeeMoney }: Readonly<{ job: Job; canSeeMoney: boolean }>) {
  const paid = num(job.total_amount) - num(job.balance) - num(job.discount_amount);
  const late = getDueStatus(job.due_date, job.status)?.label === 'Overdue';
  const by = startBy(job);
  const ready = materialsReady(job);
  const tailor = (job.assignees_count ?? 0) > 0;
  const facts = [
    canSeeMoney && paid > 0.005 ? { text: `Deposit ₱${paid.toLocaleString()} paid`, bad: false } : null,
    job.due_date ? { text: `Due ${day(job.due_date)}`, bad: late } : null,
    by ? { text: `Start by ${by.label}`, bad: by.late } : null,
  ].filter((f): f is { text: string; bad: boolean } => f !== null);

  return (
    <>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-[13px]">
        <span className={ready ? 'font-medium text-sage' : 'font-medium text-amber-700'}>{ready ? 'Materials ✓' : 'Materials: Waiting'}</span>
        <span className={tailor ? 'font-medium text-sage' : 'font-medium text-amber-700'}>{tailor ? 'Tailor ✓' : 'Tailor: None yet'}</span>
      </p>
      {facts.length > 0 && <p className="border-t border-line pt-3 text-[13px] text-ink-muted">
        {facts.map((f, i) => (
          <React.Fragment key={f.text}>
            {i > 0 && ' · '}
            <span className={f.bad ? 'font-medium text-danger' : undefined}>{f.text}</span>
          </React.Fragment>
        ))}
      </p>}
    </>
  );
}
