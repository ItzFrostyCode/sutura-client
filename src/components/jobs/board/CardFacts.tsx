import React from 'react';
import { getDueStatus, type Job } from '../jobHelpers';
import ConfirmedFacts, { isConfirmedCard } from './ConfirmedFacts';
import MakingFacts, { isMakingCard } from './MakingFacts';
import ReadyFacts from './ReadyFacts';
import DoneFacts, { isDoneCard } from './DoneFacts';
import { isReadyCard } from './readyAction';

const day = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
};

/** Request and closed cards: when it is due (or was received) and what is owed. */
function RequestFacts({ job, canSeeMoney }: Readonly<{ job: Job; canSeeMoney: boolean }>) {
  const late = getDueStatus(job.due_date, job.status)?.label === 'Overdue';
  const balance = Number.parseFloat(String(job.balance)) || 0;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-line pt-3 text-[13px]">
      <span className={late ? 'font-medium text-danger' : 'text-ink-muted'}>{job.due_date ? `Due ${day(job.due_date)}` : `Received ${day(job.created_at)}`}</span>
      {canSeeMoney && <span className={balance > 0 ? 'font-medium text-ink' : 'text-sage'}>{balance > 0 ? `₱${balance.toLocaleString()} due` : 'Paid'}</span>}
    </div>
  );
}

/** The facts line of a board card, per column (Request, Confirmed, Being made, Ready, Done). Money shows for the owner / branch manager only. */
export default function CardFacts({ job, canSeeMoney }: Readonly<{ job: Job; canSeeMoney: boolean }>) {
  if (isConfirmedCard(job)) return <ConfirmedFacts job={job} canSeeMoney={canSeeMoney} />;
  if (isMakingCard(job)) return <MakingFacts job={job} canSeeMoney={canSeeMoney} />;
  if (isReadyCard(job)) return <ReadyFacts job={job} canSeeMoney={canSeeMoney} />;
  if (isDoneCard(job)) return <DoneFacts job={job} canSeeMoney={canSeeMoney} />;
  return <RequestFacts job={job} canSeeMoney={canSeeMoney} />;
}
