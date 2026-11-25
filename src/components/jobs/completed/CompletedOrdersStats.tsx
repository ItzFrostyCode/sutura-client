import React from 'react';
import { CheckCircle2, Wallet, CalendarCheck, Timer, TrendingUp, TrendingDown } from 'lucide-react';
import type { CompletedStats } from './useCompletedOrders';

const peso = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "+5%" / "-3%" against the 30 days before; nothing when there's no earlier data to compare. */
function TrendTag({ value }: { readonly value: number | null }) {
  if (value === null) return null;
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      title="Last 30 days compared with the 30 days before"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-bold tabular-nums ${up ? 'bg-emerald-500/10 text-emerald-800' : 'bg-danger/10 text-danger'}`}
    >
      <Icon size={12} />
      {up ? '+' : ''}{value}%
    </span>
  );
}

interface CardProps {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly note: string;
  readonly icon: React.ElementType;
  readonly trend?: number | null;
}

function StatCard({ label, value, note, icon: Icon, trend = null }: CardProps) {
  return (
    <div className="bg-surface border border-line rounded-xl p-5 shadow-2xs flex flex-col justify-between h-full min-h-[125px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-taupe/10 text-taupe flex items-center justify-center shrink-0">
          <Icon size={15} />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-2xl font-black text-ink tabular-nums tracking-tight break-words min-w-0">{value}</p>
          <TrendTag value={trend} />
        </div>
        <p className="text-[11px] text-ink-muted mt-0.5">{note}</p>
      </div>
    </div>
  );
}

export function CompletedOrdersStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface border border-line rounded-xl p-5 min-h-[125px] animate-pulse">
          <div className="h-3 w-24 bg-sunken rounded" />
          <div className="h-7 w-28 bg-sunken rounded mt-8" />
        </div>
      ))}
    </div>
  );
}

export default function CompletedOrdersStats({ stats }: { readonly stats: CompletedStats }) {
  const days = stats.avg_handling_days;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch">
      <StatCard
        label="Total Completed"
        value={stats.total_completed.toLocaleString('en-PH')}
        note="Orders finished and claimed"
        icon={CheckCircle2}
        trend={stats.total_completed_trend}
      />
      <StatCard
        label="Value"
        value={peso(stats.total_value)}
        note="Total of completed orders, after discounts"
        icon={Wallet}
        trend={stats.total_value_trend}
      />
      <StatCard
        label="Completed Today"
        value={stats.completed_today.toLocaleString('en-PH')}
        note={stats.completed_today === 1 ? 'Order completed today' : 'Orders completed today'}
        icon={CalendarCheck}
      />
      <StatCard
        label="Average Handling"
        value={days === null ? '—' : `${days} ${days === 1 ? 'day' : 'days'}`}
        note="From intake to pickup"
        icon={Timer}
      />
    </div>
  );
}
