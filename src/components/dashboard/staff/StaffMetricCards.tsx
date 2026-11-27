import React from 'react';
import Link from 'next/link';
import type { StaffOverview } from './useStaffOverview';

const CARDS: { key: keyof Pick<StaffOverview, 'orders_in_production' | 'quality_checks_needed' | 'pending_fittings' | 'my_jobs'>; label: string; href: string }[] = [
  { key: 'orders_in_production', label: 'Orders in production', href: '/dashboard/jobs' },
  { key: 'quality_checks_needed', label: 'Quality checks needed', href: '/dashboard/jobs?stage=qc_ironing' },
  { key: 'pending_fittings', label: 'Pending fittings', href: '/dashboard/appointments' },
  { key: 'my_jobs', label: 'My jobs', href: '/dashboard/jobs?mine=1' },
];

export default function StaffMetricCards({ data }: Readonly<{ data: StaffOverview }>) {
  return (
    <div className="grid grid-cols-2 min-[900px]:grid-cols-4 gap-3">
      {CARDS.map((c) => (
        <Link key={c.key} href={c.href} className="bg-surface border border-line p-4 min-h-[88px] hover:bg-canvas transition-colors">
          <p className="text-[28px] leading-[1.2] font-bold text-ink">{data[c.key]}</p>
          <p className="text-xs text-ink-muted mt-1">{c.label}</p>
        </Link>
      ))}
    </div>
  );
}
