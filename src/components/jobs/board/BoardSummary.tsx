'use client';

import React from 'react';
import type { Job } from '../jobHelpers';
import { getDueStatus, isLateBalance } from '../jobHelpers';
import { needsShop, shopStageOf } from '../jobStage';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;

function Figure({ label, value, alert }: Readonly<{ label: string; value: React.ReactNode; alert?: boolean }>) {
  return (
    <div className="min-w-0 px-4 py-3">
      <dt className="truncate text-[13px] text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 truncate text-[22px] font-semibold leading-tight tracking-tight ${alert ? 'text-danger' : 'text-ink'}`}>{value}</dd>
    </div>
  );
}

interface BoardSummaryProps {
  readonly jobs: Job[];
  readonly canSeeMoney: boolean;
  readonly waitingAppointmentsCount?: number;
}

/** The numbers an owner wants first, in one strip: how many orders are open, what needs the shop, what is late, what is owed. */
export default function BoardSummary({ jobs, canSeeMoney }: BoardSummaryProps) {
  const active = jobs.filter((j) => {
    const s = shopStageOf(j);
    return s !== null && s !== 'done';
  });
  if (active.length === 0) return null;

  const overdue = active.filter((j) => getDueStatus(j.due_date, j.status)?.label === 'Overdue').length;
  const soon = active.filter((j) => getDueStatus(j.due_date, j.status)?.label === 'Due Soon').length;
  const lateBalances = jobs.filter(isLateBalance);
  const toCollect = active.reduce((sum, j) => sum + (Number.parseFloat(String(j.balance)) || 0), 0);

  return (
    <dl className={`grid grid-cols-2 divide-x divide-espresso/[0.06] overflow-hidden rounded-xl border border-espresso/[0.08] bg-white sm:grid-cols-4 ${canSeeMoney ? 'lg:grid-cols-6' : ''}`}>
      <Figure label="Active orders" value={active.length} />
      <Figure label="Needs the shop" value={active.filter(needsShop).length} />
      <Figure label="Due in 2 days" value={soon} />
      <Figure label="Overdue" value={overdue} alert={overdue > 0} />
      {canSeeMoney && <Figure label="Balance to collect" value={peso(toCollect)} />}
      {canSeeMoney && lateBalances.length > 0 && <Figure label="Past the pay-by date" value={`${lateBalances.length} · ${peso(lateBalances.reduce((s, j) => s + (Number.parseFloat(String(j.balance)) || 0), 0))}`} alert />}
    </dl>
  );
}
