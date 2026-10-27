import React from 'react';
import { Scissors, ShoppingBag, Users, Calendar, Package, UserCog, Building2 } from 'lucide-react';
import { AnalyticsData } from './dashboardHelpers';

interface DashboardMetricsProps {
  readonly data: AnalyticsData | null;
}

export default function DashboardMetrics({
  data,
}: DashboardMetricsProps) {
  // "Total Revenue" used to sit here too, right below Financial Snapshot's
  // own "Today's Revenue" hero tile — two revenue numbers, differently
  // scoped (lifetime vs. today), with near-identical labels stacked
  // directly on top of each other read as a mistake, not two real facts.
  // Lifetime revenue already has a home (Reports' own hero); dropped from
  // here so this section covers ground Financial Snapshot doesn't.
  const metricsList = [
    {
      label: 'Orders',
      value: data?.total_jobs || 0,
      icon: <Scissors size={16} className="text-taupe" />,
    },
    {
      label: 'Collections',
      value: data?.total_collections || 0,
      icon: <ShoppingBag size={16} className="text-taupe" />,
    },
    {
      label: 'Customers',
      value: data?.total_customers || 0,
      icon: <Users size={16} className="text-taupe" />,
    },
    {
      label: 'Appointments',
      value: data?.total_appointments || 0,
      icon: <Calendar size={16} className="text-taupe" />,
    },
    {
      label: 'Services',
      value: data?.total_services || 0,
      icon: <Package size={16} className="text-taupe" />,
    },
    {
      label: 'Staff',
      value: data?.total_staff || 0,
      icon: <UserCog size={16} className="text-taupe" />,
    },
    {
      label: 'Branches',
      value: data?.total_branches || 0,
      icon: <Building2 size={16} className="text-taupe" />,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-taupe">Shop at a Glance</p>
      {/* Flush, divider-separated band — matches Financial Snapshot's own
          visual language directly above it, instead of a second, visually
          unrelated grid of individually-boxed cards stacked underneath. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 bg-surface border border-line rounded-2xl divide-x divide-y sm:divide-y-0 divide-line text-ink">
        {metricsList.map((m) => (
          <div key={m.label} className="p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 text-ink-muted">
              {m.icon}
              <p className="text-[11px] font-medium uppercase tracking-wider">{m.label}</p>
            </div>
            <p className="text-xl font-semibold tracking-tight">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
