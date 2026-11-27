import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { SERVICE_CATEGORY_LABELS, type ServiceCategory } from '@/lib/canonicalTaxonomy';
import type { Service, ServicePackage } from './serviceHelpers';

// Fixed order, same palette as the catalog's Revenue by Category so the two tabs read alike.
const COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#8a5fd0', '#9A8073'];

function PieLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, percent = 0 }: { cx?: number; cy?: number; midAngle?: number; outerRadius?: number; percent?: number }) {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  return (
    <text x={cx + (outerRadius + 18) * Math.cos(-midAngle * R)} y={cy + (outerRadius + 18) * Math.sin(-midAngle * R)} fill="#827A73" fontSize={11} textAnchor="middle" dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function ServiceRevenueByCategoryChart({ services, packages = [] }: Readonly<{ services: Service[]; packages?: ServicePackage[] }>) {
  const data = useMemo(() => {
    const by = new Map<string, number>();
    services.forEach((s) => by.set(s.service_category || 'other', (by.get(s.service_category || 'other') ?? 0) + Number(s.total_revenue || 0)));
    packages.forEach((p) => by.set(p.service_category || 'other', (by.get(p.service_category || 'other') ?? 0) + Number(p.total_revenue || 0)));
    return Array.from(by.entries())
      .filter(([, v]) => v > 0)
      .map(([k, value], i) => ({ name: SERVICE_CATEGORY_LABELS[k as ServiceCategory] ?? 'Other', value, color: COLORS[i % COLORS.length] }));
  }, [services, packages]);
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={16} className="text-taupe" />
        <h3 className="text-sm font-semibold text-ink">Revenue by Category</h3>
      </div>
      {data.length === 0 ? (
        <div className="h-56 flex items-center justify-center text-xs text-ink-faint">No revenue yet.</div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={2} dataKey="value" labelLine={false} label={PieLabel}>
                  {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`₱${Number(v).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, 'Revenue']} contentStyle={{ backgroundColor: '#fff', borderColor: '#EBE6E0', borderRadius: 0, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-bold text-ink">₱{total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toFixed(0)}</p>
              <p className="text-[10px] text-ink-faint font-medium">Total</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 w-full">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-ink-body">
                <span className="w-2.5 h-2.5 shrink-0" style={{ background: d.color }} />
                <span className="truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
