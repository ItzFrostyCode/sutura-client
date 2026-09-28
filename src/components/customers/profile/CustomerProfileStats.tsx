import React from 'react';
import { DollarSign, Scissors, Package, Calendar, UserX } from 'lucide-react';

interface CustomerProfileStatsProps {
  readonly totalSpend: number;
  readonly activeJobsCount: number;
  readonly completedJobsCount: number;
  readonly appointmentsCount: number;
  readonly noShowCount: number;
}

export default function CustomerProfileStats({
  totalSpend,
  activeJobsCount,
  completedJobsCount,
  appointmentsCount,
  noShowCount,
}: CustomerProfileStatsProps) {
  const stats = [
    {
      label: 'Lifetime Spend',
      value: `₱${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      sub: 'Total amount paid',
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Active Pipeline',
      value: String(activeJobsCount),
      sub: 'In production',
      icon: Scissors,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      label: 'Completed Jobs',
      value: String(completedJobsCount),
      sub: 'Settled orders',
      icon: Package,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      label: 'Appointments',
      value: String(appointmentsCount),
      sub: 'Fittings & consults',
      icon: Calendar,
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      label: 'No-Shows',
      value: String(noShowCount),
      sub: noShowCount === 0 ? '100% Attendance' : 'Missed bookings',
      icon: UserX,
      color: noShowCount > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-canvas text-ink-muted border-line',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          // min-h-24 (not a fixed h-24) and break-words on the value: at
          // grid-cols-2 on a real 320-375px phone each card is only
          // ~105px of content width, and "Lifetime Spend" is the one
          // figure here that can realistically grow past what a fixed
          // h-6 single-line box could hold without clipping or spilling
          // past the card's edge (the card has no overflow-hidden of its
          // own to catch it).
          <div key={stat.label} className="min-h-24 bg-surface border border-line rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">{stat.label}</span>
              <div className={`p-1.5 rounded-lg border ${stat.color} shrink-0`}>
                <Icon size={13} />
              </div>
            </div>
            <div>
              <div className="min-h-6 flex items-baseline font-black font-mono text-base sm:text-lg text-ink break-words">
                {stat.value}
              </div>
              <div className="text-[10px] text-ink-muted leading-none mt-0.5 truncate">{stat.sub}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
