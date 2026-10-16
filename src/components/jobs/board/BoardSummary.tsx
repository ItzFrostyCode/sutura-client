import type { ReactNode } from 'react';
import { getDueStatus, type Job } from '../jobHelpers';
import { needsShop, shopStageOf } from '../jobStage';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

function Figure({ label, value, tone = 'text-ink' }: Readonly<{ label: string; value: ReactNode; tone?: string }>) {
  return (
    <div className="min-w-0">
      <dd className={`text-xl font-semibold ${tone}`}>{value}</dd>
      <dt className="truncate text-xs text-ink-muted">{label}</dt>
    </div>
  );
}

/** Four numbers worked out from the orders on screen. Nothing is stored or estimated. */
export default function BoardSummary({ jobs, canSeeMoney }: Readonly<{ jobs: Job[]; canSeeMoney: boolean }>) {
  const active = jobs.filter((j) => { const s = shopStageOf(j); return s !== null && s !== 'done'; });
  if (active.length === 0) return null;
  const overdue = active.filter((j) => getDueStatus(j.due_date, j.status)?.label === 'Overdue').length;
  const soon = active.filter((j) => getDueStatus(j.due_date, j.status)?.label === 'Due Soon').length;
  const waiting = active.filter(needsShop).length;
  const toCollect = active.reduce((sum, j) => sum + (Number.parseFloat(String(j.balance)) || 0), 0);

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-b border-line pb-4 sm:grid-cols-3 lg:grid-cols-5">
      <Figure label="Active orders" value={active.length} />
      <Figure label="Waiting on you" value={waiting} tone={waiting > 0 ? 'text-amber-700' : 'text-ink'} />
      <Figure label="Due in 2 days" value={soon} />
      <Figure label="Overdue" value={overdue} tone={overdue > 0 ? 'text-danger' : 'text-ink'} />
      {canSeeMoney && <Figure label="Balance to collect" value={peso(toCollect)} />}
    </dl>
  );
}
