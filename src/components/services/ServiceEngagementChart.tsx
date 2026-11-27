import React from 'react';
import { Activity, Heart, ShoppingBag, Star } from 'lucide-react';
import type { Service, ServicePackage } from './serviceHelpers';

// Saves, orders and reviews side by side, each bar scaled against the biggest of the three.
// (Services have no page-view count, so this is not a funnel like the catalog's.)
export default function ServiceEngagementChart({ services, packages = [] }: Readonly<{ services: Service[]; packages?: ServicePackage[] }>) {
  const sum = (pick: (s: Service) => number | undefined) => services.reduce((t, s) => t + (pick(s) || 0), 0);
  const stages = [
    { label: 'Saves', value: sum((s) => s.saves_count), icon: Heart, color: '#86b6ef' },
    { label: 'Orders', value: sum((s) => s.job_orders_count) + packages.reduce((t, p) => t + (p.job_orders_count || 0), 0), icon: ShoppingBag, color: '#3987e5' },
    { label: 'Reviews', value: sum((s) => s.reviews_count), icon: Star, color: '#1c5cab' },
  ];
  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">Engagement</h3>
      </div>
      <div className="space-y-3.5">
        {stages.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-ink-body"><Icon size={12} style={{ color: s.color }} /> {s.label}</span>
                <span className="font-bold text-ink">{s.value.toLocaleString()}</span>
              </div>
              <div className="h-2.5 bg-canvas w-full">
                <div className="h-full" style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 4 : 0)}%`, backgroundColor: s.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
