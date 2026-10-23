import React from 'react';
import type { Job } from '../jobHelpers';

const num = (v: unknown) => Number.parseFloat(String(v ?? '0')) || 0;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

/** True for a card in the Done column. */
export const isDoneCard = (job: Job) => job.status === 'completed';

/** The Done card's facts: "Handed over Oct 22 · Paid ₱4,500" (the money is for owner / branch manager). It has no button. */
export default function DoneFacts({ job, canSeeMoney }: Readonly<{ job: Job; canSeeMoney: boolean }>) {
  const date = job.last_handover_at ?? job.updated_at;
  const total = num(job.total_amount);
  const paid = Math.max(0, total - num(job.balance) - num(job.discount_amount));
  const parts = [
    date ? `Handed over ${day(date)}` : 'Handed over',
    canSeeMoney ? (total <= 0.005 ? 'No charge' : `Paid ₱${paid.toLocaleString()}`) : null,
  ].filter((p): p is string => p !== null);

  return <p className="border-t border-line pt-3 text-[13px] text-ink-muted">{parts.join(' · ')}</p>;
}
